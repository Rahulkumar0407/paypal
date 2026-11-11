/**
 * lib/forecast: regular payment detection, the 30-day forecast, "can I afford", and what-ifs for the Guard.
 * Deterministic code only: no AI. All money in integer cents; "today" only from lib/shared/clock.
 * The maths is pure (engine.ts, detect.ts); this file reads the store's rows and writes the owner's answers.
 */
import type { ActionProposal, AffordabilityCheck, Cents, Due, FixOption, Forecast, IsoDate, RecurringPayee, StoreId } from "@/types";
import { randomUUID } from "node:crypto";
import { nowIso, today } from "@/lib/shared/clock";
import { addDays, formatDay } from "@/lib/shared/dates";
import { getDb } from "@/lib/shared/db";
import { nextProposalKey } from "@/lib/shared/keys";
import { formatDollars } from "@/lib/shared/money";
import { fixOptionsFrom } from "./fixes";
import { patternEvidenceFromRows, recentPaymentsFromRows, type PatternEvidence, type RecentPayment } from "./history";
import { datesBetween } from "./detect";
import {
  adjustmentsFor,
  affordability,
  duesFrom,
  forecastFrom,
  inputFromRows,
  MAX_HORIZON_DAYS,
  projectedDueId,
  recurringPayeesFromRows,
  withAdjustments,
} from "./engine";
import { demoScenarioRows, loadStoreRows, readStoreRows, type DemoScenario } from "./load";
import { monthPlanFrom, type MonthGoal, type MonthOwed, type MonthPlan } from "./month";
import { buildDemoSeed } from "@/lib/demo";
import { isDatabaseConfigured } from "@/lib/shared/db";

export { buildHeadline } from "./headline";
export { yourFix, yourForecast, warningZoneFor, type YourFix, type YourNumbers, type YourPayment, type YourForecast } from "./yours";
export type { DemoScenario } from "./load";
export { ordinal, type MonthChip, type MonthDay, type MonthGoal, type MonthOwed, type MonthPlan, type MustPayItem, type TodayPanel, type WantToDoItem } from "./month";
export type { PatternEvidence, RecentPayment } from "./history";

async function inputFor(storeId: StoreId) {
  const day = today();
  return inputFromRows(await loadStoreRows(storeId, day), storeId, day);
}

/** The 30-day forecast starting today, with the first shortfall and a confidence level. */
export async function getForecast(storeId: StoreId): Promise<Forecast> {
  return forecastFrom(await inputFor(storeId));
}

/** Known money out from today onward (35 days), each with how much will be ready on its day. */
export async function getDues(storeId: StoreId): Promise<Due[]> {
  return duesFrom(await inputFor(storeId));
}

/** Regular payees found from payment history, plus the ones the owner has confirmed. */
export async function getRecurringPayees(storeId: StoreId): Promise<RecurringPayee[]> {
  const day = today();
  return recurringPayeesFromRows(await loadStoreRows(storeId, day), storeId, day);
}

/**
 * The owner confirms a payee we found ("Yes, that's regular"). Its next payments become dues, at the same dates
 * and amounts the forecast already counted, so the numbers don't jump; they're just no longer a guess.
 */
export async function confirmRecurringPayee(storeId: StoreId, payeeId: string): Promise<RecurringPayee> {
  const day = today();
  const payee = (await getRecurringPayees(storeId)).find((p) => p.id === payeeId);
  if (!payee) throw new Error("That isn't a regular payment we found.");
  if (payee.status === "CONFIRMED") return payee;
  if (payee.status === "DISMISSED" || !payee.nextDueOn) throw new Error("That payment was marked as not regular.");

  const db = getDb();
  const existing = await db.due.findMany({ where: { storeId, payeeId }, select: { dueOn: true, movedFromOn: true } });
  const taken = new Set(existing.flatMap((d) => [d.dueOn, d.movedFromOn ?? d.dueOn]));
  const dates = datesBetween(payee.cadence, payee.nextDueOn, addDays(day, MAX_HORIZON_DAYS - 1)).filter((d) => !taken.has(d));
  const c = payee.cadence;
  await db.$transaction([
    db.payee.updateMany({
      where: { id: payeeId, storeId },
      data: {
        status: "CONFIRMED",
        typicalAmountCents: payee.typicalAmountCents,
        cadence: c.every === "DAYS" ? "EVERY_N_DAYS" : c.every === "WEEKS" ? "EVERY_N_WEEKS" : "MONTHLY",
        intervalDays: c.every === "DAYS" ? c.days : null,
        intervalWeeks: c.every === "WEEKS" ? c.weeks : null,
        weekday: c.every === "WEEKS" ? c.weekday : null,
        dayOfMonth: c.every === "MONTH" ? c.dayOfMonth : null,
      },
    }),
    db.due.createMany({
      data: dates.map((dueOn) => ({ id: projectedDueId(payeeId, dueOn), storeId, payeeId, dueOn, amountCents: payee.typicalAmountCents, status: "SCHEDULED" as const })),
      skipDuplicates: true,
    }),
  ]);
  // Read again past the request cache, which still holds the rows from before the write.
  const confirmed = recurringPayeesFromRows(await readStoreRows(storeId, day), storeId, day).find((p) => p.id === payeeId);
  return confirmed ?? { ...payee, status: "CONFIRMED" };
}

