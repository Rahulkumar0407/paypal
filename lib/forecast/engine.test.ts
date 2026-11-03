import { describe, expect, it } from "vitest";
import type { ActionProposal } from "@/types";
import { addDays, daysBetween, eachDay, weekdayIndex } from "@/lib/shared/dates";
import {
  adjustmentsFor,
  affordability,
  duesFrom,
  forecastFrom,
  inputFromRows,
  projectedDueId,
  recurringPayeesFromRows,
  runForecast,
  withAdjustments,
  type PayeeRow,
  type StoreRows,
} from "./engine";

/**
 * A small store with round numbers, so every expectation can be checked by hand:
 * $400 at the start of Thu 5 Nov, $200 of sales every day, a $1,000 transfer to the bank every other Monday
 * (next Mon 9 Nov), a $300 supplier every 10 days (next Thu 12 Nov) and $700 rent on Thu 12 Nov.
 * Minimum balance $100, tight within $50 of it.
 *
 *   Thu 5   400 + 200          =  600     Mon 9   1,200 + 200 − 1,000 = 400
 *   Fri 6                      =  800     Tue 10                      = 600
 *   Sat 7                      = 1,000    Wed 11                      = 800
 *   Sun 8                      = 1,200    Thu 12    800 + 200 − 700 − 300 = 0  → $100 short
 */
const TODAY = "2026-11-05";
const STORE = "st_test";

type Rows = StoreRows & { ledger: StoreRows["ledger"][number][]; dues: StoreRows["dues"][number][]; payees: PayeeRow[] };

interface Options {
  weeks?: number;
  sale?: (date: string) => number;
  start?: number;
  supplierStatus?: PayeeRow["status"];
  rent?: boolean;
}

function rows({ weeks = 12, sale = () => 20_000, start = 40_000, supplierStatus = "DETECTED", rent = true }: Options = {}): Rows {
  const historyStart = addDays(TODAY, -weeks * 7);
  const ledger: Rows["ledger"] = [];
  for (const date of eachDay(historyStart, weeks * 7)) {
    const amount = sale(date);
    if (amount > 0) ledger.push({ id: `sale_${date}`, occurredOn: date, direction: "IN", amountCents: amount, category: "SALE", description: "Sale", payeeId: null });
  }
  const pay = (payeeId: string, category: string, last: string, gap: number, amount: number) => {
    for (let d = last; d >= historyStart; d = addDays(d, -gap)) {
      ledger.push({ id: `${payeeId}_${d}`, occurredOn: d, direction: "OUT", amountCents: amount, category, description: payeeId, payeeId });
    }
  };
  pay("supplier", "SUPPLIER", "2026-11-02", 10, 30_000);
  pay("owner", "OWNER_TRANSFER", "2026-10-26", 14, 100_000);
  const net = ledger.reduce((sum, e) => sum + (e.direction === "IN" ? e.amountCents : -e.amountCents), 0);
  const payee = (id: string, kind: PayeeRow["kind"], label: string, status: PayeeRow["status"], extra: Partial<PayeeRow>): PayeeRow => ({
    id,
    name: id === "owner" ? "Transfer to your bank" : id.charAt(0).toUpperCase() + id.slice(1),
    label,
    kind,
    status,
    typicalAmountCents: 0,
    cadence: "EVERY_N_DAYS",
    ...extra,
  });
  return {
    store: { id: STORE, minimumBalanceCents: 10_000, tightMarginCents: 5_000, openingBalanceCents: start - net, openingBalanceOn: historyStart },
    ledger,
    payees: [
      payee("supplier", "SUPPLIER", "the supplier order", supplierStatus, {}),
      payee("owner", "OWNER_TRANSFER", "your transfer to the bank", "DETECTED", {}),
      payee("rent", "BILL", "rent", "CONFIRMED", { typicalAmountCents: 70_000, cadence: "MONTHLY", dayOfMonth: 12 }),
    ],
    dues: rent ? [{ id: "rent_1112", payeeId: "rent", dueOn: "2026-11-12", amountCents: 70_000, status: "SCHEDULED" }] : [],
    setAsides: [],
    gapLoans: [],
    heldOrders: [],
  };
}

