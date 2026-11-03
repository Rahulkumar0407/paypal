/**
 * lib/recovery: the Recovery agent. Owner: Person 1.
 * Finds abandoned or failed checkouts and PROPOSES reminders. It never sends anything itself: every proposal goes to
 * the Margin Guard (lib/guard), whose executor creates the fresh PayPal link and writes the simulated outbox.
 * The search is a deterministic query. The message is drafted by lib/ai (checked by code, with a template fallback).
 */
import { randomUUID } from "node:crypto";
import type { ActionProposal, OutboxMessage, Receipt, RecoveryCandidate, StoreId } from "@/types";
import { ensureStore } from "@/lib/demo";
import { submitProposal } from "@/lib/guard";
import { atDemoDate, nowIso, realNow, today } from "@/lib/shared/clock";
import { getDb, isDatabaseConfigured } from "@/lib/shared/db";
import { nextProposalKey } from "@/lib/shared/keys";
import { draftReminder } from "@/lib/ai";


const CONTACT_WINDOW_MS = 48 * 60 * 60 * 1000;

/** Abandoned or failed checkouts, abandoned first, newest first. Without a database, none. */
export async function findRecoveryCandidates(storeId: StoreId): Promise<RecoveryCandidate[]> {
  if (!isDatabaseConfigured()) return [];
  const db = getDb();
  const since = new Date(realNow().getTime() - CONTACT_WINDOW_MS);
  const orders = await db.order.findMany({
    where: { storeId, status: { in: ["ABANDONED", "FAILED"] } },
    include: { customer: { select: { name: true, contactConsent: true } }, _count: { select: { outbox: { where: { sentAt: { gte: since } } } } } },
  });
  return orders
    .map((o) => ({
      orderId: o.id,
      orderNumber: o.number,
      customerId: o.customerId,
      customerName: o.customer.name,
      status: o.status as RecoveryCandidate["status"],
      amountCents: o.totalCents,
      lastActivityOn: o.placedOn,
      contactConsent: o.customer.contactConsent,
      remindersSentLast48h: o._count.outbox,
    }))
    .sort((a, b) => Number(a.status === "FAILED") - Number(b.status === "FAILED") || b.lastActivityOn.localeCompare(a.lastActivityOn) || b.orderNumber - a.orderNumber);
}

/** A SEND_REMINDER proposal for one order: the next sequence, its idempotency key, and the drafted message. */
export async function proposeReminder(storeId: StoreId, orderId: string): Promise<ActionProposal> {
  const order = await getDb().order.findFirst({
    where: { id: orderId, storeId },
    include: { customer: { select: { name: true } }, items: { include: { product: { select: { name: true } } } } },
  });
  if (!order) throw new Error(`Order ${orderId} isn't in store ${storeId}.`);
  const { idempotencyKey, sequence } = await nextProposalKey(storeId, "SEND_REMINDER", order.id);
  const draft = await draftReminder({
    firstName: order.customer.name.split(" ")[0] ?? order.customer.name,
    orderNumber: order.number,
    items: order.items.map((i) => i.product.name),
    sequence,
  });
  return {
    id: `prop_${randomUUID()}`,
    storeId,
    type: "SEND_REMINDER",
    target: { kind: "ORDER", id: order.id, label: `Order #${order.number}, ${order.customer.name}` },
    amountCents: order.totalCents,
    proposedBy: { kind: "AGENT", agent: "RECOVERY" },
    idempotencyKey,
    sequence,
    draftText: draft.body,
    params: { orderId: order.id, customerId: order.customerId, channel: "SIMULATED_OUTBOX" },
    createdAt: nowIso(),
    demoDate: today(),
  };
}

/**
 * The agent's round: one first reminder for every unfinished checkout that hasn't had one proposed yet, each sent to
 * the Guard. Runs when the owner opens Approvals. Safe to run again: orders already handled are skipped, and a repeat
 * that slips through is blocked by the Guard's duplicate rule.
 */
export async function runRecoveryAgent(storeId: StoreId): Promise<Receipt[]> {
  if (!isDatabaseConfigured()) return [];
  // A visitor's first page renders alongside the layout that creates their copy; make sure it exists first.
  await ensureStore(storeId);
  const [candidates, proposed] = await Promise.all([
    findRecoveryCandidates(storeId),
    getDb().proposal.findMany({ where: { storeId, type: "SEND_REMINDER" }, select: { targetId: true } }),
  ]);
  const done = new Set(proposed.map((p) => p.targetId));
  const receipts: Receipt[] = [];
  for (const c of candidates.filter((x) => !done.has(x.orderId))) {
    receipts.push(await submitProposal(await proposeReminder(storeId, c.orderId)));
  }
  return receipts;
}

/** A follow-up reminder for an order that already had one: the next sequence, judged by the Guard like any other. */
export async function proposeFollowUp(storeId: StoreId, orderId: string): Promise<Receipt> {
  return submitProposal(await proposeReminder(storeId, orderId));
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
