import type { Cents, IsoDate, RecurringPayee } from "@/types";
import { addDays, daysBetween, dayOfMonth, formatDay, weekdayIndex } from "@/lib/shared/dates";
import { formatDollars } from "@/lib/shared/money";

/**
 * Regular payment detection. Pure and deterministic: no AI, no database, no clock.
 *
 * A payee is regular when, over at least 3 past payments, the amounts are similar (each within 15% of the
 * median) and the gaps between payments are steady:
 *   - every N weeks: every gap is the same whole number of weeks and every payment falls on the same weekday;
 *   - monthly: every gap is 27 to 33 days and every payment falls within 2 days of the same day of the month;
 *   - every N days: every gap is within 1 day of the middle gap.
 * A pattern whose last payment is more than one and a half cycles ago has stopped, so it is not regular any more.
 */

export type Cadence = RecurringPayee["cadence"];

export interface PastPayment {
  date: IsoDate;
  amountCents: Cents;
}

export interface Pattern {
  cadence: Cadence;
  /** The median payment. */
  typicalAmountCents: Cents;
  /** False when every past payment was exactly the same amount. */
  amountsVary: boolean;
  payments: number;
  lastPaidOn: IsoDate;
  /** The first payment on or after `today`. */
  nextDueOn: IsoDate;
}

export const MIN_PAYMENTS = 3;
export const AMOUNT_TOLERANCE = 0.15;

export function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid]! : Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);
}

/** Finds the pattern in one payee's past payments, or null if they are not regular. */
export function detectPattern(history: readonly PastPayment[], today: IsoDate): Pattern | null {
  const payments = [...history].filter((p) => p.date < today).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  if (payments.length < MIN_PAYMENTS) return null;

  const amounts = payments.map((p) => p.amountCents);
  const typical = median(amounts);
  if (typical <= 0 || amounts.some((a) => Math.abs(a - typical) > typical * AMOUNT_TOLERANCE)) return null;

  const cadence = findCadence(payments.map((p) => p.date));
  if (!cadence) return null;

  const lastPaidOn = payments.at(-1)!.date;
  if (daysBetween(lastPaidOn, today) > Math.ceil(cycleDays(cadence) * 1.5)) return null;

  let nextDueOn = nextAfter(cadence, lastPaidOn);
  while (nextDueOn < today) nextDueOn = nextAfter(cadence, nextDueOn);

  return {
    cadence,
    typicalAmountCents: typical,
    amountsVary: amounts.some((a) => a !== amounts[0]),
    payments: payments.length,
    lastPaidOn,
    nextDueOn,
  };
}

function findCadence(dates: readonly IsoDate[]): Cadence | null {
  const gaps = dates.slice(1).map((d, i) => daysBetween(dates[i]!, d));

  const first = gaps[0]!;
  if (first % 7 === 0 && first <= 28 && gaps.every((g) => g === first)) {
    const weekday = weekdayIndex(dates[0]!);
    if (dates.every((d) => weekdayIndex(d) === weekday)) return { every: "WEEKS", weeks: first / 7, weekday };
  }

  if (gaps.every((g) => g >= 27 && g <= 33)) {
    const day = mostCommon(dates.map(dayOfMonth));
    if (dates.every((d) => Math.abs(dayOfMonth(d) - Math.min(day, daysInMonth(d))) <= 2)) return { every: "MONTH", dayOfMonth: day };
  }

  const middle = median(gaps);
  if (middle >= 2 && middle <= 60 && gaps.every((g) => Math.abs(g - middle) <= 1)) return { every: "DAYS", days: middle };

  return null;
}

function mostCommon(values: readonly number[]): number {
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  // Ties go to the later day, so a bill paid on the 30th and the 31st is expected on the 31st (clamped in short months).
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0]![0];
}

function daysInMonth(date: IsoDate): number {
  const [y, m] = date.split("-").map(Number) as [number, number];
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** The same day of the month, one month on (clamped to the month's last day). */
function nextMonthOn(date: IsoDate, day: number): IsoDate {
  const [y, m] = date.split("-").map(Number) as [number, number];
  const year = m === 12 ? y + 1 : y;
  const month = m === 12 ? 1 : m + 1;
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(Math.min(day, last)).padStart(2, "0")}`;
}

function cycleDays(cadence: Cadence): number {
  switch (cadence.every) {
    case "DAYS":
      return cadence.days;
    case "WEEKS":
      return cadence.weeks * 7;
    case "MONTH":
      return 31;
  }
}

/** The payment after the one on `date`. */
export function nextAfter(cadence: Cadence, date: IsoDate): IsoDate {
  switch (cadence.every) {
    case "DAYS":
      return addDays(date, cadence.days);
    case "WEEKS":
      return addDays(date, cadence.weeks * 7);
    case "MONTH":
      return nextMonthOn(date, cadence.dayOfMonth);
  }
}

/** Every payment date from `first` up to and including `last`. */
export function datesBetween(cadence: Cadence, first: IsoDate, last: IsoDate): IsoDate[] {
  const dates: IsoDate[] = [];
  for (let d = first; d <= last; d = nextAfter(cadence, d)) dates.push(d);
  return dates;
}

// ---------------------------------------------------------------------------
// Plain words (code templates, never AI)
// ---------------------------------------------------------------------------

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const ORDINAL: Record<number, string> = { 1: "st", 2: "nd", 3: "rd", 21: "st", 22: "nd", 23: "rd", 31: "st" };

export function cadenceWords(cadence: Cadence): string {
  switch (cadence.every) {
    case "DAYS":
      return cadence.days === 1 ? "every day" : `every ${cadence.days} days`;
    case "WEEKS": {
      const day = WEEKDAY_NAMES[cadence.weekday] ?? "week";
      if (cadence.weeks === 1) return `every ${day}`;
      if (cadence.weeks === 2) return `every other ${day}`;
      return `every ${cadence.weeks} weeks, on a ${day}`;
    }
    case "MONTH":
      return `on the ${cadence.dayOfMonth}${ORDINAL[cadence.dayOfMonth] ?? "th"} of each month`;
  }
}

/** "about $300" when past amounts varied (rounded to a sensible step), "$1,200" when they never did. */
export function amountWords(cents: Cents, varies: boolean): string {
  if (!varies) return formatDollars(cents);
  const step = cents < 10_000 ? 100 : cents < 100_000 ? 1_000 : 5_000;
  return `about ${formatDollars(Math.round(cents / step) * step)}`;
}

export interface SummaryInput {
  name: string;
  kind: RecurringPayee["kind"];
  status: RecurringPayee["status"];
  typicalAmountCents: Cents;
  amountsVary: boolean;
  cadence: Cadence;
  nextDueOn: IsoDate | null;
}

/**
 * "We think Volta Audio Parts is paid about $300 every 10 days, next on Thu 12 Nov."
 * "We think you move about $2,500 to your bank every other Monday, next on Mon 9 Nov."
 * Confirmed payees drop the "We think".
 */
export function summaryFor(p: SummaryInput): string {
  const amount = amountWords(p.typicalAmountCents, p.amountsVary);
  const when = cadenceWords(p.cadence);
  const next = p.nextDueOn ? `, next on ${formatDay(p.nextDueOn)}` : "";
  const sure = p.status === "CONFIRMED";
  if (p.kind === "OWNER_TRANSFER") return `${sure ? "You move" : "We think you move"} ${amount} to your bank ${when}${next}.`;
  return `${sure ? p.name : `We think ${p.name}`} is paid ${amount} ${when}${next}.`;
}
