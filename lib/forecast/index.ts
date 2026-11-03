/**
 * lib/forecast: regular payment detection, the 14-day forecast, "can I afford", and what-ifs for the Guard.
 * Deterministic code only: no AI. All money in integer cents; "today" only from lib/shared/clock.
 * The maths is pure (engine.ts, detect.ts); this file reads the store's rows and writes the owner's answers.
 */
import type { ActionProposal, AffordabilityCheck, Cents, Due, FixOption, Forecast, IsoDate, RecurringPayee, StoreId } from "@/types";
import { mockFixes } from "@/mocks/fixes";
import { today } from "@/lib/shared/clock";
import { addDays } from "@/lib/shared/dates";
import { getDb } from "@/lib/shared/db";
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

export { buildHeadline } from "./headline";
export type { DemoScenario } from "./load";

async function inputFor(storeId: StoreId) {
  const day = today();
  return inputFromRows(await loadStoreRows(storeId, day), storeId, day);
}

/** The 14-day forecast starting today, with the first shortfall and a confidence level. */
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
  // TODO(Person 1, P1-8): set-aside within the 30% cap, move a payment, simulated gap loan, from the real forecast.
  // Until then the sample fixes are used, with "move a payment" pointed at the real supplier payment on that day.
  const dues = await getDues(storeId);
  return mockFixes.map((fix) =>
    fix.kind === "MOVE_PAYMENT" ? { ...fix, dueId: dues.find((d) => d.dueOn === fix.forDate && d.kind === "SUPPLIER")?.id ?? fix.dueId } : fix,
  );
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
 * /design shows it; the tests check the story's numbers with it.
 */
export function previewDemoForecast(scenario: DemoScenario = {}): Forecast {
  const day = today();
  return forecastFrom(inputFromRows(demoScenarioRows("st_preview", day, scenario), "st_preview", day));
}
