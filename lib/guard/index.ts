/**
 * lib/guard: the Margin Guard, receipts, the approval inbox and the executor. Owner: Person 1.
 * Plain TypeScript, no AI (AGENTS.md section 4). Nothing happens to money without passing through here.
 *
 *   rules.ts     the 8 rules and the decision (pure)
 *   flow.ts      submit / approve / reject: the order of events (no database)
 *   context.ts   gathers the facts the rules need (read-only, fails closed)
 *   executor.ts  the only code that carries out actions
 *   repo.ts      receipts in the database (append-only)
 */
import type { ActionProposal, GuardDecision, InboxItem, Receipt, StoreId } from "@/types";
import { nowIso, today } from "@/lib/shared/clock";
import { getDb, isDatabaseConfigured } from "@/lib/shared/db";
import { contextLoader } from "./context";
import { createExecutor } from "./executor";
import { createGuard, type Guard } from "./flow";
import { prismaGuardRepo } from "./repo";

export { GuardError } from "./flow";
/** The idempotency key and sequence for a new proposal. */
export { nextProposalKey } from "@/lib/shared/keys";

let guard: Guard | null = null;

function realGuard(): Guard {
  if (!guard) {
    const db = getDb();
    guard = createGuard({
      repo: prismaGuardRepo(db),
      facts: contextLoader(db),
      execute: createExecutor(db),
      clock: () => ({ at: nowIso(), demoDate: today() }),
    });
  }
  return guard;
}

/** Run the 8 rules on a proposal. Saves nothing and runs nothing. */
export async function evaluateProposal(proposal: ActionProposal): Promise<GuardDecision> {
  return realGuard().evaluate(proposal);
}

/** Decide, save the receipt, and run the executor if approved. The only way an action happens. */
export async function submitProposal(proposal: ActionProposal): Promise<Receipt> {
  return realGuard().submit(proposal);
}

/** Escalations waiting for the owner, then every other decision, newest first. Empty without a database. */
export async function listInbox(storeId: StoreId): Promise<InboxItem[]> {
  return isDatabaseConfigured() ? realGuard().inbox(storeId) : [];
}

/** Every receipt, newest first. Empty without a database. */
export async function listReceipts(storeId: StoreId): Promise<Receipt[]> {
  return isDatabaseConfigured() ? prismaGuardRepo(getDb()).listReceipts(storeId) : [];
}

export async function getReceipt(storeId: StoreId, receiptId: string): Promise<Receipt | null> {
  return isDatabaseConfigured() ? prismaGuardRepo(getDb()).getReceipt(storeId, receiptId) : null;
}

/** The owner approves an ESCALATE. The BLOCK rules are re-checked before anything runs. Throws GuardError if already decided. */
export async function approveEscalation(storeId: StoreId, receiptId: string): Promise<Receipt> {
  return realGuard().approve(storeId, receiptId);
}

/** The owner declines an ESCALATE. Throws GuardError if already decided. */
export async function rejectEscalation(storeId: StoreId, receiptId: string): Promise<Receipt> {
  return realGuard().reject(storeId, receiptId);
}
