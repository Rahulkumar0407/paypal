import { describe, expect, it } from "vitest";
import { buildDemoSeed, paypalFeeCents } from "@/lib/demo";
import { buildHeadline } from "./headline";
import { affordability, forecastFrom, inputFromRows, recurringPayeesFromRows, runForecast } from "./engine";
import { demoScenarioRows, type DemoScenario } from "./load";

/**
 * The demo story's numbers, from the real forecast on the real seed (DEMO.md has the same numbers by hand).
 * Today is Thu 5 Nov 2026. If the seed changes, these tell you exactly which number moved.
 */
const TODAY = "2026-11-05";
const STORE = "st_story";
const input = (scenario: DemoScenario = {}) => inputFromRows(demoScenarioRows(STORE, TODAY, scenario), STORE, TODAY);
const run = (scenario: DemoScenario = {}) => runForecast(input(scenario));
const forecast = (scenario: DemoScenario = {}) => forecastFrom(input(scenario));
const closings = (scenario: DemoScenario = {}) => run(scenario).days.map((d) => d.closingCents);
const RECOVERED = { recovered: true } as const;
const FIXED = { recovered: true, setAsideDailyCents: 1_100 } as const;

describe("regular payments found in the seed's history", () => {
  const payees = recurringPayeesFromRows(demoScenarioRows(STORE, TODAY), STORE, TODAY);
  const find = (name: string) => payees.find((p) => p.name === name)!;

  it("finds Volta at about $300 every 10 days, next on Thu 12 Nov, waiting for the owner to confirm", () => {
    expect(find("Volta Audio Parts")).toMatchObject({
      status: "DETECTED",
      typicalAmountCents: 30_000,
      cadence: { every: "DAYS", days: 10 },
      nextDueOn: "2026-11-12",
      summary: "We think Volta Audio Parts is paid about $300 every 10 days, next on Thu 12 Nov.",
    });
  });

  it("finds the owner's transfers to the bank: about $2,500 every other Monday, next on Mon 9 Nov", () => {
    expect(find("Transfer to your bank")).toMatchObject({
      status: "DETECTED",
      kind: "OWNER_TRANSFER",
      typicalAmountCents: 250_000,
      cadence: { every: "WEEKS", weeks: 2, weekday: 1 },
      nextDueOn: "2026-11-09",
      summary: "We think you move about $2,500 to your bank every other Monday, next on Mon 9 Nov.",
    });
  });

  it("knows the confirmed bills, with rent on Thu 12 Nov", () => {
    expect(find("Rent")).toMatchObject({ status: "CONFIRMED", typicalAmountCents: 120_000, cadence: { every: "MONTH", dayOfMonth: 12 }, nextDueOn: "2026-11-12" });
    expect(payees.filter((p) => p.status === "CONFIRMED").map((p) => p.name)).toEqual(["Rent", "Store software", "Equipment loan", "Shipping supplies", "Internet"]);
  });
});

describe("story step 1: the forecast on Thu 5 Nov", () => {
  it("averages 8 weeks of net sales by weekday, with high confidence", () => {
    const i = input();
    expect(i.startBalanceCents).toBe(198_756);
    expect(i.expectedByWeekday).toEqual([27_069, 20_585, 18_655, 18_902, 27_250, 29_113, 33_420]);
    expect(i.confidence).toBe("high");
    expect(i.confidenceReason).toBe("Based on 8 weeks of sales. A usual week lands within about 12% of the average.");
  });

  it("closes each day at these balances", () => {
    expect(closings()).toEqual([226_006, 255_119, 288_539, 315_608, 86_193, 104_848, 123_750, 1_000, 20_213, 53_633, 80_702, 101_287, 119_942, 138_844]);
  });

  it("is exactly $90 short on Thu 12 Nov, the first and only short day: Volta and rent land together", () => {
    const r = run();
    expect(r.firstShortfall).toEqual({
      date: "2026-11-12",
      amountCents: 9_000,
      dueIds: [`${STORE}_due_rent_2026-11-12`, `${STORE}_payee_volta_due_2026-11-12`],
      reason: "the supplier order and rent land the same day",
    });
    expect(r.days.filter((d) => d.state !== "covered").map((d) => d.date)).toEqual(["2026-11-12"]);
    const thu = r.days[7]!;
    expect(thu.dues.map((d) => [d.payeeName, d.amountCents, d.readyCents])).toEqual([
      ["Rent", 120_000, 120_000],
      ["Volta Audio Parts", 30_000, 21_000],
    ]);
  });

  it("reads the story's opening sentence", () => {
    expect(buildHeadline(forecast()).text).toBe("Clear until Wednesday. On Thu 12 Nov you'll be $90 short: the supplier order and rent land the same day.");
  });

  it("leaves the two risky pending orders out of money in, and shows them as held for a risk check", () => {
    const seed = buildDemoSeed(STORE, TODAY, "run_x");
    expect(seed.orders.filter((o) => o.status === "PENDING").map((o) => o.totalCents)).toEqual([56_700, 89_400]);
    expect(run().days[0]).toMatchObject({ expectedInCents: 27_250, heldInCents: (56_700 - paypalFeeCents(56_700)) + (89_400 - paypalFeeCents(89_400)) });
  });
});

