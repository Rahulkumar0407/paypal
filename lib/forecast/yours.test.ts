import { describe, expect, it } from "vitest";
import { addDays } from "@/lib/shared/dates";
import { warningZoneFor, yourForecast, type YourNumbers } from "./yours";

const TODAY = "2026-11-05";

const base: YourNumbers = {
  balanceCents: 50_000, // $500
  dailySalesCents: 10_000, // $100 a day
  minimumBalanceCents: 10_000, // $100
  payments: [],
};

describe("yourForecast (/try)", () => {
  it("adds a day's sales and takes the payments, day by day", () => {
    const { forecast } = yourForecast({ ...base, payments: [{ name: "Rent", kind: "BILL", amountCents: 120_000, inDays: 3, weekly: false }] }, TODAY);
    expect(forecast.days).toHaveLength(30);
    expect(forecast.days[0]!.closingCents).toBe(60_000);
    // $500 + 4 days of $100 − $1,200 rent on the 4th day.
    expect(forecast.days[3]!.closingCents).toBe(-30_000);
    expect(forecast.days[3]!.state).toBe("short");
    expect(forecast.firstShortfall).toMatchObject({ date: addDays(TODAY, 3), amountCents: 40_000 });
  });

  it("says it in the app's own headline, naming the payment", () => {
    const { headline } = yourForecast({ ...base, payments: [{ name: "Rent", kind: "BILL", amountCents: 120_000, inDays: 3, weekly: false }] }, TODAY);
    expect(headline.tone).toBe("short");
    expect(headline.text).toContain("On Sun 8 Nov you'll be $400 short");
    expect(headline.text).toContain("rent");
    expect(headline.text).not.toMatch(/!/);
  });

  it("repeats a weekly payment inside the 30 days", () => {
    const { forecast } = yourForecast({ ...base, payments: [{ name: "Acme", kind: "SUPPLIER", amountCents: 30_000, inDays: 2, weekly: true }] }, TODAY);
    const dueDays = forecast.days.filter((d) => d.dues.length > 0).map((d) => d.date);
    expect(dueDays).toEqual([2, 9, 16, 23].map((n) => addDays(TODAY, n)));
    expect(forecast.days[2]!.dues[0]!.label).toBe("the Acme order");
  });

  it("calls a plain supplier \"the supplier order\", like the app does", () => {
    const { headline } = yourForecast(
      {
        ...base,
        payments: [
          { name: "Rent", kind: "BILL", amountCents: 40_000, inDays: 2, weekly: false },
          { name: "Supplier", kind: "SUPPLIER", amountCents: 40_000, inDays: 2, weekly: false },
        ],
      },
      TODAY,
    );
    expect(headline.text).toContain("the supplier order");
  });

  it("is covered when nothing is due", () => {
    const { forecast, headline, fixes } = yourForecast(base, TODAY);
    expect(forecast.firstShortfall).toBeNull();
    expect(forecast.days.every((d) => d.state === "covered")).toBe(true);
    expect(headline.tone).toBe("covered");
    expect(fixes).toEqual([]);
  });

  it("suggests fixes worked out by the engine when a day is short", () => {
    const { fixes } = yourForecast({ ...base, payments: [{ name: "Rent", kind: "BILL", amountCents: 120_000, inDays: 3, weekly: false }] }, TODAY);
    expect(fixes.length).toBeGreaterThan(0);
    expect(fixes.length).toBeLessThanOrEqual(3);
    for (const f of fixes) expect(f.title.length).toBeGreaterThan(0);
  });

  it("uses half the minimum as the warning zone, at least $25", () => {
    expect(warningZoneFor(10_000)).toBe(5_000);
    expect(warningZoneFor(2_000)).toBe(2_500);
  });
});
