import type { Alert, Cents, Due, Forecast } from "@/types";
import type { PatternEvidence } from "@/lib/forecast";
import { formatDay } from "@/lib/shared/dates";
import { formatDollars } from "@/lib/shared/money";

/**
 * The extras (feature 9): a price-rise alert on a bill, and a slow-week warning. Quiet when unsure: when the
 * forecast's confidence is low, there are no alerts at all. Pure.
 */

export interface AlertInput {
  forecast: Forecast;
  dues: Due[];
  evidence: PatternEvidence[];
  /** Sales that arrived over the last 7 days, after PayPal's fees. */
  salesLast7Cents: Cents;
}

/** A week this far under the usual is slow. */
export const SLOW_WEEK_SHARE = 0.8;

export function alertsFrom({ forecast, dues, evidence, salesLast7Cents }: AlertInput): Alert[] {
  if (forecast.confidence === "low") return [];
  const alerts: Alert[] = [];
  const window = new Set(forecast.days.map((d) => d.date));
  const seen = new Set<string>();
  for (const due of dues) {
    if ((due.kind !== "BILL" && due.kind !== "SUPPLIER") || !window.has(due.dueOn) || seen.has(due.payeeId)) continue;
    seen.add(due.payeeId);
    const past = evidence.find((e) => e.payeeId === due.payeeId);
    if (!past || due.amountCents <= past.highestCents) continue;
    alerts.push({
      id: `price_rise_${due.payeeId}`,
      kind: "PRICE_RISE",
      title: `${due.payeeName} went up ${formatDollars(due.amountCents - past.highestCents)}.`,
      detail: `It was ${formatDollars(past.highestCents)} the last ${past.payments} times. The bill on ${formatDay(due.dueOn)} is ${formatDollars(due.amountCents)}.`,
      confidence: forecast.confidence,
    });
  }
  // A usual week: the forecast's expected sales for the 7 days after today (no money that already arrived today).
  const usualWeek = forecast.days.slice(1, 8).reduce((sum, d) => sum + d.expectedInCents, 0);
  if (usualWeek > 0 && salesLast7Cents < usualWeek * SLOW_WEEK_SHARE) {
    alerts.push({
      id: "slow_week",
      kind: "SLOW_WEEK",
      title: "Sales were slow this past week.",
      detail: `${formatDollars(salesLast7Cents)} came in over the last 7 days, against a usual ${formatDollars(usualWeek)}. The forecast still assumes a usual week.`,
      confidence: forecast.confidence,
    });
  }
  return alerts;
}
