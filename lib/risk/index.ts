/**
 * lib/risk: the risk check and the alerts. Owner: Person 1.
 * Fixed rules score each pending or failed order (lib/shared/risk.ts); a flagged order gets a HOLD_ORDER proposal
 * through the Margin Guard, with one line on why (worded by lib/ai, with a template). The forecast already leaves a
 * flagged order out of money in until the owner clears it (declines the hold).
 */
import { randomUUID } from "node:crypto";
import type { ActionProposal, Alert, Receipt, RiskFlag, StoreId } from "@/types";
import { explainRisk } from "@/lib/ai";
import { getDues, getForecast, getPatternEvidence, listRecentPayments } from "@/lib/forecast";
import { submitProposal } from "@/lib/guard";
import { addDays } from "@/lib/shared/dates";
import { nowIso, today } from "@/lib/shared/clock";
import { getDb, isDatabaseConfigured } from "@/lib/shared/db";
import { nextProposalKey } from "@/lib/shared/keys";
import { isRisky, scoreOrder, typicalOrderCents, type RiskScore } from "@/lib/shared/risk";
import { alertsFrom } from "./alerts";

export { alertsFrom, SLOW_WEEK_SHARE, type AlertInput } from "./alerts";

interface Scored {
  orderId: string;
  orderNumber: number;
  customerName: string;
  totalCents: number;
  riskHold: boolean;
  score: RiskScore;
}

/** Every pending or failed order the rules flag, with its score. */
async function scoredOrders(storeId: StoreId): Promise<Scored[]> {
  const db = getDb();
  const [orders, paid] = await Promise.all([
    db.order.findMany({
      where: { storeId, status: { in: ["PENDING", "FAILED"] } },
      include: { customer: { select: { name: true, firstSeenOn: true, _count: { select: { orders: { where: { status: "CAPTURED" } } } } } } },
      orderBy: { number: "asc" },
    }),
    db.order.findMany({ where: { storeId, status: "CAPTURED" }, select: { totalCents: true } }),
  ]);
  const typical = typicalOrderCents(paid.map((o) => o.totalCents));
  return orders
    .map((o) => ({
      orderId: o.id,
      orderNumber: o.number,
      customerName: o.customer.name,
      totalCents: o.totalCents,
      riskHold: o.riskHold,
      score: scoreOrder({ totalCents: o.totalCents, failedAttempts: o.failedAttempts, placedOn: o.placedOn, customerFirstSeenOn: o.customer.firstSeenOn, customerPaidOrders: o.customer._count.orders }, typical),
    }))
    .filter((o) => isRisky(o.score));
}

/** The risk flags on recent orders: unusual amount, a new buyer's big order, repeated failed attempts. */
export async function listRiskFlags(storeId: StoreId): Promise<RiskFlag[]> {
  if (!isDatabaseConfigured()) return [];
  const createdAt = nowIso();
  return (await scoredOrders(storeId)).flatMap((o) =>
    o.score.flags.map((f) => ({ id: `${o.orderId}_${f.kind}`, storeId, orderId: o.orderId, orderNumber: o.orderNumber, kind: f.kind, detail: f.detail, amountCents: o.totalCents, createdAt, held: o.riskHold })),
  );
}

/** A HOLD_ORDER proposal for one flagged order (the Guard decides), its flags saved, with one line on why. */
export async function proposeHold(storeId: StoreId, orderId: string): Promise<ActionProposal> {
  const order = (await scoredOrders(storeId)).find((o) => o.orderId === orderId);
  if (!order) throw new Error(`Order ${orderId} isn't flagged as risky.`);
  const db = getDb();
  const existing = await db.riskFlag.findMany({ where: { storeId, orderId }, select: { id: true } });
  const flagIds =
    existing.length > 0
      ? existing.map((f) => f.id)
      : await Promise.all(order.score.flags.map(async (f) => (await db.riskFlag.create({ data: { storeId, orderId, kind: f.kind, detail: f.detail }, select: { id: true } })).id));
  const { idempotencyKey, sequence } = await nextProposalKey(storeId, "HOLD_ORDER", orderId);
  const why = await explainRisk({ orderNumber: order.orderNumber, customerName: order.customerName, amountCents: order.totalCents, flags: order.score.flags });
  return {
    id: `prop_${randomUUID()}`,
    storeId,
    type: "HOLD_ORDER",
    target: { kind: "ORDER", id: orderId, label: `Order #${order.orderNumber}, ${order.customerName}` },
    amountCents: order.totalCents,
    proposedBy: { kind: "AGENT", agent: "RISK" },
    idempotencyKey,
    sequence,
    draftText: why,
    params: { orderId, riskFlagIds: flagIds },
    createdAt: nowIso(),
    demoDate: today(),
  };
}

/**
 * The risk check's round: a hold for every flagged order that isn't held and hasn't had one proposed, each sent to the
 * Guard. Runs when the owner opens Approvals. Safe to run again.
 */
export async function runRiskCheck(storeId: StoreId): Promise<Receipt[]> {
  if (!isDatabaseConfigured()) return [];
  const [flagged, proposed] = await Promise.all([
    scoredOrders(storeId),
    getDb().proposal.findMany({ where: { storeId, type: "HOLD_ORDER" }, select: { targetId: true } }),
  ]);
  const done = new Set(proposed.map((p) => p.targetId));
  const receipts: Receipt[] = [];
  for (const o of flagged.filter((x) => !x.riskHold && !done.has(x.orderId))) receipts.push(await submitProposal(await proposeHold(storeId, o.orderId)));
  return receipts;
}

/** Price-rise and slow-week alerts. None when the forecast is unsure (low confidence). */
export async function getAlerts(storeId: StoreId): Promise<Alert[]> {
  if (!isDatabaseConfigured()) return [];
  const day = today();
  const [forecast, dues, evidence, recent] = await Promise.all([getForecast(storeId), getDues(storeId), getPatternEvidence(storeId), listRecentPayments(storeId, 7)]);
  const salesLast7Cents = recent.filter((p) => p.name === "Sales" && p.date >= addDays(day, -7)).reduce((sum, p) => sum + p.amountCents, 0);
  return alertsFrom({ forecast, dues, evidence, salesLast7Cents });
}
