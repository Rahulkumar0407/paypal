import type { Decision, Due, Order, Receipt, RiskFlag } from "@/types";
import { formatDay } from "@/lib/shared/dates";

/**
 * The dashboard's rows, worked out on the server from module data and passed to the grids as plain values. Money stays
 * in integer cents; the grids only format it.
 */

export type OrderStatusWord = "Paid" | "Waiting" | "Abandoned" | "Failed" | "Refunded";

export const ORDER_STATUS_WORD: Record<Order["status"], OrderStatusWord> = {
  CAPTURED: "Paid",
  PENDING: "Waiting",
  ABANDONED: "Abandoned",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

export interface OrderRow {
  id: string;
  number: number;
  buyer: string;
  placedOn: string;
  placedLabel: string;
  status: OrderStatusWord;
  /** Extra words after the status, e.g. "3 attempts". */
  statusNote: string | null;
  totalCents: number;
  feeCents: number | null;
  netCents: number | null;
  /** Risk check: held (not counted as expected money), flagged (waiting for the owner), or nothing. */
  risk: { held: boolean; detail: string } | null;
  /** The latest Margin Guard decision on this order, e.g. a reminder that was approved or blocked. */
  guard: { decision: Decision; what: string; reason: string } | null;
}

export function orderRows(orders: Order[], flags: RiskFlag[], receipts: Receipt[]): OrderRow[] {
  const flagByOrder = new Map(flags.map((f) => [f.orderId, f]));
  // Receipts come newest first; keep the first (latest) one per order.
  const latest = new Map<string, Receipt>();
  for (const r of receipts) {
    if (r.proposal.target.kind === "ORDER" && !latest.has(r.proposal.target.id)) latest.set(r.proposal.target.id, r);
  }
  return orders.map((o) => {
    const flag = flagByOrder.get(o.id);
    const receipt = latest.get(o.id);
    return {
      id: o.id,
      number: o.number,
      buyer: o.customerName,
      placedOn: o.placedOn,
      placedLabel: formatDay(o.placedOn),
      status: ORDER_STATUS_WORD[o.status],
      statusNote: o.failedAttempts > 1 ? `${o.failedAttempts} attempts` : null,
      totalCents: o.totalCents,
      feeCents: o.feeCents,
      netCents: o.netCents,
      risk: flag ? { held: flag.held, detail: flag.detail } : o.riskHold ? { held: true, detail: "On risk hold." } : null,
      guard: receipt
        ? { decision: receipt.decision.decision, what: receipt.proposal.type === "SEND_REMINDER" ? "Reminder" : "Action", reason: receipt.decision.headlineReason }
        : null,
    };
  });
}

export interface DueRow {
  id: string;
  dueOn: string;
  dueLabel: string;
  payee: string;
  what: string;
  amountCents: number;
  readyCents: number;
  status: "Scheduled" | "Paid" | "Moved" | "Cancelled";
  movedFrom: string | null;
  simulated: boolean;
}

const DUE_STATUS: Record<Due["status"], DueRow["status"]> = { SCHEDULED: "Scheduled", PAID: "Paid", MOVED: "Moved", CANCELLED: "Cancelled" };

export function dueRows(dues: Due[]): DueRow[] {
  return dues.map((d) => ({
    id: d.id,
    dueOn: d.dueOn,
    dueLabel: formatDay(d.dueOn),
    payee: d.payeeName,
    what: d.label.charAt(0).toUpperCase() + d.label.slice(1),
    amountCents: d.amountCents,
    readyCents: d.readyCents,
    status: DUE_STATUS[d.status],
    movedFrom: d.movedFromOn ? formatDay(d.movedFromOn) : null,
    simulated: d.simulated,
  }));
}
