import { describe, expect, it } from "vitest";
import { isRisky, scoreOrder, typicalOrderCents, type RiskOrderFacts } from "./risk";

const TYPICAL = 7_000;
const regular: RiskOrderFacts = { totalCents: 5_900, failedAttempts: 0, placedOn: "2026-11-04", customerFirstSeenOn: "2026-08-20", customerPaidOrders: 6 };

describe("the risk score", () => {
  it("leaves a usual order from a known customer alone", () => {
    expect(scoreOrder(regular, TYPICAL)).toEqual({ score: 0, flags: [] });
    expect(isRisky(scoreOrder(regular, TYPICAL))).toBe(false);
  });

  it("flags an unusual amount: 3 or more times the usual order", () => {
    expect(scoreOrder({ ...regular, totalCents: 20_999 }, TYPICAL).flags).toEqual([]);
    expect(scoreOrder({ ...regular, totalCents: 89_400 }, TYPICAL)).toEqual({ score: 2, flags: [{ kind: "UNUSUAL_AMOUNT", detail: "$894 is 13 times the usual order of $70." }] });
  });

  it("flags a brand-new buyer's big first order", () => {
    const newBuyer = { ...regular, totalCents: 15_000, customerFirstSeenOn: "2026-11-04", customerPaidOrders: 0 };
    expect(scoreOrder(newBuyer, TYPICAL).flags.map((f) => f.kind)).toEqual(["NEW_BUYER_BIG_ORDER"]);
    // A small first order, or a big one from someone first seen weeks ago, is fine.
    expect(scoreOrder({ ...newBuyer, totalCents: 5_000 }, TYPICAL).flags).toEqual([]);
    expect(scoreOrder({ ...newBuyer, customerFirstSeenOn: "2026-09-01" }, TYPICAL).flags).toEqual([]);
  });

  it("flags repeated failed attempts", () => {
    expect(scoreOrder({ ...regular, failedAttempts: 2 }, TYPICAL).flags).toEqual([]);
    expect(scoreOrder({ ...regular, failedAttempts: 3 }, TYPICAL)).toEqual({ score: 3, flags: [{ kind: "REPEATED_FAILED_ATTEMPTS", detail: "3 payment attempts have failed." }] });
  });

  it("adds up when several rules flag the same order (Jordan's $567 first order)", () => {
    const jordan = { totalCents: 56_700, failedAttempts: 0, placedOn: "2026-11-04", customerFirstSeenOn: "2026-11-04", customerPaidOrders: 0 };
    expect(scoreOrder(jordan, TYPICAL)).toMatchObject({ score: 4, flags: [{ kind: "UNUSUAL_AMOUNT" }, { kind: "NEW_BUYER_BIG_ORDER" }] });
  });

  it("takes the usual order as the middle paid order", () => {
    expect([typicalOrderCents([1_000, 9_000, 3_000]), typicalOrderCents([1_000, 3_000]), typicalOrderCents([])]).toEqual([3_000, 2_000, 0]);
  });
});
