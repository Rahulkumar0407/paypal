import type { Cents, Due, Forecast, ForecastDay, IsoDate, PayeeKind, RecurringPayee, Shortfall } from "@/types";
import { eachDay, weekdayIndex } from "@/lib/shared/dates";

/**
 * FAKE forecast data for the stubs that still need one (fix-the-gap options until P1-8, Ask until P1-10)
 * and their tests. The real forecast is lib/forecast; /design shows that one. Built from a few constants
 * so the demo story numbers hold, the same as the real forecast's:
 * - today Thu 5 Nov 2026, minimum balance $100, "tight" within $50 of it;
 * - Thu 12 Nov: Volta's $300 order and $1,200 rent land together, leaving $10, which is $90 short;
 * - after the $72 recovered payment ($69 after PayPal's fee) and a set-aside of $11 a day,
 *   Thu 12 Nov closes at $156, which is covered.
 */

export const MOCK_STORE_ID = "st_mock";
export const MOCK_TODAY: IsoDate = "2026-11-05";
export const MOCK_MINIMUM_BALANCE: Cents = 10_000;
export const MOCK_TIGHT_MARGIN: Cents = 5_000;
const OPENING_BALANCE: Cents = 159_000;
/** Expected sales after fees, by weekday (0 = Sunday). */
const EXPECTED_BY_WEEKDAY: readonly Cents[] = [19_000, 17_000, 17_500, 18_500, 20_500, 23_000, 26_000];
/** Order in which money on a day is allocated to dues: bills first, the supplier, then the owner's transfer. */
const READY_ORDER: Record<PayeeKind, number> = { BILL: 0, LOAN: 1, SUPPLIER: 2, OWNER_TRANSFER: 3 };

const due = (key: string, payeeKey: string, payeeName: string, label: string, kind: PayeeKind, dueOn: IsoDate, amountCents: Cents): Due => ({
  id: `due_${key}`,
  storeId: MOCK_STORE_ID,
  payeeId: `payee_${payeeKey}`,
  payeeName,
  label,
  kind,
  dueOn,
  amountCents,
  readyCents: amountCents,
  status: "SCHEDULED",
  movedFromOn: null,
  simulated: false,
});

export const mockDuesSchedule: readonly Due[] = [
  due("owner_1109", "owner", "Transfer to your bank", "your transfer to the bank", "OWNER_TRANSFER", "2026-11-09", 170_000),
  due("volta_1112", "volta", "Volta Audio Parts", "the supplier order", "SUPPLIER", "2026-11-12", 30_000),
  due("rent_1112", "rent", "Rent", "rent", "BILL", "2026-11-12", 120_000),
  due("software_1113", "software", "Store software", "the store software bill", "BILL", "2026-11-13", 9_900),
  due("volta_1122", "volta", "Volta Audio Parts", "the supplier order", "SUPPLIER", "2026-11-22", 30_000),
  due("owner_1123", "owner", "Transfer to your bank", "your transfer to the bank", "OWNER_TRANSFER", "2026-11-23", 170_000),
  due("loan_1125", "loan", "Equipment loan", "the loan repayment", "LOAN", "2026-11-25", 15_000),
  due("shipping_1130", "shipping", "Shipping supplies", "the shipping supplies bill", "BILL", "2026-11-30", 24_000),
  due("internet_1203", "internet", "Internet", "the internet bill", "BILL", "2026-12-03", 6_000),
];

interface Adjustments {
  /** Extra money in on a date (e.g. a recovered payment, net of fee). */
  extraIn?: Partial<Record<IsoDate, Cents>>;
  /** Change to a due's amount (e.g. a set-aside keeps money back from the owner's transfer). */
  dueDelta?: Partial<Record<string, Cents>>;
  /** Move a due to another date. */
  moveDue?: Partial<Record<string, IsoDate>>;
}

function stateFor(closing: Cents): ForecastDay["state"] {
  if (closing < MOCK_MINIMUM_BALANCE) return "short";
  if (closing < MOCK_MINIMUM_BALANCE + MOCK_TIGHT_MARGIN) return "tight";
  return "covered";
}

function reasonFor(dues: Due[]): string {
  const labels = [...dues]
    .sort((a, b) => ["SUPPLIER", "BILL", "LOAN", "OWNER_TRANSFER"].indexOf(a.kind) - ["SUPPLIER", "BILL", "LOAN", "OWNER_TRANSFER"].indexOf(b.kind))
    .map((d) => d.label);
  if (labels.length === 0) return "sales that day won't cover what's already gone out";
  if (labels.length === 1) return `${labels[0]} is due`;
  return `${labels.slice(0, -1).join(", ")} and ${labels.at(-1)} land the same day`;
}

