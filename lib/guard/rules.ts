import type { ActionProposal, ActionType, Cents, Decision, Forecast, GuardDecision, IsoDate, IsoDateTime, OrderStatus, RuleId, RuleOutcome, RuleResult } from "@/types";
import { formatDay } from "@/lib/shared/dates";
import { formatCents } from "@/lib/shared/money";

/**
 * The Margin Guard's 9 rules (AGENTS.md section 4). Pure: (proposal, context) -> PASS | FAIL | N/A with a plain reason.
 * The context loader (context.ts) gathers the facts first. Anything it couldn't check arrives as "unknown", and the
 * rule FAILS: the Guard fails closed.
 */

/** The owner's line for "goes ahead on its own" (rule 8). */
export const OWNER_APPROVAL_LIMIT_CENTS: Cents = 10_000;
/** A set-aside may keep at most this share of a day's expected sales (rule 7), as tenths: 3 = 30%. */
const SET_ASIDE_CAP_TENTHS = 3;
const MAX_REMINDERS_48H = 2;
/** Rule 9: money out through supplier payments, refunds and loans in any 7 days, before the owner is asked. */
export const SPENDING_LIMIT_CENTS: Cents = 50_000;
export const SPENDING_WINDOW_DAYS = 7;

export interface OrderFacts {
  id: string;
  number: number;
  status: OrderStatus;
  riskHold: boolean;
  totalCents: Cents;
  paypalOrderId: string | null;
  customerName: string;
  contactConsent: boolean;
}

export type PayPalFacts =
  | { kind: "NOT_NEEDED" }
  /** The order has never had a PayPal order, so PayPal has nothing to say about it. */
  | { kind: "NO_PAYPAL_ORDER" }
  | { kind: "CHECKED"; paypalOrderId: string; status: "CREATED" | "APPROVED" | "COMPLETED" | "VOIDED" }
  | { kind: "UNREACHABLE"; paypalOrderId: string };

export type ForecastFacts =
  | { kind: "NOT_NEEDED" }
  | { kind: "READY"; before: Forecast; after: Forecast }
  | { kind: "FAILED" };

/** Everything the rules need to know, gathered by the loader. `null` means "couldn't be checked". */
export interface GuardContext {
  /** The order the action is about (reminders, refunds, holds). Null when it doesn't apply or wasn't found. */
  order: OrderFacts | null;
  /** True when the action names an order that couldn't be found. */
  orderMissing: boolean;
  paypal: PayPalFacts;
  remindersLast48h: number | null;
  /** Another proposal already uses this idempotency key. */
  duplicate: boolean | null;
  forecast: ForecastFacts;
  /** Rule 9: what supplier payments, refunds and loans moved or asked for in the last 7 days, not counting this one. */
  spentLast7DaysCents: number | null;
}

interface RuleDef {
  number: number;
  id: RuleId;
  name: string;
  onFail: "BLOCK" | "ESCALATE";
  appliesTo: readonly ActionType[] | "ALL";
  check: (proposal: ActionProposal, ctx: GuardContext) => [Exclude<RuleOutcome, "N/A">, string];
}

const ACTION_NOUN: Record<ActionType, string> = {
  SEND_REMINDER: "a reminder",
  SET_ASIDE: "a set-aside",
  MOVE_PAYMENT: "moving a payment",
  GAP_LOAN: "a loan",
  PAY_SUPPLIER: "paying a supplier",
  REFUND: "a refund",
  HOLD_ORDER: "a hold",
};

const ALWAYS_ASK: Partial<Record<ActionType, string>> = {
  GAP_LOAN: "Loans always need your OK.",
  MOVE_PAYMENT: "Moving a payment always needs your OK.",
  REFUND: "Refunds always need your OK.",
};

const SAFETY = "so it's stopped to be safe.";
const orderName = (o: OrderFacts) => `order #${o.number}`;

