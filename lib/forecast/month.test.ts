import { describe, expect, it } from "vitest";
import { previewDemoMonth } from "./index";
import { ordinal } from "./month";

/** The month page for Dunder Mifflin & Co. on Thu 5 Nov 2026: the pitch deck's numbers, from the real forecast. */
describe("the month page", () => {
  const month = previewDemoMonth();

  it("opens with one verdict and the month's focus", () => {
    expect(month.monthName).toBe("November");
    expect(month.verdict).toBe("The month adds up. The 12th doesn't.");
    expect(month.focusLine).toBe("Second oven before Christmas");
    expect(month.days).toHaveLength(30);
  });

  it("lists every must-pay in November: $4,839, with auto-debits marked and found payments flagged", () => {
    expect(month.totals.mustPayCents).toBe(483_900);
    expect(month.mustPay.map((p) => [p.date.slice(8), p.name, p.amountCents / 100, p.autoDebit, p.paid, p.found])).toEqual([
      ["02", "Bean There", 400, false, true, false],
      ["03", "Internet", 60, true, true, false],
      ["12", "Rent", 1500, false, false, false],
      ["12", "Bean There", 400, false, false, true],
      ["13", "Card machine", 49, true, false, true],
      ["15", "Oat of Office", 180, true, false, false],
      ["22", "Bean There", 400, false, false, true],
      ["25", "Oven loan", 250, true, false, false],
      ["28", "Staff pay", 1600, false, false, false],
    ]);
  });

  it("adds up what comes in: about $6,900 with Tiers of Joy's $240, leaving about $2,100 for plans", () => {
    expect(month.comingIn.owed.map((o) => [o.customerName, o.amountCents, o.dueOn, o.canRemind])).toEqual([["Tiers of Joy", 24_000, "2026-11-18", true]]);
    expect(Math.round(month.totals.comingInCents / 10_000)).toBe(69);
    expect(month.totals.leftForPlansCents).toBe(month.totals.comingInCents - month.totals.mustPayCents);
  });

  it("marks the short day, and fits want-to-dos only where every must-pay stays covered", () => {
    expect(month.firstShort).toEqual({ date: "2026-11-12", amountCents: 12_000, reason: "the bean order and rent land the same day" });
    const thu12 = month.days[11]!;
    expect(thu12).toMatchObject({ state: "short", shortByCents: 12_000, closingCents: 8_000 });
    expect(thu12.chips.filter((c) => c.kind === "out").map((c) => c.label)).toEqual(["Rent", "Bean There"]);
    expect(month.wantToDo.map((w) => [w.title, w.fits, w.note])).toEqual([
      ["Second oven", false, "Not yet: buying it on Sat 21 Nov would leave Thu 12 Nov $120 short."],
      ["Instagram ads", true, "Fits on Fri 20 Nov. Every must-pay stays covered."],
    ]);
    expect(month.days[20]!.chips).toContainEqual({ kind: "goal", label: "Second oven", amountCents: 120_000, fits: false });
  });

  it("gives the Today panel: $0 safe to spend, $1,780 of $1,900 ready on the 12th, Tiers of Joy owes $240, oven $320 of $1,200", () => {
    expect(month.todayPanel).toMatchObject({
      safeToSpendCents: 0,
      safeNote: "The 12th is $120 short.",
      biggestDay: { date: "2026-11-12", dueCents: 190_000, readyCents: 178_000, names: ["Rent", "Bean There"] },
      goal: { title: "Second oven", savedCents: 32_000, amountCents: 120_000, note: "Not on track for the 21st yet" },
    });
    expect(month.todayPanel.owed[0]).toMatchObject({ customerName: "Tiers of Joy", amountCents: 24_000 });
  });

  it("after Tiers of Joy pays: every day covered, $111 safe to spend, and the oven on track for the 21st", () => {
    const paid = previewDemoMonth({ recovered: true });
    expect(paid.verdict).toBe("The month adds up, and every day is covered.");
    expect(paid.todayPanel).toMatchObject({ safeToSpendCents: 11_100, owed: [], goal: { note: "On track for the 21st" } });
    expect(paid.todayPanel.biggestDay).toMatchObject({ dueCents: 190_000, readyCents: 190_000 });
    expect(paid.wantToDo[0]).toMatchObject({ title: "Second oven", fits: true });
  });

  it("writes ordinals the way people say them", () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 28].map(ordinal)).toEqual(["1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "23rd", "28th"]);
  });
});