export function buildMockForecast(adjust: Adjustments = {}): Forecast {
  const schedule = mockDuesSchedule.map((d) => {
    const movedTo = adjust.moveDue?.[d.id];
    return {
      ...d,
      amountCents: d.amountCents + (adjust.dueDelta?.[d.id] ?? 0),
      dueOn: movedTo ?? d.dueOn,
      movedFromOn: movedTo ? d.dueOn : null,
      status: movedTo ? ("MOVED" as const) : d.status,
      simulated: Boolean(movedTo),
    };
  });

  let opening = OPENING_BALANCE;
  const days: ForecastDay[] = eachDay(MOCK_TODAY, 14).map((date) => {
    const expectedIn = EXPECTED_BY_WEEKDAY[weekdayIndex(date)]! + (adjust.extraIn?.[date] ?? 0);
    const dues = schedule.filter((d) => d.dueOn === date).sort((a, b) => READY_ORDER[a.kind] - READY_ORDER[b.kind]);
    let available = Math.max(0, opening + expectedIn - MOCK_MINIMUM_BALANCE);
    const withReady = dues.map((d) => {
      const ready = Math.min(d.amountCents, available);
      available -= ready;
      return { ...d, readyCents: ready };
    });
    const knownOut = dues.reduce((sum, d) => sum + d.amountCents, 0);
    const closing = opening + expectedIn - knownOut;
    const state = stateFor(closing);
    const day: ForecastDay = {
      date,
      isToday: date === MOCK_TODAY,
      openingCents: opening,
      expectedInCents: expectedIn,
      heldInCents: 0,
      knownOutCents: knownOut,
      closingCents: closing,
      state,
      shortByCents: state === "short" ? MOCK_MINIMUM_BALANCE - closing : 0,
      dues: withReady,
    };
    opening = closing;
    return day;
  });

  const firstShort = days.find((d) => d.state === "short");
  const firstShortfall: Shortfall | null = firstShort
    ? { date: firstShort.date, amountCents: firstShort.shortByCents, dueIds: firstShort.dues.map((d) => d.id), reason: reasonFor(firstShort.dues) }
    : null;

  return {
    storeId: MOCK_STORE_ID,
    asOf: MOCK_TODAY,
    days,
    firstShortfall,
    confidence: "high",
    confidenceReason: "Based on 13 weeks of sales with a steady weekday pattern.",
    minimumBalanceCents: MOCK_MINIMUM_BALANCE,
    tightMarginCents: MOCK_TIGHT_MARGIN,
  };
}

/** Story step 1: $90 short on Thu 12 Nov. */
export const mockForecast: Forecast = buildMockForecast();

/** Story step 3: the $72 order is paid today; $69.00 arrives after PayPal's fee. */
export const MOCK_RECOVERED_NET: Cents = 6_900;
export const mockForecastAfterRecovery: Forecast = buildMockForecast({ extraIn: { [MOCK_TODAY]: MOCK_RECOVERED_NET } });

/** Story step 5: set aside $11 a day for 7 days, kept back from Monday's transfer to the bank. */
export const MOCK_SET_ASIDE_DAILY: Cents = 1_100;
export const mockForecastFixed: Forecast = buildMockForecast({
  extraIn: { [MOCK_TODAY]: MOCK_RECOVERED_NET },
  dueDelta: { due_owner_1109: -MOCK_SET_ASIDE_DAILY * 7 },
});

/** Every scheduled due with its readiness from the initial forecast (later ones fully ready). */
export const mockDues: Due[] = mockDuesSchedule.map(
  (d) => mockForecast.days.flatMap((day) => day.dues).find((x) => x.id === d.id) ?? d,
);

export const mockRecurringPayees: RecurringPayee[] = [
  {
    id: "payee_volta",
    storeId: MOCK_STORE_ID,
    name: "Volta Audio Parts",
    kind: "SUPPLIER",
    typicalAmountCents: 30_000,
    cadence: { every: "DAYS", days: 10 },
    status: "DETECTED",
    summary: "We think Volta Audio Parts is paid about $300 every 10 days.",
    nextDueOn: "2026-11-12",
  },
  {
    id: "payee_owner",
    storeId: MOCK_STORE_ID,
    name: "Transfer to your bank",
    kind: "OWNER_TRANSFER",
    typicalAmountCents: 170_000,
    cadence: { every: "WEEKS", weeks: 2, weekday: 1 },
    status: "DETECTED",
    summary: "We think you move about $1,700 to your bank every other Monday.",
    nextDueOn: "2026-11-09",
  },
  {
    id: "payee_rent",
    storeId: MOCK_STORE_ID,
    name: "Rent",
    kind: "BILL",
    typicalAmountCents: 120_000,
    cadence: { every: "MONTH", dayOfMonth: 12 },
    status: "CONFIRMED",
    summary: "Rent is $1,200 on the 12th of each month.",
    nextDueOn: "2026-11-12",
  },
  {
    id: "payee_software",
    storeId: MOCK_STORE_ID,
    name: "Store software",
    kind: "BILL",
    typicalAmountCents: 9_900,
    cadence: { every: "MONTH", dayOfMonth: 13 },
    status: "CONFIRMED",
    summary: "Store software is $99 on the 13th of each month.",
    nextDueOn: "2026-11-13",
  },
  {
    id: "payee_loan",
    storeId: MOCK_STORE_ID,
    name: "Equipment loan",
    kind: "LOAN",
    typicalAmountCents: 15_000,
    cadence: { every: "MONTH", dayOfMonth: 25 },
    status: "CONFIRMED",
    summary: "The equipment loan takes $150 on the 25th of each month.",
    nextDueOn: "2026-11-25",
  },
  {
    id: "payee_internet",
    storeId: MOCK_STORE_ID,
    name: "Internet",
    kind: "BILL",
    typicalAmountCents: 6_000,
    cadence: { every: "MONTH", dayOfMonth: 3 },
    status: "CONFIRMED",
    summary: "Internet is $60 on the 3rd of each month.",
    nextDueOn: "2026-12-03",
  },
];