const forecast = (r: StoreRows) => forecastFrom(inputFromRows(r, STORE, TODAY));
const closings = (r: StoreRows) => forecast(r).days.map((d) => d.closingCents);
const day = (r: StoreRows, date: string) => forecast(r).days.find((d) => d.date === date)!;

describe("the 14-day forecast", () => {
  it("adds expected sales and takes off known payments, day by day", () => {
    expect(closings(rows())).toEqual([60_000, 80_000, 100_000, 120_000, 40_000, 60_000, 80_000, 0, 20_000, 40_000, 60_000, 80_000, 100_000, 120_000]);
    const f = forecast(rows());
    expect(f.days).toHaveLength(14);
    expect(f.days[0]).toMatchObject({ date: TODAY, isToday: true, openingCents: 40_000, expectedInCents: 20_000 });
    for (const d of f.days) expect(d.closingCents).toBe(d.openingCents + d.expectedInCents - d.knownOutCents);
  });

  it("marks each day short, tight or covered against the minimum balance", () => {
    const thu12 = (start: number) => day(rows({ start }), "2026-11-12");
    expect(thu12(39_000)).toMatchObject({ closingCents: -1_000, state: "short", shortByCents: 11_000 });
    expect(thu12(49_999)).toMatchObject({ closingCents: 9_999, state: "short", shortByCents: 1 });
    expect(thu12(50_000)).toMatchObject({ closingCents: 10_000, state: "tight", shortByCents: 0 });
    expect(thu12(54_999)).toMatchObject({ closingCents: 14_999, state: "tight" });
    expect(thu12(55_000)).toMatchObject({ closingCents: 15_000, state: "covered" });
  });

  it("returns the first shortfall with the payments that cause it", () => {
    expect(forecast(rows()).firstShortfall).toEqual({
      date: "2026-11-12",
      amountCents: 10_000,
      dueIds: ["rent_1112", projectedDueId("supplier", "2026-11-12")],
      reason: "the supplier order and rent land the same day",
    });
  });

  it("fills each payment from what's there above the minimum, bills before the supplier", () => {
    const dues = day(rows(), "2026-11-12").dues;
    expect(dues.map((d) => [d.payeeName, d.amountCents, d.readyCents])).toEqual([
      ["Rent", 70_000, 70_000],
      ["Supplier", 30_000, 20_000],
    ]);
  });

  it("averages each weekday over the last 8 weeks, counting days with no sales as $0", () => {
    const byWeekday = inputFromRows(rows({ sale: (d) => (weekdayIndex(d) + 1) * 1_000 }), STORE, TODAY).expectedByWeekday;
    expect(byWeekday).toEqual([1_000, 2_000, 3_000, 4_000, 5_000, 6_000, 7_000]);
    // Only the last 8 weeks count: older sales are ignored.
    const recentOnly = inputFromRows(rows({ sale: (d) => (d < addDays(TODAY, -56) ? 99_000 : 7_000) }), STORE, TODAY).expectedByWeekday;
    expect(recentOnly).toEqual([7_000, 7_000, 7_000, 7_000, 7_000, 7_000, 7_000]);
    // With 3 weeks of history and nothing sold on Tuesdays.
    const short = inputFromRows(rows({ weeks: 3, sale: (d) => (weekdayIndex(d) === 2 ? 0 : 10_000) }), STORE, TODAY).expectedByWeekday;
    expect(short).toEqual([10_000, 10_000, 0, 10_000, 10_000, 10_000, 10_000]);
  });
});

