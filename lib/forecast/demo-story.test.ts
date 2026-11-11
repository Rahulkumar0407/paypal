import { describe, expect, it } from "vitest";
import { buildDemoSeed, paypalFeeCents } from "@/lib/demo";
import { buildHeadline } from "./headline";
import { affordability, forecastFrom, inputFromRows, recurringPayeesFromRows, runForecast } from "./engine";
import { fixOptionsFrom } from "./fixes";
import { demoScenarioRows, type DemoScenario } from "./load";

/**
 * The demo story's numbers, from the real forecast on the real seed: Dunder Mifflin & Co., a café-bakery.
 * Today is Thu 5 Nov 2026. If the seed changes, these tell you exactly which number moved.
 */
const TODAY = "2026-11-05";
const STORE = "st_story";
const input = (scenario: DemoScenario = {}) => inputFromRows(demoScenarioRows(STORE, TODAY, scenario), STORE, TODAY);
const run = (scenario: DemoScenario = {}) => runForecast(input(scenario));
const forecast = (scenario: DemoScenario = {}) => forecastFrom(input(scenario));
const closings = (scenario: DemoScenario = {}) => run(scenario).days.map((d) => d.closingCents);
const PAID = { recovered: true } as const;

describe("Spot: regular payments found in the café's history", () => {
  const payees = recurringPayeesFromRows(demoScenarioRows(STORE, TODAY), STORE, TODAY);
  const find = (name: string) => payees.find((p) => p.name === name)!;

  it("finds Bean There at about $400 every 10 days, next on Thu 12 Nov, waiting for Penny to confirm", () => {
    expect(find("Bean There")).toMatchObject({
      status: "DETECTED",
      typicalAmountCents: 40_000,
      cadence: { every: "DAYS", days: 10 },
      nextDueOn: "2026-11-12",
      summary: "We think Bean There is paid about $400 every 10 days, next on Thu 12 Nov.",
    });
  });

  it("finds the $49 card-machine auto-debit nobody wrote down", () => {
    expect(find("Card machine")).toMatchObject({ status: "DETECTED", typicalAmountCents: 4_900, cadence: { every: "MONTH", dayOfMonth: 13 }, nextDueOn: "2026-11-13" });
  });

  it("knows the confirmed bills, with rent on Thu 12 Nov", () => {
    expect(find("Rent")).toMatchObject({ status: "CONFIRMED", typicalAmountCents: 150_000, cadence: { every: "MONTH", dayOfMonth: 12 }, nextDueOn: "2026-11-12" });
    expect(payees.filter((p) => p.status === "CONFIRMED").map((p) => p.name)).toEqual(["Rent", "Oat of Office", "Oven loan", "Staff pay", "Internet"]);
  });

  it("adds up to the deck's $4,839 of must-pays in November", () => {
    const november = run().days.filter((d) => d.date.startsWith("2026-11")).flatMap((d) => d.dues);
    const before = 40_000 + 6_000; // beans on 2 Nov and internet on 3 Nov, already paid before today
    expect(november.reduce((sum, d) => sum + d.amountCents, 0) + before).toBe(483_900);
  });
});