/** The owner says a payee we found isn't regular. Its payments leave the forecast. */
export async function dismissRecurringPayee(storeId: StoreId, payeeId: string): Promise<void> {
  const { count } = await getDb().payee.updateMany({ where: { id: payeeId, storeId, status: "DETECTED" }, data: { status: "DISMISSED" } });
  if (count === 0) throw new Error("That isn't a payment waiting for your answer.");
}

/** Up to three ways to close the first shortfall. */
export async function getFixOptions(storeId: StoreId): Promise<FixOption[]> {
  return fixOptionsFrom(await inputFor(storeId));
}

/**
 * The owner picked a fix: the matching Guard proposal, rebuilt from today's numbers on the server (never from the
 * browser). Null when that fix isn't on offer any more. The Guard decides what happens to it.
 */
export async function proposeFix(storeId: StoreId, fixId: string): Promise<ActionProposal | null> {
  const input = await inputFor(storeId);
  const fix = fixOptionsFrom(input).find((f) => f.id === fixId);
  if (!fix) return null;
  const base = async (type: ActionProposal["type"], target: ActionProposal["target"]) => {
    const { idempotencyKey, sequence } = await nextProposalKey(storeId, type, target.id);
    return {
      id: `prop_${randomUUID()}`,
      storeId,
      target,
      amountCents: fix.amountCents,
      proposedBy: { kind: "OWNER" } as const,
      idempotencyKey,
      sequence,
      draftText: null,
      createdAt: nowIso(),
      demoDate: input.today,
    };
  };
  switch (fix.kind) {
    case "SET_ASIDE": {
      const daily = fix.dailyAmountCents ?? 0;
      const target = { kind: "STORE" as const, id: storeId, label: `${formatDollars(daily)} a day until ${formatDay(fix.forDate)}` };
      return {
        ...(await base("SET_ASIDE", target)),
        type: "SET_ASIDE",
        params: { dailyAmountCents: daily, startOn: input.today, endOn: addDays(fix.forDate, -1), forDate: fix.forDate },
      };
    }
    case "MOVE_PAYMENT": {
      const due = input.outs.find((d) => d.id === fix.dueId);
      if (!due || !fix.moveToOn) return null;
      const target = { kind: "DUE" as const, id: due.id, label: `${due.payeeName}, due ${formatDay(due.dueOn)}` };
      return { ...(await base("MOVE_PAYMENT", target)), type: "MOVE_PAYMENT", params: { dueId: due.id, fromOn: due.dueOn, toOn: fix.moveToOn } };
    }
    case "GAP_LOAN": {
      const target = { kind: "STORE" as const, id: storeId, label: `${formatDollars(fix.amountCents)}, for ${formatDay(fix.forDate)}` };
      return {
        ...(await base("GAP_LOAN", target)),
        type: "GAP_LOAN",
        params: { amountCents: fix.amountCents, feeCents: fix.loanFeeCents ?? 0, repayOn: fix.repayOn ?? fix.forDate },
      };
    }
  }
}

/** The forecast as it would be if this action ran. The Guard uses it for rule 6. Throws if the action names a payment that isn't there. */
export async function simulateAction(storeId: StoreId, proposal: ActionProposal): Promise<Forecast> {
  const input = await inputFor(storeId);
  return forecastFrom(withAdjustments(input, adjustmentsFor(proposal, input.today)));
}

/** "Can I afford $X on <date>?" Calculated by code; Ask chat calls this as a tool. Throws RangeError for a past date or one more than 35 days out. */
export async function canAfford(storeId: StoreId, amountCents: Cents, date: IsoDate): Promise<AffordabilityCheck> {
  return affordability(await inputFor(storeId), amountCents, date);
}

/**
 * The demo store's real forecast at a point in the story, worked out in memory from the seed (no database).
 * The tests check the story's numbers with it.
 */
