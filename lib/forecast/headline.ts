import type { Forecast, Headline } from "@/types";
import { daysBetween, formatDay, weekdayLong } from "@/lib/shared/dates";
import { formatDollars, formatShortfall } from "@/lib/shared/money";

/**
 * The one sentence that opens the home screen, read like a weather forecast.
 * Built from code templates only (AGENTS.md section 5), so the demo replays word for word.
 *
 *   "Clear until Wednesday. On Thu 12 Nov you'll be $90 short: the supplier order and rent land the same day."
 */
export function buildHeadline(forecast: Forecast): Headline {
  const today = forecast.asOf;
  const gap = forecast.firstShortfall;

  if (gap) {
    const daysAway = daysBetween(today, gap.date);
    const amount = formatShortfall(gap.amountCents);
    if (daysAway <= 0) return { text: `Today you're ${amount} short: ${gap.reason}.`, tone: "short" };
    const lead = daysAway === 1 ? "Clear today." : `Clear until ${weekdayLong(forecastDayBefore(forecast, gap.date))}.`;
    return { text: `${lead} On ${formatDay(gap.date)} you'll be ${amount} short: ${gap.reason}.`, tone: "short" };
  }

  const tight = forecast.days.find((d) => d.state === "tight");
  if (tight) {
    const spare = formatDollars(tight.closingCents - forecast.minimumBalanceCents);
    return {
      text: `Covered for the next two weeks. ${formatDay(tight.date)} is tight, with ${spare} above your minimum.`,
      tone: "tight",
    };
  }

  // Name the heaviest day of bills and supplier orders (the owner's own transfers don't count).
  const billsOut = (day: (typeof forecast.days)[number]) =>
    day.dues.filter((d) => d.kind !== "OWNER_TRANSFER").reduce((sum, d) => sum + d.amountCents, 0);
  const busiest = [...forecast.days].sort((a, b) => billsOut(b) - billsOut(a))[0];
  if (busiest && billsOut(busiest) > 0) {
    const labels = busiest.dues.filter((d) => d.kind !== "OWNER_TRANSFER").map((d) => d.label);
    const what = labels.length === 1 ? labels[0]! : `${labels.slice(0, -1).join(", ")} and ${labels.at(-1)}`;
    return {
      text: `Clear for the next two weeks. ${formatDay(busiest.date)} is covered too, when ${what} ${labels.length === 1 ? "goes" : "go"} out.`,
      tone: "covered",
    };
  }
  return { text: "Clear for the next two weeks. Nothing is due that sales won't cover.", tone: "covered" };
}

function forecastDayBefore(forecast: Forecast, date: string): string {
  const index = forecast.days.findIndex((d) => d.date === date);
  return forecast.days[Math.max(0, index - 1)]!.date;
}
