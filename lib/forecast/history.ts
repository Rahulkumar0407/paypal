import type { Cents, IsoDate } from "@/types";
import { addDays, daysBetween } from "@/lib/shared/dates";
import { findPatterns, type StoreRows } from "./engine";

/** Money that already moved, for Ask chat's "recent payments" and the regular-payment explanations. Pure. */

export interface RecentPayment {
  date: IsoDate;
  direction: "IN" | "OUT";
  /** Who was paid, or "Sales" for the day's sales added together. */
  name: string;
  amountCents: Cents;
}

/** The last `days` days before today: each payment out, and each day's sales (after PayPal's fee) as one line. Newest first. */
export function recentPaymentsFromRows(rows: StoreRows, today: IsoDate, days = 30): RecentPayment[] {
  const from = addDays(today, -days);
  const payees = new Map(rows.payees.map((p) => [p.id, p.name]));
  const sales = new Map<IsoDate, Cents>();
  const out: RecentPayment[] = [];
  for (const e of rows.ledger) {
    if (e.occurredOn < from || e.occurredOn > today || e.category === "GAP_LOAN") continue;
    if (e.direction === "IN" && e.category === "SALE") sales.set(e.occurredOn, (sales.get(e.occurredOn) ?? 0) + e.amountCents);
    else out.push({ date: e.occurredOn, direction: e.direction, name: (e.payeeId && payees.get(e.payeeId)) || e.description, amountCents: e.amountCents });
  }
  for (const [date, amountCents] of sales) out.push({ date, direction: "IN", name: "Sales", amountCents });
  return out.sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name));
}

/** What a found pattern rests on: how many payments, over what dates, how far apart the amounts were. */
export interface PatternEvidence {
  payeeId: string;
  payments: number;
  firstOn: IsoDate;
  lastOn: IsoDate;
  lowestCents: Cents;
  highestCents: Cents;
  typicalCents: Cents;
  spanDays: number;
}

export function patternEvidenceFromRows(rows: StoreRows, today: IsoDate): PatternEvidence[] {
  const patterns = findPatterns(rows, today);
  return rows.payees.flatMap((p) => {
    const pattern = patterns.get(p.id);
    if (!pattern) return [];
    const paid = rows.ledger.filter((e) => e.payeeId === p.id && e.direction === "OUT" && e.occurredOn < today).sort((a, b) => a.occurredOn.localeCompare(b.occurredOn));
    const amounts = paid.map((e) => e.amountCents);
    return [
      {
        payeeId: p.id,
        payments: paid.length,
        firstOn: paid[0]!.occurredOn,
        lastOn: paid.at(-1)!.occurredOn,
        lowestCents: Math.min(...amounts),
        highestCents: Math.max(...amounts),
        typicalCents: pattern.typicalAmountCents,
        spanDays: daysBetween(paid[0]!.occurredOn, paid.at(-1)!.occurredOn),
      },
    ];
  });
}
