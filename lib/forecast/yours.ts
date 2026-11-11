import type { ActionProposal, Cents, Due, FixOption, Forecast, Headline, IsoDate, PayeeKind } from "@/types";
import { addDays, formatDay } from "@/lib/shared/dates";
import { assertCents, formatDollars } from "@/lib/shared/money";
import { adjustmentsFor, FORECAST_DAYS, forecastFrom, withAdjustments, type ForecastInput } from "./engine";
import { fixOptionsFrom } from "./fixes";
import { buildHeadline } from "./headline";

/**
 * "Try it with your numbers" (/try): a visitor types a few numbers and gets the same 30-day forecast, headline and fix
 * ideas the app gives Dunder Mifflin & Co., from the same engine. Pure: nothing is stored, no database, no AI.
 *
 * The real app learns sales from PayPal history (an average per weekday). Here the visitor gives one normal day's sales,
 * used for every day, so confidence is "medium" and says why.
 */

export interface YourPayment {
  name: string;
  kind: PayeeKind;
  amountCents: Cents;
  /** Days from today, 0 to 13. */
  inDays: number;
  /** Also goes out every 7 days after that, within the 30 days. */
  weekly: boolean;
}

export interface YourNumbers {
  balanceCents: Cents;
  dailySalesCents: Cents;
  minimumBalanceCents: Cents;
  payments: YourPayment[];
}

export interface YourForecast {
  forecast: Forecast;
  headline: Headline;
  fixes: FixOption[];
}

/** Tight = within this share of the minimum above it (Dunder Mifflin & Co.: $50 on a $100 minimum), at least $25. */
export function warningZoneFor(minimumBalanceCents: Cents): Cents {
  return Math.max(2_500, Math.round(minimumBalanceCents / 2));
}

/** How a payment reads inside the headline: "rent", "the Acme order", "your pay". */
function labelFor(p: YourPayment): string {
  const name = p.name.trim();
  if (p.kind === "SUPPLIER") return /^suppliers?$/i.test(name) ? "the supplier order" : `the ${name} order`;
  if (p.kind === "OWNER_TRANSFER") return "your transfer to the bank";
  return /^[A-Z][a-z]/.test(name) && !/\s[A-Z]/.test(name) ? name.charAt(0).toLowerCase() + name.slice(1) : name;
}

function yourInput(numbers: YourNumbers, today: IsoDate): ForecastInput {
  for (const c of [numbers.balanceCents, numbers.dailySalesCents, numbers.minimumBalanceCents]) assertCents(c);
  const outs: Due[] = [];
  numbers.payments.forEach((p, i) => {
    assertCents(p.amountCents);
    if (p.amountCents <= 0) return;
    for (let d = p.inDays; d < FORECAST_DAYS; d += p.weekly ? 7 : FORECAST_DAYS) {
      const dueOn = addDays(today, d);
      outs.push({
        id: `try_${i}_${dueOn}`,
        storeId: "st_try",
        payeeId: `try_payee_${i}`,
        // A plain "Supplier" reads as "your supplier" in the fix ideas ("Move your supplier's $600 payment").
        payeeName: p.kind === "SUPPLIER" && /^suppliers?$/i.test(p.name.trim()) ? "your supplier" : p.name.trim(),
        label: labelFor(p),
        kind: p.kind,
        dueOn,
        amountCents: p.amountCents,
        readyCents: 0,
        status: "SCHEDULED",
        movedFromOn: null,
        simulated: false,
      });
    }
  });
  const input: ForecastInput = {
    storeId: "st_try",
    today,
    minimumBalanceCents: numbers.minimumBalanceCents,
    tightMarginCents: warningZoneFor(numbers.minimumBalanceCents),
    startBalanceCents: numbers.balanceCents,
    expectedByWeekday: Array.from({ length: 7 }, () => numbers.dailySalesCents),
    confidence: "medium",
    confidenceReason: "Worked out from the numbers you typed in, not from your PayPal history.",
    extraIn: new Map(),
    outs,
    setAsides: [],
    heldByDate: new Map(),
  };
  return input;
}

export function yourForecast(numbers: YourNumbers, today: IsoDate): YourForecast {
  const input = yourInput(numbers, today);
  const forecast = forecastFrom(input);
  return { forecast, headline: buildHeadline(forecast), fixes: fixOptionsFrom(input).slice(0, 3) };
}

export interface YourFix {
  fix: FixOption;
  /** The Guard proposal for it, built the way the app's proposeFix does (no database, so no stored key). */
  proposal: ActionProposal;
  before: Forecast;
  after: Forecast;
}

/**
 * The visitor tried one of the fix ideas: its Guard proposal and the 30 days as they'd be with it, rebuilt from the
 * numbers on the server. Null when that fix isn't on offer for these numbers.
 */
export function yourFix(numbers: YourNumbers, fixId: string, today: IsoDate): YourFix | null {
  const input = yourInput(numbers, today);
  const fix = fixOptionsFrom(input).find((f) => f.id === fixId);
  if (!fix) return null;
  const base = (type: ActionProposal["type"], target: ActionProposal["target"]) => ({
    id: `prop_try_${fix.id}`,
    storeId: "st_try",
    target,
    amountCents: fix.amountCents,
    proposedBy: { kind: "OWNER" } as const,
    idempotencyKey: `try:${type}:${target.id}:1`,
    sequence: 1,
    draftText: null,
    createdAt: `${today}T09:00:00.000+00:00`,
    demoDate: today,
  });
  let proposal: ActionProposal;
  if (fix.kind === "SET_ASIDE") {
    const daily = fix.dailyAmountCents ?? 0;
    proposal = {
      ...base("SET_ASIDE", { kind: "STORE", id: "st_try", label: `${formatDollars(daily)} a day until ${formatDay(fix.forDate)}` }),
      type: "SET_ASIDE",
      params: { dailyAmountCents: daily, startOn: today, endOn: addDays(fix.forDate, -1), forDate: fix.forDate },
    };
  } else if (fix.kind === "MOVE_PAYMENT") {
    const due = input.outs.find((d) => d.id === fix.dueId);
    if (!due || !fix.moveToOn) return null;
    proposal = {
      ...base("MOVE_PAYMENT", { kind: "DUE", id: due.id, label: `${due.payeeName}, due ${formatDay(due.dueOn)}` }),
      type: "MOVE_PAYMENT",
      params: { dueId: due.id, fromOn: due.dueOn, toOn: fix.moveToOn },
    };
  } else {
    proposal = {
      ...base("GAP_LOAN", { kind: "STORE", id: "st_try", label: `${formatDollars(fix.amountCents)}, for ${formatDay(fix.forDate)}` }),
      type: "GAP_LOAN",
      params: { amountCents: fix.amountCents, feeCents: fix.loanFeeCents ?? 0, repayOn: fix.repayOn ?? fix.forDate },
    };
  }
  return { fix, proposal, before: forecastFrom(input), after: forecastFrom(withAdjustments(input, adjustmentsFor(proposal, today))) };
}
