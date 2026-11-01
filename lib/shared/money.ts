import type { Cents } from "@/types";

/**
 * Money is integer cents everywhere (AGENTS.md section 9). Format only for display, here.
 * - Sentences and tiles: whole dollars, with shortfalls rounded up so a gap is never understated.
 * - Receipts and tables: exact cents.
 */

const MINUS = "−"; // a real minus sign, not a hyphen

const exactFormat = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const wholeFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export function assertCents(value: number, label = "amount"): asserts value is Cents {
  if (!Number.isSafeInteger(value)) {
    throw new Error(`${label} must be a whole number of cents, got ${value}`);
  }
}

/** Dollars (as typed by a person) to cents. "72.5" -> 7250. */
export function dollarsToCents(dollars: number | string): Cents {
  const n = typeof dollars === "string" ? Number(dollars.replace(/[$,\s]/g, "")) : dollars;
  if (!Number.isFinite(n)) throw new Error(`Not an amount: ${dollars}`);
  return Math.round(n * 100);
}

/** "$1,234.56" or "−$1,234.56". For receipts and tables. */
export function formatCents(cents: Cents): string {
  assertCents(cents);
  const sign = cents < 0 ? MINUS : "";
  return `${sign}$${exactFormat.format(Math.abs(cents) / 100)}`;
}

/** "$1,235" (nearest dollar) or "−$290". For sentences, tiles and big amounts. */
export function formatDollars(cents: Cents): string {
  assertCents(cents);
  const sign = cents < 0 ? MINUS : "";
  return `${sign}$${wholeFormat.format(Math.round(Math.abs(cents) / 100))}`;
}

/** A gap, rounded UP to the next whole dollar: 8920 -> "$90". Never understates a shortfall. */
export function formatShortfall(cents: Cents): string {
  assertCents(cents);
  return `$${wholeFormat.format(Math.ceil(Math.abs(cents) / 100))}`;
}

/** Sum a list of cent amounts, refusing anything that is not whole cents. */
export function sumCents(values: readonly Cents[]): Cents {
  return values.reduce<number>((total, v) => {
    assertCents(v);
    return total + v;
  }, 0);
}
