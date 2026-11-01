import { describe, expect, it } from "vitest";
import { dollarsToCents, formatCents, formatDollars, formatShortfall, sumCents } from "./money";
import { addDays, daysBetween, eachDay, formatDay, isIsoDate, weekdayLong } from "./dates";
import { now, timeZoneOffsetMinutes, today, toZonedIso, zonedInstant } from "./clock";
import { getEnv } from "./env";
import { isStoreId, newStoreId } from "./visitor";

describe("money", () => {
  it("formats cents exactly for receipts and tables", () => {
    expect(formatCents(7_200)).toBe("$72.00");
    expect(formatCents(123_456)).toBe("$1,234.56");
    expect(formatCents(-29_000)).toBe("−$290.00");
  });

  it("formats whole dollars for sentences and tiles", () => {
    expect(formatDollars(159_000)).toBe("$1,590");
    expect(formatDollars(-19_049)).toBe("−$190");
  });

  it("rounds a shortfall up so a gap is never understated", () => {
    expect(formatShortfall(8_920)).toBe("$90");
    expect(formatShortfall(9_000)).toBe("$90");
    expect(formatShortfall(9_001)).toBe("$91");
  });

  it("refuses anything that is not whole cents", () => {
    expect(() => formatCents(72.5)).toThrow();
    expect(() => sumCents([100, 0.5])).toThrow();
    expect(sumCents([30_000, 120_000])).toBe(150_000);
    expect(dollarsToCents("$1,200.50")).toBe(120_050);
  });
});

describe("dates", () => {
  it("does date-only arithmetic without time zone drift", () => {
    expect(addDays("2026-11-05", 7)).toBe("2026-11-12");
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(daysBetween("2026-11-05", "2026-11-12")).toBe(7);
    expect(eachDay("2026-11-05", 14)).toHaveLength(14);
  });

  it("writes dates the way the voice rules say", () => {
    expect(formatDay("2026-11-12")).toBe("Thu 12 Nov");
    expect(weekdayLong("2026-11-11")).toBe("Wednesday");
    expect(isIsoDate("2026-02-30")).toBe(false);
  });
});

describe("clock", () => {
  it("uses DEMO_TODAY for today", () => {
    expect(today()).toBe("2026-11-05");
    expect(toZonedIso(now()).slice(0, 10)).toBe("2026-11-05");
  });

  it("knows New York's offset either side of the daylight-saving change", () => {
    expect(timeZoneOffsetMinutes(new Date("2026-10-15T12:00:00Z"), "America/New_York")).toBe(-240);
    expect(timeZoneOffsetMinutes(new Date("2026-11-05T12:00:00Z"), "America/New_York")).toBe(-300);
    expect(zonedInstant("2026-11-03", "19:42").toISOString()).toBe("2026-11-04T00:42:00.000Z");
  });
});

describe("env", () => {
  it("defaults DEMO_TODAY and treats empty values as unset", () => {
    const env = getEnv({ DATABASE_URL: "  ", NODE_ENV: "test" });
    expect(env.DEMO_TODAY).toBe("2026-11-05");
    expect(env.DATABASE_URL).toBeUndefined();
    expect(() => getEnv({ DEMO_TODAY: "5 Nov", NODE_ENV: "test" })).toThrow(/DEMO_TODAY/);
  });
});

describe("visitor ids", () => {
  it("makes valid, distinct store ids", () => {
    const a = newStoreId();
    expect(isStoreId(a)).toBe(true);
    expect(newStoreId()).not.toBe(a);
    expect(isStoreId("drop table")).toBe(false);
  });
});
