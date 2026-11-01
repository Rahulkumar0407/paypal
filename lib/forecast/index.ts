/**
 * lib/forecast: payment detection, the 14-day forecast, fix-the-gap maths. Owner: Person 3.
 * Foundation stubs by Person 1: right signatures, FAKE data from mocks/. Replace each TODO.
 * Rules: all money in integer cents; "today" only from lib/shared/clock; no AI in here.
 */
import type {
  ActionProposal,
  AffordabilityCheck,
  Cents,
  Due,
  FixOption,
  Forecast,
  IsoDate,
  RecurringPayee,
  StoreId,
} from "@/types";
import { mockAffordability, mockFixes } from "@/mocks/fixes";
import { mockDues, mockForecast, mockRecurringPayees } from "@/mocks/forecast";

export { buildHeadline } from "./headline";

/** The 14-day forecast starting today, with the first shortfall and a confidence level. */
export async function getForecast(storeId: StoreId): Promise<Forecast> {
  // TODO(Person 3): weekday-average sales from history minus known dues (P3-1).
  return { ...mockForecast, storeId };
}

/** Known money out from today onward, each with how much is ready. */
export async function getDues(storeId: StoreId): Promise<Due[]> {
  // TODO(Person 3): read Due rows and fill readyCents from the forecast.
  return mockDues.map((d) => ({ ...d, storeId }));
}

/** Recurring payees found from payment history (similar amount, regular interval). */
export async function getRecurringPayees(storeId: StoreId): Promise<RecurringPayee[]> {
  // TODO(Person 3): deterministic detection from LedgerEntry history (P3-1).
  return mockRecurringPayees.map((p) => ({ ...p, storeId }));
}

/** The owner confirms a detected payee once ("Yes, that's right"). */
export async function confirmRecurringPayee(storeId: StoreId, payeeId: string): Promise<RecurringPayee> {
  // TODO(Person 3): set Payee.status = CONFIRMED.
  const payee = mockRecurringPayees.find((p) => p.id === payeeId) ?? mockRecurringPayees[0]!;
  return { ...payee, storeId, status: "CONFIRMED" };
}

/** Up to three ways to close the first shortfall. */
export async function getFixOptions(storeId: StoreId): Promise<FixOption[]> {
  // TODO(Person 3): set-aside within the 30% cap, move a payment, simulated gap loan (P3-2).
  void storeId;
  return mockFixes;
}

/** The forecast as it would be if this action ran. The Guard uses it for rule 6. */
export async function simulateAction(storeId: StoreId, proposal: ActionProposal): Promise<Forecast> {
  // TODO(Person 3): apply the proposal to a copy of the inputs and re-run the forecast.
  void proposal;
  return getForecast(storeId);
}

/** "Can I afford $X on <date>?" Calculated by code; Ask chat calls this as a tool. */
export async function canAfford(storeId: StoreId, amountCents: Cents, date: IsoDate): Promise<AffordabilityCheck> {
  // TODO(Person 3): run the forecast with an extra $amount out on `date`.
  void storeId;
  return { ...mockAffordability, amountCents, date };
}
