import type { IsoDate, IsoDateTime } from "@/types";
import { getEnv } from "./env";

/**
 * The demo clock. Business logic gets "today" and "now" only from here, never from
 * `new Date()` (AGENTS.md section 9). `DEMO_TODAY` fixes the date so the demo story
 * replays identically; the time of day is the real one.
 */

export const STORE_TIME_ZONE = "America/New_York";

/** The store's business date: DEMO_TODAY. */
export function today(): IsoDate {
  return getEnv().DEMO_TODAY;
}

/** Offset of `timeZone` from UTC at `instant`, in minutes (e.g. -300 for New York in November). */
export function timeZoneOffsetMinutes(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asUtc - Math.floor(instant.getTime() / 1000) * 1000) / 60_000);
}

/** The instant at which the wall clock in `timeZone` reads `date` + `time` ('HH:MM' or 'HH:MM:SS'). */
export function zonedInstant(date: IsoDate, time: string, timeZone: string = STORE_TIME_ZONE): Date {
  const [h = "0", m = "0", s = "0"] = time.split(":");
  const [y, mo, d] = date.split("-").map(Number) as [number, number, number];
  const guess = Date.UTC(y, mo - 1, d, Number(h), Number(m), Number(s));
  const offset = timeZoneOffsetMinutes(new Date(guess), timeZone);
  const first = guess - offset * 60_000;
  // Re-check once in case the guess fell on the other side of a daylight-saving change.
  const offset2 = timeZoneOffsetMinutes(new Date(first), timeZone);
  return new Date(guess - offset2 * 60_000);
}

/** Format an instant as ISO 8601 with the store's offset, e.g. '2026-11-05T10:42:00-05:00'. */
export function toZonedIso(instant: Date, timeZone: string = STORE_TIME_ZONE): IsoDateTime {
  const offset = timeZoneOffsetMinutes(instant, timeZone);
  const local = new Date(instant.getTime() + offset * 60_000).toISOString().slice(0, 19);
  const sign = offset < 0 ? "-" : "+";
  const abs = Math.abs(offset);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `${local}${sign}${hh}:${mm}`;
}

/** The real instant. Use only for audit timestamps; business dates come from today(). */
export function realNow(): Date {
  return new Date();
}

/** Demo "now": DEMO_TODAY at the real current time of day in the store's time zone. */
export function now(): Date {
  const real = realNow();
  const localTime = toZonedIso(real).slice(11, 19);
  return zonedInstant(today(), localTime);
}

/**
 * A real instant shown on the demo date: the demo date with the real time of day, as the store's clock read it.
 * Receipts keep real timestamps (audit trail) and show them on the demo date.
 */
export function atDemoDate(instant: Date, demoDate: IsoDate, timeZone: string = STORE_TIME_ZONE): IsoDateTime {
  return toZonedIso(zonedInstant(demoDate, toZonedIso(instant, timeZone).slice(11, 19), timeZone), timeZone);
}

/** Demo "now" as an ISO string with the store's offset. */
export function nowIso(): IsoDateTime {
  return toZonedIso(now());
}
