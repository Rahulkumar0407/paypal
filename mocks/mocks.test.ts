import { describe, expect, it } from "vitest";
import { mockForecast, mockForecastAfterRecovery, mockForecastFixed, mockDues } from "./forecast";
import { mockAffordability, mockFixes, mockFixesAfterRecovery } from "./fixes";
import { mockReceipts } from "./guard";

// The mocks stand in for real modules until they land, so they must tell the demo story correctly.
describe("mock forecast tells the demo story", () => {
  it("has 14 days starting Thu 5 Nov 2026", () => {
    expect(mockForecast.days).toHaveLength(14);
    expect(mockForecast.days[0]!.date).toBe("2026-11-05");
    expect(mockForecast.days[0]!.isToday).toBe(true);
  });

  it("is $90 short on Thu 12 Nov because the supplier order and rent land together", () => {
    expect(mockForecast.firstShortfall).toEqual({
      date: "2026-11-12",
      amountCents: 9_000,
      dueIds: ["due_rent_1112", "due_volta_1112"],
      reason: "the supplier order and rent land the same day",
    });
    const rent = mockDues.find((d) => d.id === "due_rent_1112")!;
    const volta = mockDues.find((d) => d.id === "due_volta_1112")!;
    expect(rent.readyCents).toBe(rent.amountCents);
    expect(volta.amountCents - volta.readyCents).toBe(9_000);
  });

  it("has one short day, one tight day, and covered days otherwise", () => {
    const states = mockForecast.days.map((d) => d.state);
    expect(states.filter((s) => s === "short")).toHaveLength(1);
    expect(states.filter((s) => s === "tight")).toHaveLength(1);
  });

  it("leaves $21 after the $72 payment, and is covered after setting aside $11 a day", () => {
    expect(mockForecastAfterRecovery.firstShortfall?.amountCents).toBe(2_100);
    expect(mockForecastFixed.firstShortfall).toBeNull();
    expect(mockForecastFixed.days.find((d) => d.date === "2026-11-12")!.state).toBe("covered");
  });

  it("offers fixes that each cover Thu 12 Nov, within the set-aside cap", () => {
    for (const fix of [...mockFixes, ...mockFixesAfterRecovery]) {
      expect(fix.resultingState).toBe("covered");
      if (fix.dailyAmountCents !== null) expect(fix.dailyAmountCents).toBeLessThanOrEqual(0.3 * 17_000);
    }
    expect(mockFixesAfterRecovery[0]!.amountCents).toBeLessThanOrEqual(10_000);
  });

  it("answers the $200-on-Monday question from the forecast", () => {
    expect(mockAffordability.balanceAfterOnDateCents).toBe(74_500);
    expect(mockAffordability.shortfallAfter?.amountCents).toBe(29_000);
  });

  it("prints every receipt with all 8 rules in order", () => {
    for (const r of mockReceipts) expect(r.decision.rules.map((x) => x.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    const blocked = mockReceipts.find((r) => r.decision.decision === "BLOCK")!;
    expect(blocked.decision.rules.filter((x) => x.outcome === "FAIL").map((x) => x.id)).toEqual(["ALREADY_PAID"]);
  });
});