export const RULES: readonly RuleDef[] = [
  {
    number: 1,
    id: "ALREADY_PAID",
    name: "Already paid",
    onFail: "BLOCK",
    appliesTo: ["SEND_REMINDER"],
    check: (_p, { order, paypal }) => {
      if (!order) return ["FAIL", `Couldn't find the order to check, ${SAFETY}`];
      if (paypal.kind === "UNREACHABLE") return ["FAIL", `Couldn't reach PayPal to check ${orderName(order)}, ${SAFETY}`];
      if (paypal.kind === "CHECKED" && paypal.status === "COMPLETED") {
        return ["FAIL", `PayPal shows ${orderName(order)} already paid (PayPal order ${paypal.paypalOrderId}).`];
      }
      if (order.status === "CAPTURED" || order.status === "REFUNDED") return ["FAIL", `${cap(orderName(order))} is already paid.`];
      if (paypal.kind === "CHECKED") return ["PASS", `PayPal shows ${orderName(order)} not paid yet.`];
      return ["PASS", `${cap(orderName(order))} hasn't been paid.`];
    },
  },
  {
    number: 2,
    id: "CONSENT",
    name: "Consent",
    onFail: "BLOCK",
    appliesTo: ["SEND_REMINDER"],
    check: (_p, { order }) => {
      if (!order) return ["FAIL", `Couldn't find the customer to check, ${SAFETY}`];
      return order.contactConsent
        ? ["PASS", `${order.customerName} agreed to hear from the shop.`]
        : ["FAIL", `${order.customerName} hasn't agreed to hear from the shop.`];
    },
  },
  {
    number: 3,
    id: "CONTACT_FREQUENCY",
    name: "Contact frequency",
    onFail: "BLOCK",
    appliesTo: ["SEND_REMINDER"],
    check: (_p, { order, remindersLast48h: sent }) => {
      if (!order || sent === null) return ["FAIL", `Couldn't count recent reminders, ${SAFETY}`];
      if (sent >= MAX_REMINDERS_48H) return ["FAIL", `${order.customerName} already got ${sent} reminders about ${orderName(order)} in the last 48 hours.`];
      if (sent === 0) return ["PASS", `No reminders about ${orderName(order)} in the last 48 hours.`];
      return ["PASS", `1 reminder about ${orderName(order)} in the last 48 hours. The most is ${MAX_REMINDERS_48H}.`];
    },
  },
  {
    number: 4,
    id: "RISK_HOLD",
    name: "Risk hold",
    onFail: "ESCALATE",
    appliesTo: ["SEND_REMINDER", "REFUND"],
    check: (_p, { order }) => {
      if (!order) return ["FAIL", "Couldn't find the order to check for a risk hold, so you decide."];
      return order.riskHold ? ["FAIL", `${cap(orderName(order))} is on risk hold, so you decide.`] : ["PASS", `${cap(orderName(order))} isn't on risk hold.`];
    },
  },
  {
    number: 5,
    id: "DUPLICATE",
    name: "Duplicate action",
    onFail: "BLOCK",
    appliesTo: "ALL",
    check: (_p, { duplicate }) => {
      if (duplicate === null) return ["FAIL", `Couldn't check for an earlier copy, ${SAFETY}`];
      return duplicate
        ? ["FAIL", "This exact action was already asked for. Asking twice doesn't do it twice."]
        : ["PASS", "This action hasn't been asked for before."];
    },
  },
  {
    number: 6,
    id: "MINIMUM_BALANCE",
    name: "Minimum balance",
    onFail: "BLOCK",
    appliesTo: ["PAY_SUPPLIER", "REFUND", "MOVE_PAYMENT", "GAP_LOAN", "SET_ASIDE"],
    check: (_p, { forecast }) => {
      if (forecast.kind !== "READY") return ["FAIL", `Couldn't work out the forecast with this change, ${SAFETY}`];
      const { before, after } = forecast;
      const minimum = after.minimumBalanceCents;
      const beforeByDate = new Map(before.days.map((d) => [d.date, d.closingCents]));
      const worse = after.days.find((d) => d.closingCents < minimum && d.closingCents < (beforeByDate.get(d.date) ?? Number.POSITIVE_INFINITY));
      if (worse) return ["FAIL", `It would leave ${formatDay(worse.date)} at ${formatCents(worse.closingCents)}, below your ${formatCents(minimum)} minimum.`];
      const short = after.days.find((d) => d.closingCents < minimum);
      if (short) return ["PASS", `${formatDay(short.date)} is already short, and this doesn't make it worse.`];
      return ["PASS", `Every day stays at or above your ${formatCents(minimum)} minimum.`];
    },
  },
  {
    number: 7,
    id: "SET_ASIDE_CAP",
    name: "Set-aside cap",
    onFail: "BLOCK",
    appliesTo: ["SET_ASIDE"],
    check: (p, { forecast }) => {
      if (p.type !== "SET_ASIDE") return ["FAIL", "Not a set-aside."];
      if (forecast.kind !== "READY") return ["FAIL", `Couldn't work out each day's expected sales, ${SAFETY}`];
      const { dailyAmountCents: daily, startOn, endOn } = p.params;
      const window = forecast.before.days.filter((d) => d.date >= startOn && d.date <= endOn);
      if (window.length === 0 || window.at(-1)!.date !== endOn || window[0]!.date !== startOn) {
        return ["FAIL", `Can't check days outside the 14-day forecast, ${SAFETY}`];
      }
      const over = window.find((d) => daily * 10 > d.expectedInCents * SET_ASIDE_CAP_TENTHS);
      if (over) {
        return ["FAIL", `${formatCents(daily)} a day is more than 30% of ${formatDay(over.date)}'s expected sales (${formatCents(over.expectedInCents)}).`];
      }
      const lowest = [...window].sort((a, b) => a.expectedInCents - b.expectedInCents)[0]!;
      return ["PASS", `${formatCents(daily)} a day is within 30% of each day's expected sales (lowest: ${formatDay(lowest.date)}, ${formatCents(lowest.expectedInCents)}).`];
    },
  },
  {
    number: 8,
    id: "OWNER_APPROVAL",
    name: "Owner approval",
    onFail: "ESCALATE",
    appliesTo: "ALL",
    check: (p) => {
      const always = ALWAYS_ASK[p.type];
      if (always) return ["FAIL", always];
      if (p.amountCents > OWNER_APPROVAL_LIMIT_CENTS) {
        return ["FAIL", `It's ${formatCents(p.amountCents)}, over the ${formatCents(OWNER_APPROVAL_LIMIT_CENTS)} NeverShort can do on its own.`];
      }
      return ["PASS", `${formatCents(p.amountCents)} is within the ${formatCents(OWNER_APPROVAL_LIMIT_CENTS)} NeverShort can do on its own.`];
    },
  },
  {
    number: 9,
    id: "TOTAL_SPENDING",
    name: "Total spending",
    onFail: "ESCALATE",
    appliesTo: ["PAY_SUPPLIER", "REFUND", "GAP_LOAN"],
    check: (p, { spentLast7DaysCents: spent }) => {
      if (spent === null) return ["FAIL", "Couldn't add up this week's spending, so you decide."];
      const total = spent + p.amountCents;
      const within = `${formatCents(total)} in ${SPENDING_WINDOW_DAYS} days with this one, against a limit of ${formatCents(SPENDING_LIMIT_CENTS)}`;
      return total > SPENDING_LIMIT_CENTS ? ["FAIL", `That makes ${within}, so you decide.`] : ["PASS", `That makes ${within}.`];
    },
  },
];

