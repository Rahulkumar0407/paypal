import type { Cents, DayState, IsoDate } from "@/types";
import { dayOfMonth, daysBetween, formatDay, weekdayShort } from "@/lib/shared/dates";
import { formatDollars, formatShortfall } from "@/lib/shared/money";
import { affordability, MAX_HORIZON_DAYS, runForecast, type ForecastInput, type StoreRows } from "./engine";

/**
 * The month page: the shop's month as a planner, in four parts (Must pay, Coming in, Want to do, the focus line),
 * plus the Today panel. Pure: rows and the forecast's inputs in, the page's numbers out. No AI, no database, no clock.
 * Every number here comes from the forecast engine, so the page and the forecast always agree.
 */

export interface MonthGoal {
  id: string;
  title: string;
  amountCents: Cents;
  /** Already put aside for it, inside the PayPal balance. */
  savedCents: Cents;
  wantedOn: IsoDate | null;
}

/** Money someone owes the shop: an unpaid order with a due date (an invoice), or a dropped checkout. */
export interface MonthOwed {
  orderId: string;
  customerName: string;
  amountCents: Cents;
  dueOn: IsoDate | null;
  /** The customer agreed to be contacted, so tmrw may remind them. */
  canRemind: boolean;
}

export interface MustPayItem {
  id: string;
  date: IsoDate;
  name: string;
  amountCents: Cents;
  /** How much will be ready on the day. Equal to the amount once paid. */
  readyCents: Cents;
  autoDebit: boolean;
  paid: boolean;
  /** The forecast found it from history; the owner hasn't confirmed it yet. */
  found: boolean;
}

export interface WantToDoItem extends MonthGoal {
  /** Buying it on its date keeps every day at or above the minimum. */
  fits: boolean;
  /** One plain sentence: why it fits, or what it would leave short. */
  note: string;
}

export type MonthChip =
  | { kind: "in"; label: string; amountCents: Cents }
  | { kind: "out"; label: string; amountCents: Cents; autoDebit: boolean; paid: boolean }
  | { kind: "owed"; label: string; amountCents: Cents }
  | { kind: "goal"; label: string; amountCents: Cents; fits: boolean };

export interface MonthDay {
  date: IsoDate;
  dayOfMonth: number;
  weekday: string;
  isToday: boolean;
  isPast: boolean;
  /** Balance at the end of the day: forecast from today on, null before today. */
  closingCents: Cents | null;
  state: DayState | null;
  shortByCents: Cents;
  /** Sales: what arrived (past days) or what's expected (today on), after PayPal's fee. */
  salesCents: Cents;
  chips: MonthChip[];
}

export interface TodayPanel {
  date: IsoDate;
  /** How much can go out today without any day ahead ending below the minimum. */
  safeToSpendCents: Cents;
  safeNote: string;
  /** The day ahead with the most to pay, and how ready it is. */
  biggestDay: { date: IsoDate; dueCents: Cents; readyCents: Cents; names: string[] } | null;
  owed: MonthOwed[];
  goal: { title: string; savedCents: Cents; amountCents: Cents; note: string } | null;
}

export interface MonthPlan {
  /** "2026-11". */
  month: string;
  /** "November". */
  monthName: string;
  today: IsoDate;
  /** One sentence for the top of the page: "The month adds up. The 12th doesn't." */
  verdict: string;
  focusLine: string | null;
  minimumBalanceCents: Cents;
  days: MonthDay[];
  mustPay: MustPayItem[];
  comingIn: { salesCents: Cents; owed: MonthOwed[]; totalCents: Cents };
  wantToDo: WantToDoItem[];
  totals: { mustPayCents: Cents; comingInCents: Cents; leftForPlansCents: Cents };
  firstShort: { date: IsoDate; amountCents: Cents; reason: string } | null;
  todayPanel: TodayPanel;
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "12th", "1st", "22nd". */
export function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
}

