import type { ActionProposal, Cents, DayState, Decision, Forecast, ForecastDay, Headline, IsoDate, Receipt } from "@/types";
import { buildHeadline, previewDemoForecast, previewDemoMonth, previewDemoStore } from "@/lib/forecast";
import { buildDemoSeed } from "@/lib/demo";
import { judge, type GuardContext } from "@/lib/guard";
import { addDays, dayOfMonth, formatDay, weekdayShort } from "@/lib/shared/dates";
import { formatDollars, formatShortfall } from "@/lib/shared/money";

/**
 * The landing page's story, built on the server from the real forecast engine and the real Margin Guard rules, with no
 * database: the SIMULATED Dunder Mifflin & Co. preview (`previewDemoForecast`, `previewDemoMonth`). Every number and
 * sentence here comes from code templates (AGENTS.md section 5: AI never calculates money), so the page replays
 * identically for every visitor.
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
  /** "Thu", "12". */
  weekday: string;
  day: string;
  /** For the split-flap board (/v2): "THU", "12", "NOV". */
  flap: { weekday: string; day: string; month: string };
  openingCents: Cents;
  closingCents: Cents;
  state: DayState;
  shortByCents: Cents;
  moves: StoryMove[];
  /** One plain sentence, like a subtitle, for this day. */
  narrator: string;
}

/** One way to save the short day, worked out by the forecast and judged by the Guard, as the app would. */
export interface LandingFix {
  id: string;
  /** Short button label: "Remind Ivory & Vow". */
  label: string;
  /** The app's own title for it: "Take a $120 short-term loan". */
  title: string;
  detail: string;
  simulated: boolean;
  /** Each shown day with this fix in place. */
  closings: Cents[];
  states: DayState[];
  shortBy: Cents[];
  decision: Decision;
  /** The deciding rule's plain reason, or "Every check passed." */
  reason: string;
  ruleNumber: number | null;
}

/** The short day: what lands, what's free, what's missing. */
export interface StoryClash {
  label: string;
  dues: { name: string; amountCents: Cents; autoDebit: boolean }[];
  dueCents: Cents;
  /** Money free on the day above the safety cushion, before anything is paid. */
  freeCents: Cents;
  shortByCents: Cents;
  reason: string;
}

/** A regular payment tmrw found in PayPal history, for "Spot". */
export interface FoundPayment {
  name: string;
  amountCents: Cents;
  autoDebit: boolean;
  /** "2, 12 and 22 Nov". */
  when: string;
}

export interface StoryRecovery {
  customer: string;
  what: string;
  grossCents: Cents;
  netCents: Cents;
  feeCents: Cents;
  dueOnLabel: string | null;
  shortBeforeCents: Cents;
  shortAfterCents: Cents;
  /** The payment that wasn't fully ready on the short day, before and after the money arrives. */
  due: { name: string; dateLabel: string; amountCents: Cents; readyBeforeCents: Cents; readyAfterCents: Cents } | null;
}

export interface StoryReceipt {
  receipt: Receipt;
  caption: string;
}

export interface LandingStory {
  headline: Headline;
  forecast: Forecast;
  today: IsoDate;
  todayLabel: string;
  minimumCents: Cents;
  /** Every day of the forecast (30). The landing page shows the first DAYS_SHOWN. */
  days: StoryDay[];
  /** Index of the first short day in `days`, or null. */
  shortIndex: number | null;
  clash: StoryClash | null;
  found: FoundPayment[];
  month: {
    name: string;
    verdict: string;
    focusLine: string | null;
    mustPayCents: Cents;
    comingInCents: Cents;
    leftForPlansCents: Cents;
    goal: { title: string; amountCents: Cents; when: string | null; fits: boolean } | null;
  };
  fixes: LandingFix[];
  recovery: StoryRecovery | null;
  receipts: StoryReceipt[];
}

/** Two weeks: enough to see the short day and that the days after it hold. */
export const DAYS_SHOWN = 14;
const STORE = "st_preview";

