import type { ActionProposal, Cents, DayState, Decision, Forecast, ForecastDay, Headline, IsoDate, Receipt } from "@/types";
import { buildHeadline, previewDemoForecast } from "@/lib/forecast";
import { judge, type GuardContext } from "@/lib/guard";
import { addDays, dayOfMonth, daysBetween, formatDay, weekdayShort } from "@/lib/shared/dates";
import { formatDollars, formatShortfall } from "@/lib/shared/money";

/**
 * The landing page's story, built on the server from the real forecast engine and the real Guard rules, with no
 * database: the SIMULATED Loop Audio preview (`previewDemoForecast`). Every number and sentence here comes from code
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

/** One position of the "keep aside $X a day" slider, worked out by the forecast and judged by the Guard. */
export interface FixStep {
  dailyCents: Cents;
  totalCents: Cents;
  closings: Cents[];
  states: DayState[];
  /** Each day's shortfall below the minimum (0 unless short). */
  shortBy: Cents[];
  /** What the owner's bank transfer comes to with this set-aside, or null if there's none in the window. */
  transferCents: Cents | null;
  /** The Guard's decision on this set-aside; null for $0 (nothing to decide). */
  decision: Decision | null;
  /** The decision's reason in plain words, from the deciding rule (or "Every check passed."). */
  reason: string;
  ruleNumber: number | null;
}

export interface LandingStory {
  headline: Headline;
  /** The forecast itself, for the hero's strip of 14 tickets. */
  forecast: Forecast;
  today: IsoDate;
  minimumCents: Cents;
  days: StoryDay[];
  /** Index of the first short day, or null. */
  shortIndex: number | null;
  /** Steps of $1 a day, from $0 to MAX_DAILY_DOLLARS. */
  steps: FixStep[];
  /** The smallest step the Guard approves that leaves no short day. */
  bestStep: number | null;
  recovery: {
    label: string;
    grossCents: Cents;
    netCents: Cents;
    feeCents: Cents;
    shortByAfterCents: Cents;
    /** The payment that was short on the short day, before and after the recovered money arrives. */
    due: { name: string; dateLabel: string; amountCents: Cents; readyBeforeCents: Cents; readyAfterCents: Cents } | null;
  };
  receipts: Receipt[];
}

export const MAX_DAILY_DOLLARS = 70;
const STORE = "st_preview";
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

const at = (today: IsoDate) => `${today}T09:00:00.000+00:00`;

