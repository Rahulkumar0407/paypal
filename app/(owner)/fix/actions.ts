"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionProposal, Decision, Due, FixOption, Receipt, StoreId } from "@/types";
import { getDemoStoreStatus, getVisitorStoreId } from "@/lib/demo";
import { getDues, getFixOptions } from "@/lib/forecast";
import { listReceipts, submitProposal } from "@/lib/guard";
import { nowIso, today } from "@/lib/shared/clock";
import { addDays, formatDay } from "@/lib/shared/dates";

export type FixOutcome =
  | { ok: true; fixId: string; decision: Decision; reason: string; receiptId: string; receiptNumber: number }
  | { ok: false; fixId: string; message: string };

const fixIdSchema = z.string().min(1).max(100);

/**
 * The owner picks a fix. The server re-reads the option (never trusting amounts from the browser), turns it into a
 * proposal and hands it to the Margin Guard. The Guard decides; this only reports what it said.
 * TODO(Person 3, P3-2): move proposalForFix into lib/forecast (e.g. `proposeFix`) and call that instead.
 */
export async function sendFixToGuard(rawFixId: string): Promise<FixOutcome> {
  const parsed = fixIdSchema.safeParse(rawFixId);
  if (!parsed.success) return { ok: false, fixId: "", message: "That option wasn't recognised. Reload the page and pick again." };
  const fixId = parsed.data;
  const storeId = await getVisitorStoreId();

  try {
    const [fixes, dues, receipts, status] = await Promise.all([
      getFixOptions(storeId),
      getDues(storeId),
      listReceipts(storeId),
      getDemoStoreStatus(storeId).catch(() => null),
    ]);
    const fix = fixes.find((f) => f.id === fixId);
    if (!fix) {
      return { ok: false, fixId, message: "That option isn't on offer any more. Your forecast may have changed: reload to see today's options." };
    }
    const proposal = proposalForFix(fix, { storeId, runId: status?.demoRunId ?? "run_local", dues, receipts });
    const receipt = await submitProposal(proposal);
    for (const path of ["/", "/fix", "/approvals", "/receipts"]) revalidatePath(path);
    return {
      ok: true,
      fixId,
      decision: receipt.decision.decision,
      reason: receipt.decision.headlineReason,
      receiptId: receipt.id,
      receiptNumber: receipt.number,
    };
  } catch (error) {
    console.error("[fix] could not send the fix to the Guard:", error instanceof Error ? error.message : error);
    return { ok: false, fixId, message: "Couldn't run the safety check. Nothing has moved. Try again in a minute." };
  }
}

interface ProposalContext {
  storeId: StoreId;
  runId: string;
  dues: Due[];
  receipts: Receipt[];
}

/** One proposal per fix kind, with the idempotency key from AGENTS.md section 4. */
function proposalForFix(fix: FixOption, ctx: ProposalContext): ActionProposal {
  const base = (type: ActionProposal["type"], target: ActionProposal["target"]) => {
    // Sequence: 1 + how many times this action has already been carried out on this target.
    const executed = ctx.receipts.filter(
      (r) => r.proposal.type === type && r.proposal.target.id === target.id && r.events.some((e) => e.kind === "EXECUTED"),
    ).length;
    const sequence = executed + 1;
    return {
      id: `prop_${randomUUID()}`,
      storeId: ctx.storeId,
      target,
      amountCents: fix.amountCents,
      proposedBy: { kind: "OWNER" } as const,
      idempotencyKey: `${ctx.runId}:${type}:${target.id}:${sequence}`,
      sequence,
      draftText: null,
      createdAt: nowIso(),
      demoDate: today(),
    };
  };

  switch (fix.kind) {
    case "SET_ASIDE": {
      if (fix.dailyAmountCents === null || fix.days === null) throw new Error(`Set-aside ${fix.id} has no daily amount`);
      const startOn = today();
      const target = { kind: "STORE" as const, id: ctx.storeId, label: `Set aside for ${formatDay(fix.forDate)}` };
      return {
        ...base("SET_ASIDE", target),
        type: "SET_ASIDE",
        params: { dailyAmountCents: fix.dailyAmountCents, startOn, endOn: addDays(startOn, fix.days - 1), forDate: fix.forDate },
      };
    }
    case "MOVE_PAYMENT": {
      const due = ctx.dues.find((d) => d.id === fix.dueId);
      if (!due || fix.moveToOn === null) throw new Error(`Move ${fix.id} has no payment to move`);
      const target = { kind: "DUE" as const, id: due.id, label: `${due.payeeName}, due ${formatDay(due.dueOn)}` };
      return { ...base("MOVE_PAYMENT", target), type: "MOVE_PAYMENT", params: { dueId: due.id, fromOn: due.dueOn, toOn: fix.moveToOn } };
    }
    case "GAP_LOAN": {
      if (fix.loanFeeCents === null || fix.repayOn === null) throw new Error(`Gap loan ${fix.id} has no fee or repay date`);
      const target = { kind: "STORE" as const, id: ctx.storeId, label: `Gap loan for ${formatDay(fix.forDate)}` };
      return {
        ...base("GAP_LOAN", target),
        type: "GAP_LOAN",
        params: { amountCents: fix.amountCents, feeCents: fix.loanFeeCents, repayOn: fix.repayOn },
      };
    }
  }
}
