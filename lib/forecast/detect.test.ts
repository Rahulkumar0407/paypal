import { describe, expect, it } from "vitest";
import { addDays } from "@/lib/shared/dates";
import { amountWords, cadenceWords, detectPattern, summaryFor, type PastPayment } from "./detect";

const TODAY = "2026-11-05";
const every = (first: string, gapDays: number, amounts: number[]): PastPayment[] =>
  amounts.map((amountCents, i) => ({ date: addDays(first, i * gapDays), amountCents }));

describe("detectPattern", () => {
  it("finds a supplier paid about $300 every 10 days, and the next date", () => {
    const p = detectPattern(every("2026-08-14", 10, [30_400, 29_400, 31_200, 30_000, 29_100, 30_700, 30_000, 29_700, 30_500]), TODAY);
    expect(p).toEqual({
      cadence: { every: "DAYS", days: 10 },
      typicalAmountCents: 30_000,
      amountsVary: true,
      payments: 9,
      lastPaidOn: "2026-11-02",
      nextDueOn: "2026-11-12",
    });
  });

  it("allows a day either way in the gaps", () => {
    const dates = ["2026-09-25", "2026-10-05", "2026-10-14", "2026-10-25", "2026-11-04"];
    const p = detectPattern(dates.map((date) => ({ date, amountCents: 5_000 })), TODAY);
    expect(p?.cadence).toEqual({ every: "DAYS", days: 10 });
  });

  it("finds the owner's transfer every other Monday", () => {
    const p = detectPattern(every("2026-08-17", 14, [253_000, 248_000, 250_000, 254_500, 250_000, 246_500]), TODAY);
    expect(p?.cadence).toEqual({ every: "WEEKS", weeks: 2, weekday: 1 });
    expect(p?.typicalAmountCents).toBe(250_000);
    expect(p?.nextDueOn).toBe("2026-11-09");
  });

  it("finds a monthly bill by its day of the month, and clamps it in short months", () => {
    const rent = detectPattern(["2026-08-12", "2026-09-12", "2026-10-12"].map((date) => ({ date, amountCents: 120_000 })), TODAY);
    expect(rent).toMatchObject({ cadence: { every: "MONTH", dayOfMonth: 12 }, amountsVary: false, nextDueOn: "2026-11-12" });
    const endOfMonth = detectPattern(["2026-08-31", "2026-09-30", "2026-10-31"].map((date) => ({ date, amountCents: 4_000 })), TODAY);
    expect(endOfMonth).toMatchObject({ cadence: { every: "MONTH", dayOfMonth: 31 }, nextDueOn: "2026-11-30" });
  });

  it("needs at least 3 payments", () => {
    expect(detectPattern(every("2026-10-01", 10, [30_000, 30_000]), TODAY)).toBeNull();
  });

  it("is not fooled by amounts that differ a lot", () => {
    expect(detectPattern(every("2026-09-01", 10, [30_000, 30_000, 45_000, 30_000]), TODAY)).toBeNull();
  });

  it("is not fooled by uneven gaps", () => {
    const dates = ["2026-10-01", "2026-10-04", "2026-10-20", "2026-10-27", "2026-11-04"];
    expect(detectPattern(dates.map((date) => ({ date, amountCents: 5_000 })), TODAY)).toBeNull();
  });

  it("drops a pattern that has stopped", () => {
    expect(detectPattern(every("2026-06-01", 10, [30_000, 30_000, 30_000, 30_000]), TODAY)).toBeNull();
  });

  it("ignores payments dated today or later", () => {
    const p = detectPattern(every("2026-10-06", 10, [30_000, 30_000, 30_000, 30_000]), TODAY);
    expect(p?.payments).toBe(3);
    expect(p?.nextDueOn).toBe("2026-11-05");
  });
});

describe("plain words", () => {
  it("says the cadence the way people do", () => {
    expect(cadenceWords({ every: "DAYS", days: 10 })).toBe("every 10 days");
    expect(cadenceWords({ every: "WEEKS", weeks: 1, weekday: 5 })).toBe("every Friday");
    expect(cadenceWords({ every: "WEEKS", weeks: 2, weekday: 1 })).toBe("every other Monday");
    expect(cadenceWords({ every: "MONTH", dayOfMonth: 3 })).toBe("on the 3rd of each month");
    expect(cadenceWords({ every: "MONTH", dayOfMonth: 12 })).toBe("on the 12th of each month");
  });

  it("rounds an amount that varies and keeps one that doesn't", () => {
    expect(amountWords(30_100, true)).toBe("about $300");
    expect(amountWords(253_000, true)).toBe("about $2,550");
    expect(amountWords(4_520, true)).toBe("about $45");
    expect(amountWords(9_900, false)).toBe("$99");
  });

  it("writes the suggestion the owner confirms", () => {
    const base = { typicalAmountCents: 30_000, amountsVary: true, cadence: { every: "DAYS", days: 10 } as const, nextDueOn: "2026-11-12" };
    expect(summaryFor({ ...base, name: "Volta Audio Parts", kind: "SUPPLIER", status: "DETECTED" })).toBe(
      "We think Volta Audio Parts is paid about $300 every 10 days, next on Thu 12 Nov.",
    );
    expect(summaryFor({ ...base, name: "Volta Audio Parts", kind: "SUPPLIER", status: "CONFIRMED" })).toBe(
      "Volta Audio Parts is paid about $300 every 10 days, next on Thu 12 Nov.",
    );
    expect(
      summaryFor({ name: "Transfer to your bank", kind: "OWNER_TRANSFER", status: "DETECTED", typicalAmountCents: 250_000, amountsVary: true, cadence: { every: "WEEKS", weeks: 2, weekday: 1 }, nextDueOn: "2026-11-09" }),
    ).toBe("We think you move about $2,500 to your bank every other Monday, next on Mon 9 Nov.");
  });
});