describe("story step 1: the 30-day forecast on Thu 5 Nov", () => {
  it("averages 8 weeks of net sales by weekday (about $180 on weekdays, $320 at weekends), with high confidence", () => {
    const i = input();
    expect(i.startBalanceCents).toBe(26_608);
    expect(i.expectedByWeekday).toEqual([29_287, 20_618, 18_892, 18_416, 17_360, 17_825, 31_634]);
    expect(i.confidence).toBe("high");
    expect(i.confidenceReason).toBe("Based on 8 weeks of sales. A usual week lands within about 8% of the average.");
  });

  it("closes each of the 30 days at these balances", () => {
    expect(closings()).toEqual([
      43_968, 61_793, 93_427, 122_714, 143_332, 162_224, 180_640, 8_000, 20_925, 52_559, 63_846, 84_464, 103_356, 121_772, 139_132,
      156_957, 188_591, 177_878, 198_496, 217_388, 210_804, 228_164, 245_989, 117_623, 146_910, 167_528, 186_420, 164_836, 176_196, 194_021,
    ]);
  });

  it("is exactly $120 short on Thu 12 Nov: rent and beans land together, $1,780 of $1,900 ready", () => {
    const r = run();
    expect(r.firstShortfall).toEqual({
      date: "2026-11-12",
      amountCents: 12_000,
      dueIds: [`${STORE}_due_rent_2026-11-12`, `${STORE}_payee_beans_due_2026-11-12`],
      reason: "the bean order and rent land the same day",
    });
    expect(r.days.filter((d) => d.state !== "covered").map((d) => [d.date, d.state])).toEqual([["2026-11-12", "short"], ["2026-11-13", "tight"]]);
    const thu = r.days[7]!;
    expect(thu.dues.map((d) => [d.payeeName, d.amountCents, d.readyCents])).toEqual([
      ["Rent", 150_000, 150_000],
      ["Bean There", 40_000, 28_000],
    ]);
  });

  it("reads the story's opening sentence", () => {
    expect(buildHeadline(forecast()).text).toBe("Clear until Wednesday. On Thu 12 Nov you'll be $120 short: the bean order and rent land the same day.");
  });

  it("leaves the two risky pending orders out of money in, and shows them as held for a risk check", () => {
    const seed = buildDemoSeed(STORE, TODAY, "run_x");
    expect(seed.orders.filter((o) => o.status === "PENDING").map((o) => o.totalCents)).toEqual([43_200, 32_000]);
    expect(run().days[0]).toMatchObject({ expectedInCents: 17_360, heldInCents: (43_200 - paypalFeeCents(43_200)) + (32_000 - paypalFeeCents(32_000)) });
  });

  it("offers to move the bean order or take a simulated $120 loan", () => {
    expect(fixOptionsFrom(input()).map((f) => [f.kind, f.title, f.resultingState, f.simulated])).toEqual([
      ["MOVE_PAYMENT", "Move Bean There's $400 payment to Sat 14 Nov", "covered", true],
      ["GAP_LOAN", "Take a $120 short-term loan", "tight", true],
    ]);
    expect(fixOptionsFrom(input())[1]!.detail).toBe("Paid in today, $122.40 back on Sat 14 Nov. Simulated: no real loan is made.");
  });
});

describe("story step 3: Ivory & Vow pays its $240 cake", () => {
  it("nets $231.13 after PayPal's estimated fee of $8.87", () => {
    expect(paypalFeeCents(24_000)).toBe(887);
  });

  it("covers Thu 12 Nov, and every other day", () => {
    const r = run(PAID);
    expect(r.firstShortfall).toBeNull();
    expect(r.days.every((d) => d.state === "covered")).toBe(true);
    expect(r.days[7]!.closingCents).toBe(31_113);
    expect(buildHeadline(forecast(PAID)).text).toBe("Clear for the next 30 days. Thu 12 Nov is covered too, when rent and the bean order go out.");
  });
});

describe("can I afford a $200 order on Monday?", () => {
  it("not yet, even after Ivory & Vow pays: it makes Thu 12 Nov $89 short", () => {
    const check = affordability(input(PAID), 20_000, "2026-11-09");
    expect(check).toMatchObject({ affordable: false, balanceAfterOnDateCents: 146_445, shortfallBefore: null, shortfallAfter: { date: "2026-11-12", amountCents: 8_887 } });
  });

  it("asked before any fix, the same order makes Thu 12 Nov $320 short", () => {
    const check = affordability(input(), 20_000, "2026-11-09");
    expect(check).toMatchObject({ affordable: false, balanceAfterOnDateCents: 123_332, shortfallBefore: { amountCents: 12_000 }, shortfallAfter: { amountCents: 32_000 } });
  });
});
