import { describe, expect, it } from "vitest";
import { previewDemoStore } from "@/lib/forecast";
import { alertsFrom, type AlertInput } from "./alerts";

const store = previewDemoStore();
const usualWeek = store.forecast.days.slice(1, 8).reduce((s, d) => s + d.expectedInCents, 0);
const input = (over: Partial<AlertInput> = {}): AlertInput => ({ forecast: store.forecast, dues: store.dues, evidence: store.evidence, salesLast7Cents: usualWeek, ...over });

describe("alerts", () => {
  it("fires a price-rise alert when a bill is higher than every past payment", () => {
    expect(alertsFrom(input())).toEqual([
      {
        id: expect.stringContaining("price_rise_"),
        kind: "PRICE_RISE",
        title: "Store software went up $10.",
        detail: "It was $89 the last 3 times. The bill on Fri 13 Nov is $99.",
        confidence: "high",
      },
    ]);
  });

  it("stays quiet about a bill that didn't go up", () => {
    const software = store.evidence.find((e) => e.highestCents === 8_900)!;
    const same = store.evidence.map((e) => (e === software ? { ...e, highestCents: 9_900 } : e));
    expect(alertsFrom(input({ evidence: same }))).toEqual([]);
  });

  it("warns about a slow week, and stays quiet about a usual one", () => {
    const slow = alertsFrom(input({ salesLast7Cents: Math.floor(usualWeek * 0.7) }));
    expect(slow.map((a) => a.kind)).toEqual(["PRICE_RISE", "SLOW_WEEK"]);
    expect(slow[1]!.title).toBe("Sales were slow this past week.");
    expect(alertsFrom(input({ salesLast7Cents: Math.ceil(usualWeek * 0.8) })).map((a) => a.kind)).toEqual(["PRICE_RISE"]);
  });

  it("is quiet when unsure: no alerts at all when the forecast's confidence is low", () => {
    const unsure = { ...store.forecast, confidence: "low" as const };
    expect(alertsFrom(input({ forecast: unsure, salesLast7Cents: 0 }))).toEqual([]);
  });
});
