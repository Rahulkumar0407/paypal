import type { IsoDate } from "@/types";

/**
 * Date-only helpers for business dates ('YYYY-MM-DD').
 * All arithmetic happens at UTC midnight, so time zones and daylight saving never shift a date.
 */

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const WEEKDAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
const DAY_MS = 86_400_000;

export function isIsoDate(value: string): value is IsoDate {
  const m = ISO_DATE.exec(value);
  if (!m) return false;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.toISOString().slice(0, 10) === value;
}

function toUtc(date: IsoDate): Date {
  if (!isIsoDate(date)) throw new Error(`Not a valid date: "${date}" (use YYYY-MM-DD)`);
  return new Date(`${date}T00:00:00Z`);
}

function fromUtc(d: Date): IsoDate {
  return d.toISOString().slice(0, 10);
}

export function addDays(date: IsoDate, days: number): IsoDate {
  return fromUtc(new Date(toUtc(date).getTime() + days * DAY_MS));
}

/** Whole days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((toUtc(to).getTime() - toUtc(from).getTime()) / DAY_MS);
}

/** `count` consecutive dates starting with `start`. */
export function eachDay(start: IsoDate, count: number): IsoDate[] {
  return Array.from({ length: count }, (_, i) => addDays(start, i));
}

/** 0 = Sunday ... 6 = Saturday. */
export function weekdayIndex(date: IsoDate): number {
  return toUtc(date).getUTCDay();
}

export function weekdayShort(date: IsoDate): string {
  return WEEKDAYS_SHORT[weekdayIndex(date)]!;
}

export function weekdayLong(date: IsoDate): string {
  return WEEKDAYS_LONG[weekdayIndex(date)]!;
}

export function dayOfMonth(date: IsoDate): number {
  return toUtc(date).getUTCDate();
}

/** "Thu 12 Nov" (AGENTS.md section 7). */
export function formatDay(date: IsoDate): string {
  const d = toUtc(date);
  return `${WEEKDAYS_SHORT[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}`;
}

/** "Thu 5 Nov 2026". */
export function formatDayWithYear(date: IsoDate): string {
  return `${formatDay(date)} ${toUtc(date).getUTCFullYear()}`;
}

export function compareDates(a: IsoDate, b: IsoDate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