const at = (today: IsoDate) => `${today}T09:00:00.000+00:00`;

function list(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function narrate(day: ForecastDay, isFirst: boolean, forecast: Forecast): string {
  const when = isFirst ? "Today" : formatDay(day.date);
  const closing = formatDollars(day.closingCents);
  if (day.state === "short") {
    const reason = forecast.firstShortfall?.date === day.date ? forecast.firstShortfall.reason : "payments leave";
    return `${when}: ${reason}. ${closing} left, ${formatShortfall(day.shortByCents)} less than the shop needs.`;
  }
  if (day.dues.length === 0) return `${when}: about ${formatDollars(day.expectedInCents)} of sales come in. ${closing} by the end of the day.`;
  const names = day.dues.map((d) => `${d.label} (${formatDollars(d.amountCents)})`);
  return `${when}: ${list(names)} ${day.dues.length === 1 ? "is" : "are"} paid. ${closing} left.`;
}

function storyDay(day: ForecastDay, index: number, forecast: Forecast): StoryDay {
  const moves: StoryMove[] = [];
  if (day.expectedInCents > 0) moves.push({ kind: "in", label: "Sales", amountCents: day.expectedInCents });
  for (const due of day.dues) moves.push({ kind: "out", label: due.payeeName, amountCents: due.amountCents });
  return {
    date: day.date,
    label: formatDay(day.date),
    weekday: weekdayShort(day.date),
    day: String(dayOfMonth(day.date)),
    flap: { weekday: weekdayShort(day.date).toUpperCase(), day: String(dayOfMonth(day.date)), month: MONTHS[Number(day.date.slice(5, 7)) - 1]! },
    openingCents: day.openingCents,
    closingCents: day.closingCents,
    state: day.state,
    shortByCents: day.shortByCents,
    moves,
    narrator: narrate(day, index === 0, forecast),
  };
}

const NO_ORDER: Pick<GuardContext, "order" | "orderMissing" | "paypal" | "remindersLast48h" | "spentLast7DaysCents" | "duplicate"> = {
  order: null,
  orderMissing: false,
  paypal: { kind: "NOT_NEEDED" },
  remindersLast48h: null,
  spentLast7DaysCents: 0,
  duplicate: false,
};

function verdict(proposal: ActionProposal, ctx: GuardContext, today: IsoDate) {
  const decision = judge(proposal, ctx, { decidedAt: at(today), demoDate: today });
  const rule = decision.rules.find((r) => r.id === decision.headlineRule);
  return { decision, reason: decision.decision === "APPROVE" ? "Every check passed." : decision.headlineReason, ruleNumber: rule?.number ?? null };
}

/** The seed's open orders this page talks about: Ivory & Vow's unpaid cake, and one from a customer who said no contact. */
function storyOrders(today: IsoDate) {
  const seed = buildDemoSeed(STORE, today, "run_preview");
  const customers = new Map(seed.customers.map((c) => [c.id, c]));
  const facts = (o: (typeof seed.orders)[number]) => {
    const c = customers.get(o.customerId);
    return {
      id: o.id ?? "",
      number: o.number,
      status: "ABANDONED" as const,
      riskHold: false,
      totalCents: o.totalCents,
      paypalOrderId: null,
      customerName: c?.name ?? "A customer",
      contactConsent: c?.contactConsent ?? false,
      customerId: o.customerId,
    };
  };
  const open = seed.orders.filter((o) => o.status === "ABANDONED").map(facts);
  return { owed: open.find((o) => o.contactConsent) ?? null, noContact: open.find((o) => !o.contactConsent) ?? null };
}

type OrderStory = NonNullable<ReturnType<typeof storyOrders>["owed"]>;

function reminder(today: IsoDate, order: OrderStory, sequence: number): ActionProposal {
  return {
    id: `prop_landing_reminder_${order.number}_${sequence}`,
    storeId: STORE,
    type: "SEND_REMINDER",
    target: { kind: "ORDER", id: order.id, label: `Order #${order.number}, ${order.customerName}` },
    amountCents: order.totalCents,
    proposedBy: { kind: "AGENT", agent: "RECOVERY" },
    idempotencyKey: `landing:SEND_REMINDER:${order.id}:${sequence}`,
    sequence,
    draftText: null,
    params: { orderId: order.id, customerId: order.customerId, channel: "SIMULATED_OUTBOX" },
    createdAt: at(today),
    demoDate: today,
  };
}

function orderFacts(order: OrderStory): NonNullable<GuardContext["order"]> {
  return {
    id: order.id,
    number: order.number,
    status: order.status,
    riskHold: order.riskHold,
    totalCents: order.totalCents,
    paypalOrderId: order.paypalOrderId,
    customerName: order.customerName,
    contactConsent: order.contactConsent,
  };
}

/** Three reminders from the story, judged by the real rules, printed as the app's receipts. */
function reminderReceipts(today: IsoDate, orders: ReturnType<typeof storyOrders>): StoryReceipt[] {
  const { owed, noContact } = orders;
  const cases: { proposal: ActionProposal; ctx: GuardContext; caption: (d: Decision) => string }[] = [];
  if (owed) {
    cases.push({
      proposal: reminder(today, owed, 1),
      ctx: { ...NO_ORDER, order: orderFacts(owed), paypal: { kind: "NO_PAYPAL_ORDER" }, remindersLast48h: 0, forecast: { kind: "NOT_NEEDED" } },
      caption: () => `A ${formatDollars(owed.totalCents)} reminder to ${owed.customerName}. They agreed to be contacted, but it's over $100, so Penny taps OK first.`,
    });
  }
  if (noContact) {
    cases.push({
      proposal: reminder(today, noContact, 1),
      ctx: { ...NO_ORDER, order: orderFacts(noContact), paypal: { kind: "NO_PAYPAL_ORDER" }, remindersLast48h: 0, forecast: { kind: "NOT_NEEDED" } },
      caption: () => `${noContact.customerName} left ${formatDollars(noContact.totalCents)} unpaid but never said tmrw could get in touch. No reminder.`,
    });
  }
  if (owed) {
    const paypalOrderId = "5O190127TN364715T";
    cases.push({
      proposal: reminder(today, owed, 2),
      ctx: {
        ...NO_ORDER,
        order: { ...orderFacts(owed), status: "CAPTURED", paypalOrderId },
        paypal: { kind: "CHECKED", paypalOrderId, status: "COMPLETED" },
        remindersLast48h: 1,
        forecast: { kind: "NOT_NEEDED" },
      },
      caption: () => `A second reminder after ${owed.customerName} already paid. PayPal says it's captured, so it never goes.`,
    });
  }
  return cases.map(({ proposal, ctx, caption }, i) => {
    const { decision } = verdict(proposal, ctx, today);
    return {
      caption: caption(decision.decision),
      receipt: {
        id: `rcpt_landing_${i + 1}`,
        storeId: STORE,
        number: i + 1,
        proposal,
        decision,
        events: [{ kind: "DECIDED", at: at(today), demoDate: today, detail: decision.headlineReason, paypalIds: decision.paypalIdsChecked }],
        paypalIds: { checked: decision.paypalIdsChecked, created: [] },
      },
    };
  });
}

function shown(f: Forecast) {
  const days = f.days.slice(0, DAYS_SHOWN);
  return { closings: days.map((d) => d.closingCents), states: days.map((d) => d.state), shortBy: days.map((d) => d.shortByCents) };
}

/** The ways to save the short day: remind the customer who owes, then the app's own fixes (move a payment, a loan). */
function storyFixes(today: IsoDate, base: Forecast, orders: ReturnType<typeof storyOrders>): LandingFix[] {
  const store = previewDemoStore();
  const fixes: LandingFix[] = [];
  const { owed } = orders;
  if (owed) {
    const after = previewDemoForecast({ recovered: true });
    const v = verdict(reminder(today, owed, 1), { ...NO_ORDER, order: orderFacts(owed), paypal: { kind: "NO_PAYPAL_ORDER" }, remindersLast48h: 0, forecast: { kind: "NOT_NEEDED" } }, today);
    fixes.push({
      id: "fix_remind",
      label: `Remind ${owed.customerName}`,
      title: `Remind ${owed.customerName} about the ${formatDollars(owed.totalCents)} they owe`,
      detail: `A friendly note with a fresh PayPal link. If they pay today, what arrives after PayPal's fee lands before ${base.firstShortfall ? formatDay(base.firstShortfall.date) : "the short day"}.`,
      simulated: false,
      ...shown(after),
      decision: v.decision.decision,
      reason: v.reason,
      ruleNumber: v.ruleNumber,
    });
  }
  for (const fix of store.fixes) {
    const common = {
      id: `prop_landing_${fix.id}`,
      storeId: STORE,
      amountCents: fix.amountCents,
      proposedBy: { kind: "OWNER" as const },
      idempotencyKey: `landing:${fix.kind}:${fix.id}:1`,
      sequence: 1,
      draftText: null,
      createdAt: at(today),
      demoDate: today,
    };
    let proposal: ActionProposal | null = null;
    let label = "";
    if (fix.kind === "MOVE_PAYMENT" && fix.dueId && fix.moveToOn) {
      const due = base.days.flatMap((d) => d.dues).find((d) => d.id === fix.dueId);
      if (!due) continue;
      label = `Move ${due.payeeName} to ${formatDay(fix.moveToOn)}`;
      proposal = { ...common, type: "MOVE_PAYMENT", target: { kind: "DUE", id: due.id, label: `${due.payeeName}, due ${formatDay(due.dueOn)}` }, params: { dueId: due.id, fromOn: due.dueOn, toOn: fix.moveToOn } };
    } else if (fix.kind === "GAP_LOAN") {
      label = `Borrow ${formatDollars(fix.amountCents)}`;
      proposal = {
        ...common,
        type: "GAP_LOAN",
        target: { kind: "STORE", id: STORE, label: `${formatDollars(fix.amountCents)}, for ${formatDay(fix.forDate)}` },
        params: { amountCents: fix.amountCents, feeCents: fix.loanFeeCents ?? 0, repayOn: fix.repayOn ?? fix.forDate },
      };
    } else if (fix.kind === "SET_ASIDE" && fix.dailyAmountCents) {
      label = `Set aside ${formatDollars(fix.dailyAmountCents)} a day`;
      proposal = {
        ...common,
        type: "SET_ASIDE",
        target: { kind: "STORE", id: STORE, label: fix.title },
        params: { dailyAmountCents: fix.dailyAmountCents, startOn: today, endOn: addDays(fix.forDate, -1), forDate: fix.forDate },
      };
    }
    if (!proposal) continue;
    const after = store.simulate(proposal);
    const v = verdict(proposal, { ...NO_ORDER, forecast: { kind: "READY", before: base, after } }, today);
    fixes.push({ id: fix.id, label, title: fix.title, detail: fix.detail, simulated: fix.simulated, ...shown(after), decision: v.decision.decision, reason: v.reason, ruleNumber: v.ruleNumber });
  }
  return fixes;
}

function clashOf(base: Forecast): StoryClash | null {
  const gap = base.firstShortfall;
  const day = gap ? base.days.find((d) => d.date === gap.date) : undefined;
  if (!gap || !day) return null;
  const dueCents = day.dues.reduce((sum, d) => sum + d.amountCents, 0);
  return {
    label: formatDay(day.date),
    dues: day.dues.map((d) => ({ name: d.payeeName, amountCents: d.amountCents, autoDebit: false })),
    dueCents,
    freeCents: day.closingCents + dueCents - base.minimumBalanceCents,
    shortByCents: day.shortByCents,
    reason: gap.reason,
  };
}

function monthDays(dates: IsoDate[]): string {
  const month = formatDay(dates[0]!).split(" ").at(-1) ?? "";
  return `${list(dates.map((d) => String(dayOfMonth(d))))} ${month}`;
}

export function buildLandingStory(): LandingStory {
  const base = previewDemoForecast();
  const today = base.asOf;
  const month = previewDemoMonth();
  const orders = storyOrders(today);
  const days = base.days.map((d, i) => storyDay(d, i, base));
  const shortIndex = days.findIndex((d) => d.state === "short");

  // Spot: every regular payment this month, grouped by name, in date order.
  const groups = new Map<string, { amountCents: Cents; autoDebit: boolean; dates: IsoDate[] }>();
  for (const item of month.mustPay) {
    const g = groups.get(item.name) ?? { amountCents: item.amountCents, autoDebit: item.autoDebit, dates: [] };
    g.dates.push(item.date);
    groups.set(item.name, g);
  }
  const found = [...groups].map(([name, g]) => ({ name, amountCents: g.amountCents, autoDebit: g.autoDebit, when: monthDays(g.dates) }));
  const autoDebits = new Set(found.filter((f) => f.autoDebit).map((f) => f.name));

  // Money comes back: the customer who owes pays; what arrives after PayPal's fee fills the short day.
  let recovery: StoryRecovery | null = null;
  if (orders.owed) {
    const recovered = previewDemoForecast({ recovered: true });
    const netCents = recovered.days[0]!.closingCents - base.days[0]!.closingCents;
    const shortBase = base.days.find((d) => d.state === "short");
    const shortDue = shortBase?.dues.find((d) => d.readyCents < d.amountCents);
    const dueAfter = shortDue ? recovered.days.find((d) => d.date === shortBase!.date)?.dues.find((d) => d.id === shortDue.id) : undefined;
    const owedRow = month.comingIn.owed.find((o) => o.orderId === orders.owed!.id);
    recovery = {
      customer: orders.owed.customerName,
      what: "tiered wedding cake",
      grossCents: orders.owed.totalCents,
      netCents,
      feeCents: orders.owed.totalCents - netCents,
      dueOnLabel: owedRow?.dueOn ? formatDay(owedRow.dueOn) : null,
      shortBeforeCents: shortBase?.shortByCents ?? 0,
      shortAfterCents: recovered.days.find((d) => d.date === shortBase?.date)?.shortByCents ?? 0,
      due:
        shortDue && dueAfter
          ? { name: shortDue.payeeName, dateLabel: formatDay(shortDue.dueOn), amountCents: shortDue.amountCents, readyBeforeCents: shortDue.readyCents, readyAfterCents: dueAfter.readyCents }
          : null,
    };
  }

  const clash = clashOf(base);
  const goal = month.wantToDo[0];
  return {
    headline: buildHeadline(base),
    forecast: base,
    today,
    todayLabel: formatDay(today),
    minimumCents: base.minimumBalanceCents,
    days,
    shortIndex: shortIndex === -1 ? null : shortIndex,
    clash: clash ? { ...clash, dues: clash.dues.map((d) => ({ ...d, autoDebit: autoDebits.has(d.name) })) } : null,
    found,
    month: {
      name: month.monthName,
      verdict: month.verdict,
      focusLine: month.focusLine,
      mustPayCents: month.totals.mustPayCents,
      comingInCents: month.totals.comingInCents,
      leftForPlansCents: month.totals.leftForPlansCents,
      goal: goal ? { title: goal.title, amountCents: goal.amountCents, when: goal.wantedOn ? formatDay(goal.wantedOn) : null, fits: goal.fits } : null,
    },
    fixes: storyFixes(today, base, orders),
    recovery,
    receipts: reminderReceipts(today, orders),
  };
}
