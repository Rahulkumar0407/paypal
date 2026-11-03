/**
 * lib/recovery: the Recovery agent. Owner: Person 3.
 * Finds abandoned or failed checkouts and PROPOSES reminders. It never sends anything itself:
 * every proposal goes to the Margin Guard (lib/guard).
 * Foundation stubs by Person 1 return FAKE data from mocks/.
 */
import type { ActionProposal, OutboxMessage, RecoveryCandidate, StoreId } from "@/types";
import { mockReminderProposal } from "@/mocks/guard";
import { mockRecoveryCandidates } from "@/mocks/recovery";
import { atDemoDate } from "@/lib/shared/clock";
import { getDb, isDatabaseConfigured } from "@/lib/shared/db";

/** Abandoned or failed checkouts worth a reminder. Deterministic query, no AI. */
export async function findRecoveryCandidates(storeId: StoreId): Promise<RecoveryCandidate[]> {
  // TODO(Person 3): query ABANDONED / FAILED orders and recent reminders (P3-2).
  void storeId;
  return mockRecoveryCandidates;
}

/** Build a SEND_REMINDER proposal for one order, with a draft from lib/ai (or a template). */
export async function proposeReminder(storeId: StoreId, orderId: string): Promise<ActionProposal> {
  // TODO(Person 3): next sequence number, idempotency key, draft via lib/ai draftReminder (P3-2).
  return { ...mockReminderProposal, storeId, target: { ...mockReminderProposal.target, id: orderId } };
}

/** Reminders the Guard's executor placed in the simulated outbox, newest first. */
export async function listOutbox(storeId: StoreId): Promise<OutboxMessage[]> {
  if (!isDatabaseConfigured()) return [];
  const rows = await getDb().outboxMessage.findMany({ where: { storeId }, include: { proposal: { select: { demoDate: true } } }, orderBy: { sentAt: "desc" } });
  return rows.map((m) => ({
    id: m.id,
    storeId: m.storeId,
    proposalId: m.proposalId,
    orderId: m.orderId,
    to: m.to,
    subject: m.subject,
    body: m.body,
    checkoutUrl: m.checkoutUrl,
    paypalOrderId: m.paypalOrderId,
    sentAt: atDemoDate(m.sentAt, m.proposal.demoDate),
    simulated: true,
  }));
}