export function previewDemoForecast(scenario: DemoScenario = {}): Forecast {
  const day = today();
  return forecastFrom(inputFromRows(demoScenarioRows("st_preview", day, scenario), "st_preview", day));
}

/** Money that already moved in the last `days` days: payments out, and each day's sales after PayPal's fee. Newest first. */
export async function listRecentPayments(storeId: StoreId, days = 30): Promise<RecentPayment[]> {
  const day = today();
  return recentPaymentsFromRows(await loadStoreRows(storeId, day), day, days);
}

/** What each found pattern rests on (count, dates, spread), for the plain-words explanation under it. */
export async function getPatternEvidence(storeId: StoreId): Promise<PatternEvidence[]> {
  const day = today();
  return patternEvidenceFromRows(await loadStoreRows(storeId, day), day);
}

/**
 * The demo store at a point in the story, everything worked out in memory from the seed (no database): the forecast,
 * dues, found payees, recent payments, and "can I afford". The tests use it.
 */
export function previewDemoStore(scenario: DemoScenario = {}) {
  const day = today();
  const rows = demoScenarioRows("st_preview", day, scenario);
  const input = inputFromRows(rows, "st_preview", day);
  return {
    today: day,
    forecast: forecastFrom(input),
    dues: duesFrom(input),
    payees: recurringPayeesFromRows(rows, "st_preview", day),
    evidence: patternEvidenceFromRows(rows, day),
    recentPayments: recentPaymentsFromRows(rows, day),
    canAfford: (amountCents: Cents, date: IsoDate) => affordability(input, amountCents, date),
  };
}

/**
 * The month page and the Today panel for this store: Must pay, Coming in, Want to do and the focus line, all from the
 * forecast's own numbers. Goals and money owed come from the store's rows. Without a database, the demo seed.
 */
export async function getMonthPlan(storeId: StoreId, month?: string): Promise<MonthPlan> {
  const day = today();
  const rows = await loadStoreRows(storeId, day);
  const input = inputFromRows(rows, storeId, day);
  if (!isDatabaseConfigured()) return monthPlanFrom({ rows, input, ...seedExtras(storeId, day, false), month });
  const db = getDb();
  const [store, goals, unpaid] = await Promise.all([
    db.store.findUnique({ where: { id: storeId }, select: { focusLine: true } }),
    db.goal.findMany({ where: { storeId, status: "PLANNED" }, orderBy: [{ wantedOn: "asc" }, { createdAt: "asc" }] }),
    db.order.findMany({
      where: { storeId, status: { in: ["ABANDONED", "FAILED"] }, dueOn: { not: null } },
      select: { id: true, totalCents: true, dueOn: true, customer: { select: { name: true, contactConsent: true } } },
      orderBy: { dueOn: "asc" },
    }),
  ]);
  return monthPlanFrom({
    rows,
    input,
    focusLine: store?.focusLine ?? null,
    goals: goals.map((g) => ({ id: g.id, title: g.title, amountCents: g.amountCents, savedCents: g.savedCents, wantedOn: g.wantedOn })),
    owed: unpaid.map((o) => ({ orderId: o.id, customerName: o.customer.name, amountCents: o.totalCents, dueOn: o.dueOn, canRemind: o.customer.contactConsent })),
    month,
  });
}

/** The demo store's month page at a point in the story, in memory from the seed (no database). The tests use it. */
export function previewDemoMonth(scenario: DemoScenario = {}): MonthPlan {
  const day = today();
  const rows = demoScenarioRows("st_preview", day, scenario);
  const input = inputFromRows(rows, "st_preview", day);
  return monthPlanFrom({ rows, input, ...seedExtras("st_preview", day, scenario.recovered ?? false) });
}

function seedExtras(storeId: StoreId, day: IsoDate, recovered: boolean): { goals: MonthGoal[]; owed: MonthOwed[]; focusLine: string | null } {
  const seed = buildDemoSeed(storeId, day, "run_preview");
  const customers = new Map(seed.customers.map((c) => [c.id, c]));
  return {
    focusLine: seed.store.focusLine ?? null,
    goals: seed.goals.map((g) => ({ id: g.id, title: g.title, amountCents: g.amountCents, savedCents: g.savedCents ?? 0, wantedOn: g.wantedOn ?? null })),
    owed: seed.orders
      .filter((o) => (o.status === "ABANDONED" || o.status === "FAILED") && o.dueOn && !recovered)
      .map((o) => ({ orderId: o.id, customerName: customers.get(o.customerId)?.name ?? "A customer", amountCents: o.totalCents, dueOn: o.dueOn ?? null, canRemind: customers.get(o.customerId)?.contactConsent ?? false })),
  };
}