describe("confidence, from how much weekly sales swing", () => {
  const weekOf = (d: string) => Math.floor((daysBetween(d, TODAY) - 1) / 7);

  it("is high when weeks are steady", () => {
    expect(forecast(rows())).toMatchObject({ confidence: "high", confidenceReason: "Based on 8 weeks of sales. A usual week lands within about 0% of the average." });
  });

  it("is medium when weeks swing by about a fifth or a third", () => {
    const f = forecast(rows({ sale: (d) => (weekOf(d) % 2 === 0 ? 20_000 : 30_000) }));
    expect(f).toMatchObject({ confidence: "medium", confidenceReason: "Based on 8 weeks of sales, which swing by about 21% from week to week." });
  });

  it("is low when weeks swing a lot", () => {
    const f = forecast(rows({ sale: (d) => (weekOf(d) % 2 === 0 ? 40_000 : 0) }));
    expect(f.confidence).toBe("low");
    expect(f.confidenceReason).toBe("Sales have swung by about 107% from week to week, so treat this as a rough guess.");
  });

  it("is low with a sparse history, whatever the numbers", () => {
    expect(forecast(rows({ weeks: 2 }))).toMatchObject({ confidence: "low", confidenceReason: "Only 2 weeks of sales so far, so this is only a rough guess." });
    expect(forecast(rows({ weeks: 0 }))).toMatchObject({ confidence: "low", confidenceReason: "No sales history yet, so this is only a rough guess." });
  });
});

describe("what counts as money out", () => {
  it("counts a regular payee before it's confirmed, and drops one the owner dismissed", () => {
    expect(forecast(rows({ supplierStatus: "DISMISSED" })).firstShortfall).toBeNull();
    expect(day(rows({ supplierStatus: "DISMISSED" }), "2026-11-12").closingCents).toBe(30_000);
  });

  it("uses a confirmed payee's own dues, without counting them twice", () => {
    const r = rows({ supplierStatus: "CONFIRMED" });
    r.dues.push({ id: projectedDueId("supplier", "2026-11-12"), payeeId: "supplier", dueOn: "2026-11-12", amountCents: 30_000, status: "SCHEDULED" });
    expect(closings(r)).toEqual(closings(rows()));
    expect(day(r, "2026-11-12").dues).toHaveLength(2);
  });

  it("skips a projected payment that already has its own row, like one that was moved", () => {
    const r = rows();
    r.dues.push({ id: projectedDueId("supplier", "2026-11-12"), payeeId: "supplier", dueOn: "2026-11-14", amountCents: 30_000, status: "MOVED", movedFromOn: "2026-11-12", simulated: true });
    expect(day(r, "2026-11-12").dues.map((d) => d.payeeName)).toEqual(["Rent"]);
    expect(day(r, "2026-11-14").dues[0]).toMatchObject({ payeeName: "Supplier", status: "MOVED", movedFromOn: "2026-11-12", simulated: true });
  });

  it("removing a due clears the shortfall, and moving one moves it", () => {
    expect(forecast(rows({ rent: false })).firstShortfall).toBeNull();
    const moved = rows();
    moved.dues[0] = { ...moved.dues[0]!, dueOn: "2026-11-10", movedFromOn: "2026-11-12", status: "MOVED" };
    expect(forecast(moved).firstShortfall).toMatchObject({ date: "2026-11-10", amountCents: 20_000, reason: "rent is due" });
  });

  it("counts money that already arrived today on top of the expected sales", () => {
    const r = rows();
    r.ledger.push({ id: "recovered", occurredOn: TODAY, direction: "IN", amountCents: 6_900, category: "SALE", description: "Order #1196", payeeId: null });
    expect(day(r, TODAY).expectedInCents).toBe(26_900);
    expect(forecast(r).firstShortfall?.amountCents).toBe(3_100);
  });

  it("counts a payment that already went out today as paid", () => {
    const r = rows();
    r.ledger.push({ id: "paid_today", occurredOn: TODAY, direction: "OUT", amountCents: 5_000, category: "BILL", description: "Phone bill", payeeId: null });
    expect(day(r, TODAY).dues).toEqual([expect.objectContaining({ payeeName: "Phone bill", status: "PAID", amountCents: 5_000, readyCents: 5_000 })]);
    expect(day(r, TODAY).closingCents).toBe(55_000);
  });

  it("keeps a set-aside back from the owner's transfer before the day it's for", () => {
    const r = rows();
    r.setAsides = [{ dailyAmountCents: 2_000, startOn: TODAY, endOn: "2026-11-11", forDate: "2026-11-12" }];
    expect(day(r, "2026-11-09").dues[0]!.amountCents).toBe(86_000);
    expect(day(r, "2026-11-12")).toMatchObject({ closingCents: 14_000, state: "tight" });
  });

  it("adds a simulated gap loan and its repayment", () => {
    const r = rows();
    r.gapLoans = [{ id: "loan1", amountCents: 15_000, feeCents: 300, receivedOn: "2026-11-12", repayOn: "2026-11-14" }];
    expect(day(r, "2026-11-12")).toMatchObject({ expectedInCents: 35_000, closingCents: 15_000, state: "covered" });
    expect(day(r, "2026-11-14").dues[0]).toMatchObject({ payeeName: "Gap loan repayment", amountCents: 15_300, simulated: true });
  });

  it("shows money held for a risk check without counting it", () => {
    const r = rows();
    r.heldOrders = [{ id: "ord_1198", number: 1198, netCents: 54_672 }];
    expect(day(r, TODAY)).toMatchObject({ heldInCents: 54_672, closingCents: 60_000 });
  });
});