function list(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

function moveLabel(day: ForecastDay["dues"][number]): string {
  return day.kind === "OWNER_TRANSFER" ? "Owner's pay to the bank" : day.payeeName;
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

function setAsideProposal(today: IsoDate, forDate: IsoDate, dailyCents: Cents): ActionProposal {
  const days = Math.max(0, daysBetween(today, forDate));
  return {
    id: `prop_landing_set_aside_${dailyCents}`,
    storeId: STORE,
    type: "SET_ASIDE",
    target: { kind: "STORE", id: STORE, label: `${formatDollars(dailyCents)} a day until ${formatDay(forDate)}` },
    amountCents: dailyCents * days,
    proposedBy: { kind: "OWNER" },
    idempotencyKey: `landing:SET_ASIDE:${STORE}:1`,
    sequence: 1,
    draftText: null,
    params: { dailyAmountCents: dailyCents, startOn: today, endOn: addDays(forDate, -1), forDate },
    createdAt: at(today),
    demoDate: today,
  };
}

const NO_ORDER: Pick<GuardContext, "order" | "orderMissing" | "paypal" | "remindersLast48h" | "spentLast7DaysCents"> = {
  order: null,
  orderMissing: false,
  paypal: { kind: "NOT_NEEDED" },
  remindersLast48h: null,
  spentLast7DaysCents: null,
};

function fixSteps(base: Forecast): FixStep[] {
  const today = base.asOf;
  const forDate = base.firstShortfall?.date ?? null;
  return Array.from({ length: MAX_DAILY_DOLLARS + 1 }, (_, dollars) => {
    const dailyCents = dollars * 100;
    const after = forDate ? previewDemoForecast({ setAsideDailyCents: dailyCents }) : base;
    const transfer = after.days.flatMap((d) => d.dues).find((d) => d.kind === "OWNER_TRANSFER" && (!forDate || d.dueOn < forDate));
    const step: FixStep = {
      dailyCents,
      totalCents: 0,
      closings: after.days.map((d) => d.closingCents),
      states: after.days.map((d) => d.state),
      shortBy: after.days.map((d) => d.shortByCents),
      transferCents: transfer?.amountCents ?? null,
      decision: null,
      reason: "",
      ruleNumber: null,
    };
    if (!forDate || dailyCents === 0) return step;
    const proposal = setAsideProposal(today, forDate, dailyCents);
    const decision = judge(
      proposal,
      { ...NO_ORDER, duplicate: false, forecast: { kind: "READY", before: base, after } },
      { decidedAt: at(today), demoDate: today },
    );
    const rule = decision.rules.find((r) => r.id === decision.headlineRule);
    return {
      ...step,
      totalCents: proposal.amountCents,
      decision: decision.decision,
      reason: decision.decision === "APPROVE" ? "Every check passed." : decision.headlineReason,
      ruleNumber: rule?.number ?? null,
    };
  });
}

/** Three reminders from the demo story, judged by the real rules: approved, waiting for the owner, blocked. */
function reminderReceipts(today: IsoDate): Receipt[] {
  const reminder = (n: number, orderId: string, label: string, amountCents: Cents, sequence: number): ActionProposal => ({
    id: `prop_landing_reminder_${n}`,
    storeId: STORE,
    type: "SEND_REMINDER",
    target: { kind: "ORDER", id: orderId, label },
    amountCents,
    proposedBy: { kind: "AGENT", agent: "RECOVERY" },
    idempotencyKey: `landing:SEND_REMINDER:${orderId}:${sequence}`,
    sequence,
    draftText: null,
    params: { orderId, customerId: `cus_${orderId}`, channel: "SIMULATED_OUTBOX" },
    createdAt: at(today),
    demoDate: today,
  });
  const maya = { id: "ord_1258", number: 1258, riskHold: false, totalCents: 7_200, customerName: "Maya Okafor", contactConsent: true };
  const cases: { proposal: ActionProposal; ctx: GuardContext }[] = [
    {
      proposal: reminder(1, maya.id, "Order #1258, Maya Okafor", maya.totalCents, 1),
      ctx: { ...NO_ORDER, order: { ...maya, status: "ABANDONED", paypalOrderId: null }, paypal: { kind: "NO_PAYPAL_ORDER" }, remindersLast48h: 0, duplicate: false, forecast: { kind: "NOT_NEEDED" } },
    },
    {
      proposal: reminder(2, "ord_1261", "Order #1261, Sam Whitfield", 11_900, 1),
      ctx: {
        ...NO_ORDER,
        order: { id: "ord_1261", number: 1261, status: "FAILED", riskHold: false, totalCents: 11_900, paypalOrderId: null, customerName: "Sam Whitfield", contactConsent: true },
        paypal: { kind: "NO_PAYPAL_ORDER" },
        remindersLast48h: 0,
        duplicate: false,
        forecast: { kind: "NOT_NEEDED" },
      },
    },
    {
      proposal: reminder(3, maya.id, "Order #1258, Maya Okafor", maya.totalCents, 2),
      ctx: {
        ...NO_ORDER,
        order: { ...maya, status: "CAPTURED", paypalOrderId: "5O190127TN364715T" },
        paypal: { kind: "CHECKED", paypalOrderId: "5O190127TN364715T", status: "COMPLETED" },
        remindersLast48h: 1,
        duplicate: false,
        forecast: { kind: "NOT_NEEDED" },
      },
    },
  ];
  return cases.map(({ proposal, ctx }, i) => {
    const decision = judge(proposal, ctx, { decidedAt: at(today), demoDate: today });
    return {
      id: `rcpt_landing_${i + 1}`,
      storeId: STORE,
      number: i + 1,
      proposal,
      decision,
      events: [{ kind: "DECIDED", at: at(today), demoDate: today, detail: decision.headlineReason, paypalIds: decision.paypalIdsChecked }],
      paypalIds: { checked: decision.paypalIdsChecked, created: [] },
    };
  });
}

export function buildLandingStory(): LandingStory {
  const base = previewDemoForecast();
  const recovered = previewDemoForecast({ recovered: true });
  const days = base.days.map((d, i) => storyDay(d, i, base));
  const shortIndex = base.days.findIndex((d) => d.state === "short");
  const steps = fixSteps(base);
  const best = steps.findIndex((s) => s.decision === "APPROVE" && !s.states.includes("short"));
  const netCents = recovered.days[0]!.closingCents - base.days[0]!.closingCents;
  const grossCents = 7_200;
  const shortAfter = recovered.days.find((d) => d.state === "short");
  const shortBase = base.days.find((d) => d.state === "short");
  const shortDue = shortBase?.dues.find((d) => d.readyCents < d.amountCents);
  const dueAfter = shortDue ? recovered.days.find((d) => d.date === shortBase!.date)?.dues.find((d) => d.id === shortDue.id) : undefined;
  return {
    headline: buildHeadline(base),
    forecast: base,
    today: base.asOf,
    minimumCents: base.minimumBalanceCents,
    days,
    shortIndex: shortIndex === -1 ? null : shortIndex,
    steps,
    bestStep: best === -1 ? null : best,
    recovery: {
      label: "Order #1258, Maya Okafor",
      grossCents,
      netCents,
      feeCents: grossCents - netCents,
      shortByAfterCents: shortAfter?.shortByCents ?? 0,
      due:
        shortDue && dueAfter
          ? {
              name: shortDue.payeeName,
              dateLabel: formatDay(shortDue.dueOn),
              amountCents: shortDue.amountCents,
              readyBeforeCents: shortDue.readyCents,
              readyAfterCents: dueAfter.readyCents,
            }
          : null,
    },
    receipts: reminderReceipts(base.asOf),
  };
}
