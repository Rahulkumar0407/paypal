"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Decision } from "@/types";
import { getVisitorStoreId } from "@/lib/demo";
import { approveEscalation, GuardError, listInbox, rejectEscalation } from "@/lib/guard";
import { proposeFollowUp } from "@/lib/recovery";

export type InboxOutcome =
  | { ok: true; receiptId: string; choice: "approve" | "decline"; decision: Decision | null; message: string }
  | { ok: false; receiptId: string; message: string };

const inputSchema = z.object({ receiptId: z.string().min(1).max(100), choice: z.enum(["approve", "decline"]) });

/**
 * The owner approves or declines an escalation. Approval clears ESCALATE rules only: the Guard re-checks its BLOCK
 * rules before anything runs, and the receipt's newest event says what actually happened.
 */
export async function decideEscalation(receiptId: string, choice: "approve" | "decline"): Promise<InboxOutcome> {
  const parsed = inputSchema.safeParse({ receiptId, choice });
  if (!parsed.success) return { ok: false, receiptId, message: "That choice wasn't recognised. Reload the page and try again." };
  const storeId = await getVisitorStoreId();

  try {
    const item = (await listInbox(storeId)).find((i) => i.receipt.id === parsed.data.receiptId);
    if (!item || item.status !== "WAITING") {
      return { ok: false, receiptId, message: "This one has already been decided. Reload to see where it stands." };
    }
    const receipt =
      parsed.data.choice === "approve" ? await approveEscalation(storeId, parsed.data.receiptId) : await rejectEscalation(storeId, parsed.data.receiptId);
    for (const path of ["/today", "/fix", "/dues", "/approvals", "/receipts", "/dashboard"]) revalidatePath(path);

    const last = receipt.events.at(-1);
    switch (last?.kind) {
      case "EXECUTED":
        return { ok: true, receiptId, choice, decision: "APPROVE", message: `You approved it, and it's done. ${last.detail}` };
      case "RECHECK_BLOCKED":
        return { ok: true, receiptId, choice, decision: "BLOCK", message: `NeverShort checked once more and stopped it: ${last.detail} Nothing moved.` };
      case "EXECUTION_FAILED":
        return { ok: true, receiptId, choice, decision: null, message: `Approved, but it didn't go through: ${last.detail} Nothing moved.` };
      case "OWNER_REJECTED":
        return item.receipt.proposal.type === "HOLD_ORDER"
          ? { ok: true, receiptId, choice, decision: null, message: "Cleared. The order isn't held, and its money now counts in your forecast." }
          : { ok: true, receiptId, choice, decision: null, message: "Declined. Nothing will happen, and the receipt notes your choice." };
      default:
        return parsed.data.choice === "approve"
          ? { ok: true, receiptId, choice, decision: null, message: "You approved it. NeverShort runs its safety checks once more, then does it." }
          : { ok: true, receiptId, choice, decision: null, message: "Declined. Nothing will happen, and the receipt notes your choice." };
    }
  } catch (error) {
    console.error("[approvals] could not record the choice:", error instanceof Error ? error.message : error);
    if (error instanceof GuardError) return { ok: false, receiptId, message: error.message };
    return { ok: false, receiptId, message: "Couldn't run the safety check. Nothing has moved. Try again in a minute." };
  }
}

export type FollowUpOutcome = { ok: true; decision: Decision; reason: string; receiptId: string; receiptNumber: number } | { ok: false; message: string };

/**
 * The reminder helper's follow-up for an order that already had a reminder. It's a new attempt (the next sequence),
 * so the Margin Guard judges it on its own: it stops a follow-up to someone who has already paid, or after 2 in 48 hours.
 */
export async function sendFollowUp(orderId: string): Promise<FollowUpOutcome> {
  const parsed = z.string().min(1).max(100).safeParse(orderId);
  if (!parsed.success) return { ok: false, message: "That order wasn't recognised. Reload the page and try again." };
  const storeId = await getVisitorStoreId();
  try {
    const receipt = await proposeFollowUp(storeId, parsed.data);
    for (const path of ["/today", "/approvals", "/receipts"]) revalidatePath(path);
    return { ok: true, decision: receipt.decision.decision, reason: receipt.decision.headlineReason, receiptId: receipt.id, receiptNumber: receipt.number };
  } catch (error) {
    console.error("[approvals] could not propose the follow-up:", error instanceof Error ? error.message : error);
    if (error instanceof GuardError) return { ok: false, message: error.message };
    return { ok: false, message: "Couldn't run the safety check. Nothing was sent. Try again in a minute." };
  }
}
