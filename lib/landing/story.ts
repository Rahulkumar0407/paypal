import type { Cents, DayState, Forecast, ForecastDay, Headline, IsoDate } from "@/types";
import { buildHeadline, previewDemoForecast } from "@/lib/forecast";
import { dayOfMonth, formatDay, weekdayShort } from "@/lib/shared/dates";
import { formatDollars, formatShortfall } from "@/lib/shared/money";

/**
 * The landing page's story, built on the server from the real forecast engine, with no
 * database: the SIMULATED Dunder Mifflin & Co. preview (`previewDemoForecast`). Every number and sentence here comes from code
 * templates (AGENTS.md section 5: AI never calculates money), so the page replays identically for every visitor.
 */

export interface StoryMove {
  kind: "in" | "out";
  label: string;
  amountCents: Cents;
}

export interface StoryDay {
  date: IsoDate;
  /** "Thu 12 Nov". */
  label: string;
  /** For the split-flap board: "THU", "12", "NOV". */
  flap: { weekday: string; day: string; month: string };
  openingCents: Cents;
  closingCents: Cents;
  state: DayState;
  shortByCents: Cents;
  moves: StoryMove[];
  /** One plain sentence, like a subtitle, for this day. */
  narrator: string;
}

export interface LandingStory {
  headline: Headline;
  /** The forecast itself. */
  forecast: Forecast;
  today: IsoDate;
  minimumCents: Cents;
  days: StoryDay[];
  /** Index of the first short day, or null. */
  shortIndex: number | null;
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function list(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

function moveLabel(day: ForecastDay["dues"][number]): string {
  return day.kind === "OWNER_TRANSFER" ? "Transfer to your bank" : day.payeeName;
}

function narrate(day: ForecastDay, isFirst: boolean, forecast: Forecast): string {
  const when = isFirst ? "Today" : formatDay(day.date);
  const sales = formatDollars(day.expectedInCents);
  const closing = formatDollars(day.closingCents);
  if (day.state === "short") {
    const reason = forecast.firstShortfall?.date === day.date ? forecast.firstShortfall.reason : "payments leave";
    return `${when}: ${reason}. ${closing} left, ${formatShortfall(day.shortByCents)} less than the shop needs.`;
  }
  if (day.dues.length === 0) return `${when}: about ${sales} of sales come in. ${closing} by the end of the day.`;
  const transfer = day.dues.find((d) => d.kind === "OWNER_TRANSFER");
  if (transfer && day.dues.length === 1) {
    return `${when}: the owner moves ${formatDollars(transfer.amountCents)} to their bank. ${closing} left.`;
  }
  const names = day.dues.map((d) => `${d.label} (${formatDollars(d.amountCents)})`);
  return `${when}: ${list(names)} ${day.dues.length === 1 ? "is" : "are"} paid. ${closing} left.`;
}

function storyDay(day: ForecastDay, index: number, forecast: Forecast): StoryDay {
  const month = Number(day.date.slice(5, 7)) - 1;
  const moves: StoryMove[] = [];
  if (day.expectedInCents > 0) moves.push({ kind: "in", label: "Sales", amountCents: day.expectedInCents });
  for (const due of day.dues) moves.push({ kind: "out", label: moveLabel(due), amountCents: due.amountCents });
  return {
    date: day.date,
    label: formatDay(day.date),
    flap: { weekday: weekdayShort(day.date).toUpperCase(), day: String(dayOfMonth(day.date)), month: MONTHS[month]! },
    openingCents: day.openingCents,
    closingCents: day.closingCents,
    state: day.state,
    shortByCents: day.shortByCents,
    moves,
    narrator: narrate(day, index === 0, forecast),
  };
}

export function buildLandingStory(): LandingStory {
  const base = previewDemoForecast();
  const shortIndex = base.days.findIndex((d) => d.state === "short");
  return {
    headline: buildHeadline(base),
    forecast: base,
    today: base.asOf,
    minimumCents: base.minimumBalanceCents,
    days: base.days.map((d, i) => storyDay(d, i, base)),
    shortIndex: shortIndex === -1 ? null : shortIndex,
  };
}
