import type { DayState, Decision, Forecast } from "@/types";
import type { YourForecast, YourNumbers } from "@/lib/forecast";
import type { YourFixVerdict } from "@/lib/landing";
import { addDays, dayOfMonth, formatDay, weekdayShort } from "@/lib/shared/dates";

/** How many payment rows the form has. */
export const PAYMENT_ROWS = 5;

/** What the /try page shows: plain values, worked out on the server. */
export interface TryDay {
  date: string;
  label: string;
  closingCents: number;
  state: DayState;
  shortByCents: number;
}

export interface TryView {
  headline: { text: string; tone: DayState };
  days: TryDay[];
  fixes: { id: string; title: string; detail: string; state: DayState }[];
  minimumCents: number;
  warningCents: number;
  /** The fix the visitor is trying: the two weeks with it in place, and the Margin Guard's verdict. */
  applied: {
    fixId: string;
    title: string;
    headline: { text: string; tone: DayState };
    days: TryDay[];
    decision: Decision;
    reason: string;
    ruleNumber: number | null;
  } | null;
}

export interface TryResult {
  status: "idle" | "ok" | "invalid";
  message: string;
  errors: Record<string, string>;
  values: Record<string, string> | null;
  /** Counts submissions: re-deals the tickets and re-mounts the form with what was typed. */
  attempt: number;
  view: TryView | null;
}

function daysOf(forecast: Forecast): TryDay[] {
  return forecast.days.map((d) => ({
    date: d.date,
    label: d.isToday ? "Today" : `${weekdayShort(d.date)} ${dayOfMonth(d.date)}`,
    closingCents: d.closingCents,
    state: d.state,
    shortByCents: d.shortByCents,
  }));
}

export function toTryView(y: YourForecast, verdict: YourFixVerdict | null = null): TryView {
  return {
    headline: { text: y.headline.text, tone: y.headline.tone },
    days: daysOf(y.forecast),
    fixes: y.fixes.map((f) => ({ id: f.id, title: f.title, detail: f.detail, state: f.resultingState })),
    minimumCents: y.forecast.minimumBalanceCents,
    warningCents: y.forecast.tightMarginCents,
    applied: verdict
      ? {
          fixId: verdict.fixId,
          title: verdict.title,
          headline: { text: verdict.headline.text, tone: verdict.headline.tone },
          days: daysOf(verdict.after),
          decision: verdict.decision,
          reason: verdict.reason,
          ruleNumber: verdict.ruleNumber,
        }
      : null,
  };
}

/** The example the page opens with: a small shop whose rent and supplier order land on the same day. */
export const EXAMPLE: YourNumbers = {
  balanceCents: 180_000,
  dailySalesCents: 22_000,
  minimumBalanceCents: 20_000,
  payments: [
    { name: "Transfer to your bank", kind: "OWNER_TRANSFER", amountCents: 100_000, inDays: 3, weekly: false },
    { name: "Rent", kind: "BILL", amountCents: 160_000, inDays: 6, weekly: false },
    { name: "Supplier", kind: "SUPPLIER", amountCents: 60_000, inDays: 6, weekly: true },
  ],
};

/** The form's starting values, from EXAMPLE. */
export function exampleValues(rows: number): Record<string, string> {
  const v: Record<string, string> = {
    balance: String(EXAMPLE.balanceCents / 100),
    sales: String(EXAMPLE.dailySalesCents / 100),
    minimum: String(EXAMPLE.minimumBalanceCents / 100),
  };
  for (let i = 0; i < rows; i++) {
    const p = EXAMPLE.payments[i];
    v[`name${i}`] = p?.name ?? "";
    v[`amount${i}`] = p ? String(p.amountCents / 100) : "";
    v[`day${i}`] = String(p?.inDays ?? 0);
    v[`kind${i}`] = p?.kind ?? "BILL";
    v[`weekly${i}`] = p?.weekly ? "on" : "";
  }
  return v;
}

/** The 14 days the payments can fall on, from the demo's today: a two-week calendar like the tickets. */
export function dayOptions(today: string): { value: string; label: string; weekday: string; date: string }[] {
  return Array.from({ length: 14 }, (_, i) => {
    const d = addDays(today, i);
    return { value: String(i), label: i === 0 ? `Today, ${formatDay(d)}` : formatDay(d), weekday: i === 0 ? "Today" : weekdayShort(d), date: String(dayOfMonth(d)) };
  });
}