function daysInMonth(month: string): IsoDate[] {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return Array.from({ length: count }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`);
}

/** Payee kinds that are the shop's own bills and suppliers (the owner's transfers to their bank are not must-pays). */
const isShopPayment = (kind: string) => kind !== "OWNER_TRANSFER";

export function monthPlanFrom(args: {
  rows: StoreRows;
  input: ForecastInput;
  goals: readonly MonthGoal[];
  owed: readonly MonthOwed[];
  focusLine: string | null;
  /** "2026-11"; defaults to today's month. */
  month?: string;
}): MonthPlan {
  const { rows, input, goals, owed, focusLine } = args;
  const today = input.today;
  const month = args.month ?? today.slice(0, 7);
  const dates = daysInMonth(month);
  const run = runForecast(input, MAX_HORIZON_DAYS);
  const forecastDay = new Map(run.days.map((d) => [d.date, d]));
  const payees = new Map(rows.payees.map((p) => [p.id, p]));

  // Past days of the month: what already moved.
  const pastSales = new Map<IsoDate, Cents>();
  const pastOuts: MustPayItem[] = [];
  for (const e of rows.ledger) {
    if (!e.occurredOn.startsWith(month) || e.occurredOn >= today) continue;
    if (e.direction === "IN" && e.category === "SALE") pastSales.set(e.occurredOn, (pastSales.get(e.occurredOn) ?? 0) + e.amountCents);
    const payee = e.payeeId ? payees.get(e.payeeId) : undefined;
    if (e.direction === "OUT" && payee && isShopPayment(payee.kind)) {
      pastOuts.push({ id: e.id, date: e.occurredOn, name: payee.name, amountCents: e.amountCents, readyCents: e.amountCents, autoDebit: payee.autoDebit ?? false, paid: true, found: false });
    }
  }

  // Today on: the forecast's payments, each with how much is ready.
  const futureOuts: MustPayItem[] = run.days
    .filter((d) => d.date.startsWith(month))
    .flatMap((d) => d.dues)
    .filter((d) => isShopPayment(d.kind) && !d.optional)
    .map((d) => ({
      id: d.id,
      date: d.dueOn,
      name: d.payeeName,
      amountCents: d.amountCents,
      readyCents: d.status === "PAID" ? d.amountCents : d.readyCents,
      autoDebit: d.autoDebit ?? false,
      paid: d.status === "PAID",
      found: payees.get(d.payeeId)?.status === "DETECTED",
    }));
  const mustPay = [...pastOuts, ...futureOuts].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : b.amountCents - a.amountCents));

  const wantToDo: WantToDoItem[] = goals.map((g) => {
    if (!g.wantedOn || g.wantedOn < today || daysBetween(today, g.wantedOn) >= MAX_HORIZON_DAYS) {
      return { ...g, fits: false, note: "Pick a date in the next month and tmrw will check it fits." };
    }
    const check = affordability(input, g.amountCents, g.wantedOn);
    if (check.affordable) return { ...g, fits: true, note: `Fits on ${formatDay(g.wantedOn)}. Every must-pay stays covered.` };
    const short = check.shortfallAfter!;
    return { ...g, fits: false, note: `Not yet: buying it on ${formatDay(g.wantedOn)} would leave ${formatDay(short.date)} ${formatShortfall(short.amountCents)} short.` };
  });

  const owedThisMonth = owed.filter((o) => !o.dueOn || o.dueOn.startsWith(month));
  const days: MonthDay[] = dates.map((date) => {
    const f = forecastDay.get(date);
    const isPast = date < today;
    const salesCents = isPast ? (pastSales.get(date) ?? 0) : (f?.expectedInCents ?? 0);
    const chips: MonthChip[] = [];
    if (salesCents > 0) chips.push({ kind: "in", label: "Sales", amountCents: salesCents });
    for (const p of mustPay.filter((m) => m.date === date)) chips.push({ kind: "out", label: p.name, amountCents: p.amountCents, autoDebit: p.autoDebit, paid: p.paid });
    for (const o of owedThisMonth.filter((x) => x.dueOn === date)) chips.push({ kind: "owed", label: `${o.customerName} owes`, amountCents: o.amountCents });
    for (const g of wantToDo.filter((x) => x.wantedOn === date)) chips.push({ kind: "goal", label: g.title, amountCents: g.amountCents, fits: g.fits });
    return {
      date,
      dayOfMonth: dayOfMonth(date),
      weekday: weekdayShort(date),
      isToday: date === today,
      isPast,
      closingCents: f ? f.closingCents : null,
      state: f ? f.state : null,
      shortByCents: f ? f.shortByCents : 0,
      salesCents,
      chips,
    };
  });

  const salesCents = days.reduce((s, d) => s + d.salesCents, 0);
  const owedCents = owedThisMonth.reduce((s, o) => s + o.amountCents, 0);
  const mustPayCents = mustPay.reduce((s, m) => s + m.amountCents, 0);
  const comingInCents = salesCents + owedCents;
  const firstShortDay = days.find((d) => d.state === "short");
  const firstShort = firstShortDay
    ? { date: firstShortDay.date, amountCents: firstShortDay.shortByCents, reason: run.firstShortfall?.date === firstShortDay.date ? run.firstShortfall.reason : "payments leave that day" }
    : null;

  const addsUp = comingInCents >= mustPayCents;
  const verdict = addsUp
    ? firstShort
      ? `The month adds up. The ${ordinal(dayOfMonth(firstShort.date))} doesn't.`
      : "The month adds up, and every day is covered."
    : `The month doesn't add up: must-pays are ${formatDollars(mustPayCents - comingInCents)} more than what comes in.`;

  return {
    month,
    monthName: MONTH_NAMES[Number(month.slice(5, 7)) - 1]!,
    today,
    verdict,
    focusLine,
    minimumBalanceCents: input.minimumBalanceCents,
    days,
    mustPay,
    comingIn: { salesCents, owed: owedThisMonth, totalCents: comingInCents },
    wantToDo,
    totals: { mustPayCents, comingInCents, leftForPlansCents: comingInCents - mustPayCents },
    firstShort,
    todayPanel: todayPanelFrom(run.days, input.minimumBalanceCents, today, owed, wantToDo),
  };
}

function todayPanelFrom(
  days: ReturnType<typeof runForecast>["days"],
  minimum: Cents,
  today: IsoDate,
  owed: readonly MonthOwed[],
  wantToDo: readonly WantToDoItem[],
): TodayPanel {
  // Safe to spend: the smallest room above the minimum on any day ahead (a day already short leaves $0).
  const room = Math.min(...days.map((d) => d.closingCents - minimum));
  const tightest = days.reduce((low, d) => (d.closingCents < low.closingCents ? d : low), days[0]!);
  const short = days.find((d) => d.state === "short");
  const safeToSpendCents = Math.max(0, Math.floor(room / 100) * 100);
  const safeNote = short
    ? `The ${ordinal(dayOfMonth(short.date))} is ${formatShortfall(short.shortByCents)} short.`
    : `${formatDay(tightest.date)} is your tightest day, with ${formatDollars(tightest.closingCents - minimum)} above your minimum.`;

  const owedOut = (d: (typeof days)[number]) => d.dues.filter((x) => x.status !== "PAID" && isShopPayment(x.kind));
  const biggest = days
    .filter((d) => d.date > today || owedOut(d).length > 0)
    .reduce<(typeof days)[number] | null>((best, d) => {
      const total = owedOut(d).reduce((s, x) => s + x.amountCents, 0);
      const bestTotal = best ? owedOut(best).reduce((s, x) => s + x.amountCents, 0) : 0;
      return total > bestTotal ? d : best;
    }, null);
  const biggestDues = biggest ? owedOut(biggest) : [];

  const goal = wantToDo.find((g) => g.wantedOn) ?? wantToDo[0] ?? null;
  return {
    date: today,
    safeToSpendCents,
    safeNote,
    biggestDay: biggest
      ? {
          date: biggest.date,
          dueCents: biggestDues.reduce((s, x) => s + x.amountCents, 0),
          readyCents: biggestDues.reduce((s, x) => s + x.readyCents, 0),
          names: biggestDues.map((x) => x.payeeName),
        }
      : null,
    owed: [...owed].sort((a, b) => (a.dueOn ?? "9999").localeCompare(b.dueOn ?? "9999")),
    goal: goal
      ? {
          title: goal.title,
          savedCents: goal.savedCents,
          amountCents: goal.amountCents,
          note: goal.fits && goal.wantedOn ? `On track for the ${ordinal(dayOfMonth(goal.wantedOn))}` : goal.wantedOn ? `Not on track for the ${ordinal(dayOfMonth(goal.wantedOn))} yet` : "No date yet",
        }
      : null,
  };
}