function cap(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** All 9 rules, in order, each PASS, FAIL or N/A with a plain reason. */
export function runRules(proposal: ActionProposal, ctx: GuardContext): RuleResult[] {
  return RULES.map((rule) => {
    const applies = rule.appliesTo === "ALL" || rule.appliesTo.includes(proposal.type);
    const [outcome, reason]: [RuleOutcome, string] = applies ? rule.check(proposal, ctx) : ["N/A", `Doesn't apply to ${ACTION_NOUN[proposal.type]}.`];
    return { number: rule.number, id: rule.id, name: rule.name, outcome, onFail: rule.onFail, reason };
  });
}

/** BLOCK if any failing rule blocks; otherwise ESCALATE if any fails; otherwise APPROVE. The headline is the lowest-numbered rule behind it. */
export function decide(results: readonly RuleResult[]): { decision: Decision; headlineRule: RuleId | null; headlineReason: string } {
  const failing = results.filter((r) => r.outcome === "FAIL");
  const decision: Decision = failing.some((r) => r.onFail === "BLOCK") ? "BLOCK" : failing.length > 0 ? "ESCALATE" : "APPROVE";
  if (decision === "APPROVE") return { decision, headlineRule: null, headlineReason: "Every rule passed." };
  const headline = failing.filter((r) => r.onFail === decision).sort((a, b) => a.number - b.number)[0]!;
  return { decision, headlineRule: headline.id, headlineReason: headline.reason };
}

/** The whole decision for a proposal, from its context. */
export function judge(proposal: ActionProposal, ctx: GuardContext, at: { decidedAt: IsoDateTime; demoDate: IsoDate }): GuardDecision {
  const rules = runRules(proposal, ctx);
  return {
    proposalId: proposal.id,
    ...decide(rules),
    rules,
    paypalIdsChecked: ctx.paypal.kind === "CHECKED" || ctx.paypal.kind === "UNREACHABLE" ? [ctx.paypal.paypalOrderId] : [],
    decidedAt: at.decidedAt,
    demoDate: at.demoDate,
  };
}

/** Just before an owner-approved action runs: only the BLOCK rules count. Returns the first one that now fails, if any. */
export function recheckBlockingRules(proposal: ActionProposal, ctx: GuardContext): RuleResult | null {
  return runRules(proposal, ctx).find((r) => r.onFail === "BLOCK" && r.outcome === "FAIL") ?? null;
}
