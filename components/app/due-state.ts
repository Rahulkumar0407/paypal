import type { DayState, Due, Forecast } from "@/types";

/**
 * How a due looks, for display only (no money maths): Short if not all of it is ready, Tight if it lands on a
 * tight day, otherwise Covered. Readiness itself comes from lib/forecast.
 */
export interface DueWithState {
  due: Due;
  state: DayState;
}

export function dueState(due: Due, dayState: DayState | undefined): DayState {
  if (due.readyCents < due.amountCents) return "short";
  if (dayState === "tight") return "tight";
  return "covered";
}

/** The dues inside the forecast's 14 days, in date order, each with its state. */
export function duesInForecast(dues: Due[], forecast: Forecast): DueWithState[] {
  const days = new Map(forecast.days.map((d) => [d.date, d]));
  return dues
    .filter((d) => days.has(d.dueOn))
    .sort((a, b) => (a.dueOn === b.dueOn ? a.payeeName.localeCompare(b.payeeName) : a.dueOn < b.dueOn ? -1 : 1))
    .map((due) => {
      // Prefer the forecast's own copy of the due: it carries the readiness for that day.
      const fromDay = days.get(due.dueOn)?.dues.find((d) => d.id === due.id) ?? due;
      return { due: fromDay, state: dueState(fromDay, days.get(due.dueOn)?.state) };
    });
}