describe("story step 3: the $72 order is paid", () => {
  it("nets $69.00 after PayPal's estimated fee of $3.00", () => {
    expect(paypalFeeCents(7_200)).toBe(300);
  });

  it("leaves Thu 12 Nov $21 short", () => {
    expect(closings(RECOVERED)).toEqual([232_906, 262_019, 295_439, 322_508, 93_093, 111_748, 130_650, 7_900, 27_113, 60_533, 87_602, 108_187, 126_842, 145_744]);
    expect(run(RECOVERED).firstShortfall).toMatchObject({ date: "2026-11-12", amountCents: 2_100 });
    expect(buildHeadline(forecast(RECOVERED)).text).toBe("Clear until Wednesday. On Thu 12 Nov you'll be $21 short: the supplier order and rent land the same day.");
  });
});

describe("story step 5: set aside $11 a day", () => {
  it("keeps $77 back from Monday's transfer, within the 30% cap and under $100", () => {
    const i = input(RECOVERED);
    // To be covered, Thu 12 Nov must close at $150 or more: $71 more than its $79.
    const needed = i.minimumBalanceCents + i.tightMarginCents - 7_900;
    expect(needed).toBe(7_100);
    // Over the 7 days from today to Wed 11 Nov, the smallest whole-dollar amount is $11 a day: $77 in all.
    expect(Math.ceil(needed / 7 / 100) * 100).toBe(1_100);
    expect(1_100 * 7).toBeLessThanOrEqual(10_000);
    // Guard rule 7: no more than 30% of each day's expected sales (the lowest is Tue 10 Nov, $186.55, so $55.96).
    for (const d of run(RECOVERED).days.slice(0, 7)) expect(1_100).toBeLessThanOrEqual(Math.floor(d.expectedInCents * 0.3));
  });

  it("covers Thu 12 Nov at $156, and every other day", () => {
    const r = run(FIXED);
    expect(closings(FIXED)).toEqual([232_906, 262_019, 295_439, 322_508, 100_793, 119_448, 138_350, 15_600, 34_813, 68_233, 95_302, 115_887, 134_542, 153_444]);
    expect(r.days[4]!.dues[0]).toMatchObject({ payeeName: "Transfer to your bank", amountCents: 242_300 });
    expect(r.firstShortfall).toBeNull();
    expect(r.days.every((d) => d.state === "covered")).toBe(true);
    expect(buildHeadline(forecast(FIXED)).text).toBe("Clear for the next two weeks. Thu 12 Nov is covered too, when rent and the supplier order go out.");
  });
});

describe("story step 6: can I afford a $200 order on Monday?", () => {
  it("answers from the strip's own numbers: not yet, it makes Thu 12 Nov $144 short", () => {
    const strip = run(FIXED).days;
    const check = affordability(input(FIXED), 20_000, "2026-11-09");
    expect(check).toEqual({
      date: "2026-11-09",
      amountCents: 20_000,
      affordable: false,
      balanceAfterOnDateCents: strip[4]!.closingCents - 20_000,
      shortfallBefore: null,
      shortfallAfter: { date: "2026-11-12", amountCents: 14_400, dueIds: expect.any(Array), reason: "the supplier order and rent land the same day" },
    });
    expect(check.balanceAfterOnDateCents).toBe(80_793);
  });

  it("asked before any fix, the same order makes Thu 12 Nov $290 short", () => {
    const check = affordability(input(), 20_000, "2026-11-09");
    expect(check).toMatchObject({ affordable: false, balanceAfterOnDateCents: 66_193, shortfallBefore: { amountCents: 9_000 }, shortfallAfter: { amountCents: 29_000 } });
  });
});