describe("dues and regular payees", () => {
  it("lists every payment in the next 35 days with its readiness, never the paid ones", () => {
    const dues = duesFrom(inputFromRows(rows(), STORE, TODAY));
    expect(dues.map((d) => `${d.dueOn} ${d.payeeName}`)).toEqual([
      "2026-11-09 Transfer to your bank",
      "2026-11-12 Rent",
      "2026-11-12 Supplier",
      "2026-11-22 Supplier",
      "2026-11-23 Transfer to your bank",
      "2026-12-02 Supplier",
      "2026-12-07 Transfer to your bank",
    ]);
    expect(dues.find((d) => d.payeeName === "Supplier")!.readyCents).toBe(20_000);
  });

  it("describes what it found, soonest first", () => {
    const payees = recurringPayeesFromRows(rows(), STORE, TODAY);
    expect(payees.map((p) => [p.name, p.status, p.nextDueOn, p.summary])).toEqual([
      ["Transfer to your bank", "DETECTED", "2026-11-09", "We think you move $1,000 to your bank every other Monday, next on Mon 9 Nov."],
      ["Rent", "CONFIRMED", "2026-11-12", "Rent is paid $700 on the 12th of each month, next on Thu 12 Nov."],
      ["Supplier", "DETECTED", "2026-11-12", "We think Supplier is paid $300 every 10 days, next on Thu 12 Nov."],
    ]);
  });
});

