import type { Cents, IsoDate, RiskFlagKind } from "@/types";
import { daysBetween } from "./dates";
import { formatDollars } from "./money";

/**
 * The risk score (feature 7): fixed rules, no AI. Pure. Lives in lib/shared because two modules need it: lib/forecast
 * (a risky order is never counted as expected money) and lib/risk (which proposes the hold through the Guard).
 */

export interface RiskOrderFacts {
  totalCents: Cents;
  failedAttempts: number;
  placedOn: IsoDate;
  customerFirstSeenOn: IsoDate;
  /** How many orders this customer has paid before. */
  customerPaidOrders: number;
}

export interface RiskScore {
  score: number;
  flags: { kind: RiskFlagKind; detail: string }[];
}

/** An order at least this many times the usual size is unusual. */
export const UNUSUAL_MULTIPLE = 3;
/** A first order this many times the usual size, from someone first seen in the last week, is a new buyer's big order. */
export const NEW_BUYER_MULTIPLE = 2;
export const NEW_BUYER_DAYS = 7;
export const FAILED_ATTEMPTS = 3;
const WEIGHT: Record<RiskFlagKind, number> = { UNUSUAL_AMOUNT: 2, NEW_BUYER_BIG_ORDER: 2, REPEATED_FAILED_ATTEMPTS: 3 };

/** The middle order size among paid orders: what "usual" means. */
export function typicalOrderCents(paidTotals: readonly Cents[]): Cents {
  if (paidTotals.length === 0) return 0;
  const sorted = [...paidTotals].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);
}

export function scoreOrder(order: RiskOrderFacts, typical: Cents): RiskScore {
  const flags: RiskScore["flags"] = [];
  const times = typical > 0 ? Math.round(order.totalCents / typical) : 0;
  const newBuyer = order.customerPaidOrders === 0 && daysBetween(order.customerFirstSeenOn, order.placedOn) <= NEW_BUYER_DAYS;
  if (typical > 0 && order.totalCents >= UNUSUAL_MULTIPLE * typical) {
    flags.push({ kind: "UNUSUAL_AMOUNT", detail: `${formatDollars(order.totalCents)} is ${times} times the usual order of ${formatDollars(typical)}.` });
  }
  if (typical > 0 && newBuyer && order.totalCents >= NEW_BUYER_MULTIPLE * typical) {
    flags.push({ kind: "NEW_BUYER_BIG_ORDER", detail: "It's this buyer's first order, and a big one." });
  }
  if (order.failedAttempts >= FAILED_ATTEMPTS) {
    flags.push({ kind: "REPEATED_FAILED_ATTEMPTS", detail: `${order.failedAttempts} payment attempts have failed.` });
  }
  return { score: flags.reduce((sum, f) => sum + WEIGHT[f.kind], 0), flags };
}

/** Risky when any rule flags it. */
export function isRisky(score: RiskScore): boolean {
  return score.flags.length > 0;
}
