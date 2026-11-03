"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionProposal, ActionType, Decision, Due, FixOption, StoreId } from "@/types";
import { getVisitorStoreId } from "@/lib/demo";
import { getDues, getFixOptions } from "@/lib/forecast";
import { GuardError, nextProposalKey, submitProposal } from "@/lib/guard";
import { nowIso, today } from "@/lib/shared/clock";
import { addDays, formatDay } from "@/lib/shared/dates";
import { formatDollars } from "@/lib/shared/money";

export type FixOutcome =
  | { ok: true; fixId: string; decision: Decision; reason: string; receiptId: string; receiptNumber: number }
  | { ok: false; fixId: string; message: string };

const fixIdSchema = z.string().min(1).max(100);

/**
 * The owner picks a fix. The server re-reads the option (never trusting amounts from the browser), turns it into a
 * proposal and hands it to the Margin Guard. The Guard decides; this only reports what it said.
 * TODO(Person 1, P1-8): move proposalForFix into lib/forecast (e.g. `proposeFix`) and call that instead.
 */
export async function sendFixToGuard(rawFixId: string): Promise<FixOutcome> {
  const parsed = fixIdSchema.safeParse(rawFixId);
  if (!parsed.success) return { ok: false, fixId: "", message: "That option wasn't recognised. Reload the page and pick again." };
  const fixId = parsed.data;
  const storeId = await getVisitorStoreId();

  try {
    const [fixes, dues] = await Promise.all([getFixOptions(storeId), getDues(storeId)]);
    const fix = fixes.find((f) => f.id === fixId);
    if (!fix) {
      return { ok: false, fixId, message: "That option isn't on offer any more. Your forecast may have changed: reload to see today's options." };
    }
    const proposal = await proposalForFix(fix, { storeId, dues });
    const receipt = await submitProposal(proposal);
    for (const path of ["/", "/fix", "/dues", "/approvals", "/receipts", "/dashboard"]) revalidatePath(path);
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
    if (error instanceof GuardError) return { ok: false, fixId, message: error.message };
    return { ok: false, fixId, message: "Couldn't run the safety check. Nothing has moved. Try again in a minute." };
  }
}

interface ProposalContext {
  storeId: StoreId;
  dues: Due[];
}

/** One proposal per fix kind, with the idempotency key from AGENTS.md section 4 (made by the Guard's own helper). */
async function proposalForFix(fix: FixOption, ctx: ProposalContext): Promise<ActionProposal> {
  const base = async (type: ActionType, target: ActionProposal["target"]) => {
    const { idempotencyKey, sequence } = await nextProposalKey(ctx.storeId, type, target.id);
    return {
      id: `prop_${randomUUID()}`,
      storeId: ctx.storeId,
      target,
      amountCents: fix.amountCents,
      proposedBy: { kind: "OWNER" } as const,
      idempotencyKey,
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
      const target = { kind: "STORE" as const, id: ctx.storeId, label: `${formatDollars(fix.dailyAmountCents)} a day until ${formatDay(fix.forDate)}` };
      return {
        ...(await base("SET_ASIDE", target)),
        type: "SET_ASIDE",
        params: { dailyAmountCents: fix.dailyAmountCents, startOn, endOn: addDays(startOn, fix.days - 1), forDate: fix.forDate },
      };
    }
    case "MOVE_PAYMENT": {
      const due = ctx.dues.find((d) => d.id === fix.dueId);
      if (!due || fix.moveToOn === null) throw new Error(`Move ${fix.id} has no payment to move`);
      const target = { kind: "DUE" as const, id: due.id, label: `${due.payeeName}, due ${formatDay(due.dueOn)}` };
      return { ...(await base("MOVE_PAYMENT", target)), type: "MOVE_PAYMENT", params: { dueId: due.id, fromOn: due.dueOn, toOn: fix.moveToOn } };
    }
    case "GAP_LOAN": {
      if (fix.loanFeeCents === null || fix.repayOn === null) throw new Error(`Gap loan ${fix.id} has no fee or repay date`);
      const target = { kind: "STORE" as const, id: ctx.storeId, label: `${formatDollars(fix.amountCents)}, for ${formatDay(fix.forDate)}` };
      return {
        ...(await base("GAP_LOAN", target)),
        type: "GAP_LOAN",
        params: { amountCents: fix.amountCents, feeCents: fix.loanFeeCents, repayOn: fix.repayOn },
      };
    }
  }
}
