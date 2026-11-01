/**
 * lib/guard: the Margin Guard, receipts and the executor. Owner: Person 2.
 * Plain TypeScript, no AI, fully unit-tested (AGENTS.md section 4).
 * Foundation stubs by Person 1 return FAKE decisions from mocks/. Replace each TODO.
 */
import type { ActionProposal, GuardDecision, InboxItem, Receipt, StoreId } from "@/types";
import {
  mockApproveReminder,
  mockApproveSetAside,
  mockBlockSecondReminder,
  mockEscalateGapLoan,
  mockEscalateHold,
  mockEscalatePaySupplier,
  mockInbox,
  mockReceipts,
} from "@/mocks/guard";

/** Run the 8 rules on a proposal. Pure decision; saves nothing. */
export async function evaluateProposal(proposal: ActionProposal): Promise<GuardDecision> {
  // TODO(Person 2): context loader + pure rules + BLOCK > ESCALATE > APPROVE (P2-3).
  const byType: Record<ActionProposal["type"], GuardDecision> = {
    SEND_REMINDER: proposal.sequence > 1 ? mockBlockSecondReminder : mockApproveReminder,
    SET_ASIDE: mockApproveSetAside,
    MOVE_PAYMENT: mockEscalateGapLoan,
    GAP_LOAN: mockEscalateGapLoan,
    PAY_SUPPLIER: mockEscalatePaySupplier,
    REFUND: mockEscalateGapLoan,
    HOLD_ORDER: mockEscalateHold,
  };
  return { ...byType[proposal.type], proposalId: proposal.id };
}

/** Decide, save the receipt, and run the executor if approved. The only way an action happens. */
export async function submitProposal(proposal: ActionProposal): Promise<Receipt> {
  // TODO(Person 2): save Proposal + Receipt, then execute on APPROVE (P2-3).
  const decision = await evaluateProposal(proposal);
  const template = mockReceipts.find((r) => r.decision.decision === decision.decision) ?? mockReceipts[0]!;
  return { ...template, storeId: proposal.storeId, proposal, decision };
}

/** Escalations waiting for the owner, then recent decisions. */
export async function listInbox(storeId: StoreId): Promise<InboxItem[]> {
  // TODO(Person 2): read Receipt rows with their latest event.
  void storeId;
  return mockInbox;
}

export async function listReceipts(storeId: StoreId): Promise<Receipt[]> {
  // TODO(Person 2): newest first.
  void storeId;
  return mockReceipts;
}

export async function getReceipt(storeId: StoreId, receiptId: string): Promise<Receipt | null> {
  // TODO(Person 2)
  void storeId;
  return mockReceipts.find((r) => r.id === receiptId) ?? null;
}

/** The owner approves an ESCALATE. BLOCK rules are re-checked before anything runs. */
export async function approveEscalation(storeId: StoreId, receiptId: string): Promise<Receipt> {
  // TODO(Person 2): append OWNER_APPROVED, re-check BLOCK rules, execute (P2-3).
  const receipt = (await getReceipt(storeId, receiptId)) ?? mockReceipts[0]!;
  return receipt;
}

export async function rejectEscalation(storeId: StoreId, receiptId: string): Promise<Receipt> {
  // TODO(Person 2): append OWNER_REJECTED.
  const receipt = (await getReceipt(storeId, receiptId)) ?? mockReceipts[0]!;
  return receipt;
}