describe("what-ifs", () => {
  const input = () => inputFromRows(rows(), STORE, TODAY);
  const base = {
    id: "prop_1",
    storeId: STORE,
    amountCents: 0,
    proposedBy: { kind: "OWNER" as const },
    idempotencyKey: "run_x:T:t:1",
    sequence: 1,
    draftText: null,
    createdAt: "2026-11-05T10:00:00-05:00",
    demoDate: TODAY,
  };
  const target = { kind: "DUE" as const, id: "t", label: "Supplier" };

  it("turns each Guard action into the change it would make", () => {
    const cases: [ActionProposal, unknown][] = [
      [{ ...base, target, type: "SEND_REMINDER", params: { orderId: "o", customerId: "c", channel: "SIMULATED_OUTBOX" } }, []],
      [{ ...base, target, type: "HOLD_ORDER", params: { orderId: "o", riskFlagIds: [] } }, []],
      [
        { ...base, target, type: "SET_ASIDE", params: { dailyAmountCents: 1_100, startOn: TODAY, endOn: "2026-11-11", forDate: "2026-11-12" } },
        [{ kind: "SET_ASIDE", dailyAmountCents: 1_100, startOn: TODAY, endOn: "2026-11-11", forDate: "2026-11-12" }],
      ],
      [{ ...base, target, type: "MOVE_PAYMENT", params: { dueId: "d", fromOn: "2026-11-12", toOn: "2026-11-14" } }, [{ kind: "MOVE_DUE", dueId: "d", toOn: "2026-11-14" }]],
      [
        { ...base, target, type: "GAP_LOAN", params: { amountCents: 15_000, feeCents: 300, repayOn: "2026-11-14" } },
        [{ kind: "GAP_LOAN", id: "prop_1", amountCents: 15_000, feeCents: 300, receivedOn: TODAY, repayOn: "2026-11-14" }],
      ],
      [{ ...base, target, type: "PAY_SUPPLIER", params: { payeeId: "supplier", dueId: "d" } }, [{ kind: "PAY_DUE_NOW", dueId: "d" }]],
      [
        { ...base, amountCents: 7_200, target: { kind: "ORDER", id: "o", label: "Order #1196" }, type: "REFUND", params: { orderId: "o", captureId: null } },
        [{ kind: "EXTRA_OUT", date: TODAY, amountCents: 7_200, payeeName: "Refund: Order #1196", label: "the refund" }],
      ],
    ];
    for (const [proposal, expected] of cases) expect(adjustmentsFor(proposal, TODAY)).toEqual(expected);
  });

  it("moves, pays early and lends without touching the original inputs", () => {
    const original = input();
    const supplierDue = projectedDueId("supplier", "2026-11-12");
    const moved = runForecast(withAdjustments(original, [{ kind: "MOVE_DUE", dueId: supplierDue, toOn: "2026-11-14" }]));
    expect(moved.firstShortfall).toBeNull();
    expect(moved.days.find((d) => d.date === "2026-11-14")!.dues[0]).toMatchObject({ status: "MOVED", movedFromOn: "2026-11-12", simulated: true });
    const paid = runForecast(withAdjustments(original, [{ kind: "PAY_DUE_NOW", dueId: supplierDue }]));
    expect(paid.days[0]!.dues[0]).toMatchObject({ payeeName: "Supplier", status: "PAID", amountCents: 30_000 });
    expect(paid.days[7]!.closingCents).toBe(0);
    expect(runForecast(original).days[0]!.dues).toHaveLength(0);
  });

  it("refuses a change to a payment that isn't there", () => {
    expect(() => withAdjustments(input(), [{ kind: "MOVE_DUE", dueId: "nope", toOn: "2026-11-14" }])).toThrow("No upcoming payment with id nope");
  });

  it("answers 'can I afford it' from the same numbers as the strip", () => {
    const strip = runForecast(input()).days;
    const check = affordability(input(), 10_000, "2026-11-09");
    expect(check).toMatchObject({ date: "2026-11-09", amountCents: 10_000, affordable: false, balanceAfterOnDateCents: strip[4]!.closingCents - 10_000 });
    expect(check.shortfallBefore?.amountCents).toBe(10_000);
    expect(check.shortfallAfter).toMatchObject({ date: "2026-11-12", amountCents: 20_000 });
    expect(affordability(inputFromRows(rows({ rent: false }), STORE, TODAY), 10_000, "2026-11-09")).toMatchObject({ affordable: true, shortfallAfter: null });
    // After a short day, a purchase that leaves every later day covered is affordable.
    expect(affordability(input(), 1_000, "2026-11-18").affordable).toBe(true);
  });

  it("refuses dates in the past or too far ahead, and amounts of $0 or less", () => {
    expect(() => affordability(input(), 10_000, "2026-11-04")).toThrow(RangeError);
    expect(() => affordability(input(), 10_000, addDays(TODAY, 35))).toThrow(RangeError);
    expect(() => affordability(input(), 0, TODAY)).toThrow(RangeError);
    expect(() => affordability(input(), 10.5, TODAY)).toThrow();
  });
});
