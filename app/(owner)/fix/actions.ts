"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Decision } from "@/types";
import { getVisitorStoreId } from "@/lib/demo";
import { proposeFix } from "@/lib/forecast";
import { GuardError, submitProposal } from "@/lib/guard";

export type FixOutcome =
  | { ok: true; fixId: string; decision: Decision; reason: string; receiptId: string; receiptNumber: number }
  | { ok: false; fixId: string; message: string };

const fixIdSchema = z.string().min(1).max(200);

/**
 * The owner picks a fix. lib/forecast rebuilds it from today's numbers (never trusting amounts from the browser) as a
 * proposal, and the Margin Guard decides. This only reports what the Guard said.
 */
export async function sendFixToGuard(rawFixId: string): Promise<FixOutcome> {
  const parsed = fixIdSchema.safeParse(rawFixId);
  if (!parsed.success) return { ok: false, fixId: "", message: "That option wasn't recognised. Reload the page and pick again." };
  const fixId = parsed.data;
  const storeId = await getVisitorStoreId();

  try {
    const proposal = await proposeFix(storeId, fixId);
    if (!proposal) {
      return { ok: false, fixId, message: "That option isn't on offer any more. Your forecast may have changed: reload to see today's options." };
    }
    const receipt = await submitProposal(proposal);
    for (const path of ["/today", "/fix", "/dues", "/approvals", "/receipts", "/dashboard"]) revalidatePath(path);
    return { ok: true, fixId, decision: receipt.decision.decision, reason: receipt.decision.headlineReason, receiptId: receipt.id, receiptNumber: receipt.number };
  } catch (error) {
    console.error("[fix] could not send the fix to the Guard:", error instanceof Error ? error.message : error);
    if (error instanceof GuardError) return { ok: false, fixId, message: error.message };
    return { ok: false, fixId, message: "Couldn't run the safety check. Nothing has moved. Try again in a minute." };
  }
}
