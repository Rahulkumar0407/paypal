import { describe, expect, it } from "vitest";
import type { YourNumbers } from "@/lib/forecast";
import { judgeYourFix } from "./yours";

const TODAY = "2026-11-05";

/** The /try example: rent and the supplier order land on Wed 11 Nov, $60 short. */
const example: YourNumbers = {
  balanceCents: 180_000,
  dailySalesCents: 22_000,
  minimumBalanceCents: 20_000,
  payments: [
    { name: "Transfer to your bank", kind: "OWNER_TRANSFER", amountCents: 100_000, inDays: 3, weekly: false },
    { name: "Rent", kind: "BILL", amountCents: 160_000, inDays: 6, weekly: false },
    { name: "Supplier", kind: "SUPPLIER", amountCents: 60_000, inDays: 6, weekly: true },
  ],
};

describe("judgeYourFix (/try)", () => {
  it("sets aside a little each day: the short day is covered, and $162 in all needs the owner's OK (rule 8)", () => {
    const v = judgeYourFix(example, "fix_set_aside", TODAY)!;
    expect(v).not.toBeNull();
    expect(v.after.firstShortfall).toBeNull();
    expect(v.decision).toBe("ESCALATE");
    expect(v.ruleNumber).toBe(8);
  });

  it("a gap loan always waits for the owner (rule 8)", () => {
    const v = judgeYourFix(example, "fix_gap_loan", TODAY)!;
    expect(v.decision).toBe("ESCALATE");
    expect(v.ruleNumber).toBe(8);
  });

  it("returns null for a fix that isn't on offer for these numbers", () => {
    expect(judgeYourFix(example, "fix_move_nothing", TODAY)).toBeNull();
    expect(judgeYourFix({ ...example, payments: [] }, "fix_set_aside", TODAY)).toBeNull();
  });
});
