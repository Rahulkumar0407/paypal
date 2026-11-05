import type { Cents, FixOption, IsoDate } from "@/types";
import { addDays, daysBetween, formatDay } from "@/lib/shared/dates";
import { formatCents, formatDollars } from "@/lib/shared/money";
import { FORECAST_DAYS, runForecast, withAdjustments, type Adjustment, type ForecastInput } from "./engine";

/**
 * Fix the gap: up to three ways to cover the first short day (AGENTS.md section 2, feature 6). Pure: inputs in,
 * options out, each one checked by running the forecast with it.
 *
 *   1. Set aside $X a day: keep $X a day of the owner's transfers to the bank in PayPal from today until the short
 *      day, the smallest whole-dollar amount that makes the day covered (or, if that breaks the 30% cap, not short).
 *   2. Move a payment due that day to the first later date the forecast covers. Simulated.
 *   3. A gap loan for the exact gap (rounded up to the dollar), paid in today and repaid with a small fee on the first
 *      later day that stays covered. Simulated.
 */

/** The simulated gap loan's fee: 2% of the loan, rounded up to the cent. */
export const GAP_LOAN_FEE_PERCENT = 2;

/** Guard rule 7: at most 30% of a day's expected sales. Integer maths, no floats. */
const withinCap = (daily: Cents, expected: Cents) => daily * 10 <= expected * 3;
const MOVE_ORDER = { SUPPLIER: 0, LOAN: 1, BILL: 2, OWNER_TRANSFER: 3 } as const;

function possessive(name: string): string {
  return name.endsWith("s") ? `${name}'` : `${name}'s`;
}

function list(labels: string[]): string {
  return labels.length <= 1 ? (labels[0] ?? "") : `${labels.slice(0, -1).join(", ")} and ${labels.at(-1)}`;
}

export function fixOptionsFrom(input: ForecastInput): FixOption[] {
  const base = runForecast(input, FORECAST_DAYS);
  const gap = base.firstShortfall;
  if (!gap) return [];
  const forDate = gap.date;
  const day = base.days.find((d) => d.date === forDate)!;
  const minimum = input.minimumBalanceCents;
  const covered = minimum + input.tightMarginCents;
  const after = (adjustments: Adjustment[]) => runForecast(withAdjustments(input, adjustments), FORECAST_DAYS);
  const dayIn = (run: ReturnType<typeof runForecast>, date: IsoDate) => run.days.find((d) => d.date === date)!;
  const noShortFrom = (run: ReturnType<typeof runForecast>, from: IsoDate) => run.days.every((d) => d.date < from || d.state !== "short");
  const empty = { dailyAmountCents: null, days: null, dueId: null, moveToOn: null, loanFeeCents: null, repayOn: null };
  const options: FixOption[] = [];

  // 1. Set aside a little each day, kept back from the owner's transfers before the short day.
  const days = daysBetween(input.today, forDate);
  const transfers = input.outs.filter((d) => d.kind === "OWNER_TRANSFER" && d.status !== "PAID" && d.dueOn >= input.today && d.dueOn < forDate);
  const transferTotal = transfers.reduce((sum, d) => sum + d.amountCents, 0);
  if (days > 0 && transferTotal > 0) {
    const window = base.days.slice(0, days);
    for (const target of [covered, minimum]) {
      const daily = Math.ceil((target - day.closingCents) / days / 100) * 100;
      const total = daily * days;
      if (daily <= 0 || total > transferTotal || !window.every((d) => withinCap(daily, d.expectedInCents))) continue;
      const result = dayIn(after([{ kind: "SET_ASIDE", dailyAmountCents: daily, startOn: input.today, endOn: addDays(forDate, -1), forDate }]), forDate);
      const when = list([...new Set(transfers.map((t) => formatDay(t.dueOn)))]);
      options.push({
        ...empty,
        id: "fix_set_aside",
        kind: "SET_ASIDE",
        forDate,
        title: `Set aside ${formatDollars(daily)} a day until ${formatDay(forDate)}`,
        detail: `Keep ${formatDollars(daily)} a day of sales in PayPal instead of moving it to your bank on ${when}. That's ${formatDollars(total)} by ${formatDay(forDate)}.`,
        amountCents: total,
        dailyAmountCents: daily,
        days,
        simulated: false,
        resultingClosingCents: result.closingCents,
        resultingState: result.state,
      });
      break;
    }
  }

  // 2. Move one of that day's payments to the first later date the forecast covers.
  const movable = day.dues
    .filter((d) => d.status !== "PAID" && d.kind !== "OWNER_TRANSFER")
    .sort((a, b) => MOVE_ORDER[a.kind] - MOVE_ORDER[b.kind] || b.amountCents - a.amountCents);
  search: for (const due of movable) {
    for (const toOn of base.days.filter((d) => d.date > forDate).map((d) => d.date)) {
      const run = after([{ kind: "MOVE_DUE", dueId: due.id, toOn }]);
      if (!noShortFrom(run, forDate) || dayIn(run, toOn).state !== "covered") continue;
      const others = day.dues.filter((d) => d.id !== due.id).map((d) => d.label);
      const stay = others.length > 0 ? ` ${list(others).charAt(0).toUpperCase()}${list(others).slice(1)} still ${others.length === 1 ? "goes" : "go"} out on ${formatDay(forDate)}.` : "";
      const result = dayIn(run, forDate);
      options.push({
        ...empty,
        id: `fix_move_${due.id}`,
        kind: "MOVE_PAYMENT",
        forDate,
        title: `Move ${possessive(due.payeeName)} ${formatDollars(due.amountCents)} payment to ${formatDay(toOn)}`,
        detail: `Sales by ${formatDay(toOn)} cover it.${stay} Simulated: no real payment date changes.`,
        amountCents: due.amountCents,
        dueId: due.id,
        moveToOn: toOn,
        simulated: true,
        resultingClosingCents: result.closingCents,
        resultingState: result.state,
      });
      break search;
    }
  }

  // 3. A simulated gap loan for the exact gap, repaid on the first later day that stays covered.
  const amount = Math.ceil(gap.amountCents / 100) * 100;
  const fee = Math.ceil((amount * GAP_LOAN_FEE_PERCENT) / 100);
  for (const repayOn of base.days.filter((d) => d.date > forDate).map((d) => d.date)) {
    const run = after([{ kind: "GAP_LOAN", id: "fix_gap_loan", amountCents: amount, feeCents: fee, receivedOn: input.today, repayOn }]);
    if (!noShortFrom(run, forDate) || dayIn(run, repayOn).state !== "covered") continue;
    const result = dayIn(run, forDate);
    options.push({
      ...empty,
      id: "fix_gap_loan",
      kind: "GAP_LOAN",
      forDate,
      title: `Take a ${formatDollars(amount)} short-term loan`,
      detail: `Paid in today, ${formatCents(amount + fee)} back on ${formatDay(repayOn)}. Simulated: no real loan is made.`,
      amountCents: amount,
      loanFeeCents: fee,
      repayOn,
      simulated: true,
      resultingClosingCents: result.closingCents,
      resultingState: result.state,
    });
    break;
  }

  return options.slice(0, 3);
}
