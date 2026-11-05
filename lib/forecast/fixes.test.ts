import { describe, expect, it } from "vitest";
import { inputFromRows, runForecast, withAdjustments, type ForecastInput } from "./engine";
import { fixOptionsFrom } from "./fixes";
import { demoScenarioRows, type DemoScenario } from "./load";

const TODAY = "2026-11-05";
const input = (scenario: DemoScenario = {}) => inputFromRows(demoScenarioRows("st_fix", TODAY, scenario), "st_fix", TODAY);
const VOLTA = "st_fix_payee_volta_due_2026-11-12";

describe("fix the gap on the demo store", () => {
  it("step 1: three ways to cover the $90 gap on Thu 12 Nov", () => {
    expect(fixOptionsFrom(input()).map((f) => [f.kind, f.title, f.amountCents, f.resultingClosingCents, f.resultingState, f.simulated])).toEqual([
      ["SET_ASIDE", "Set aside $20 a day until Thu 12 Nov", 14_000, 15_000, "covered", false],
      ["MOVE_PAYMENT", "Move Volta Audio Parts' $300 payment to Fri 13 Nov", 30_000, 31_000, "covered", true],
      ["GAP_LOAN", "Take a $90 short-term loan", 9_000, 10_000, "tight", true],
    ]);
  });

  it("step 5: after the $72 payment, setting aside $11 a day ($77) covers Thu 12 Nov at $156", () => {
    const [setAside, move, loan] = fixOptionsFrom(input({ recovered: true }));
    expect(setAside).toMatchObject({
      id: "fix_set_aside",
      dailyAmountCents: 1_100,
      days: 7,
      amountCents: 7_700,
      resultingClosingCents: 15_600,
      resultingState: "covered",
      detail: "Keep $11 a day of sales in PayPal instead of moving it to your bank on Mon 9 Nov. That's $77 by Thu 12 Nov.",
    });
    expect(move).toMatchObject({ dueId: VOLTA, moveToOn: "2026-11-13" });
    expect(loan).toMatchObject({ amountCents: 2_100, loanFeeCents: 42, repayOn: "2026-11-13", detail: "Paid in today, $21.42 back on Fri 13 Nov. Simulated: no real loan is made." });
  });

  it("keeps every set-aside within 30% of each day's expected sales", () => {
    for (const s of [{}, { recovered: true }] as DemoScenario[]) {
      const i = input(s);
      const fix = fixOptionsFrom(i).find((f) => f.kind === "SET_ASIDE")!;
      for (const d of runForecast(i).days.slice(0, fix.days!)) expect(fix.dailyAmountCents! * 10).toBeLessThanOrEqual(d.expectedInCents * 3);
    }
  });

  it("moves the payment to the first later day that stays covered, with every day after it covered too", () => {
    const fix = fixOptionsFrom(input()).find((f) => f.kind === "MOVE_PAYMENT")!;
    const run = runForecast(withAdjustments(input(), [{ kind: "MOVE_DUE", dueId: fix.dueId!, toOn: fix.moveToOn! }]));
    expect(run.firstShortfall).toBeNull();
    expect(run.days.find((d) => d.date === "2026-11-13")!.state).toBe("covered");
  });

  it("lends the exact gap, so the day ends right at the minimum", () => {
    const loan = fixOptionsFrom(input()).find((f) => f.kind === "GAP_LOAN")!;
    expect(loan).toMatchObject({ amountCents: 9_000, loanFeeCents: 180, resultingClosingCents: 10_000, simulated: true });
  });

  it("offers nothing when nothing is short", () => {
    expect(fixOptionsFrom(input({ recovered: true, setAsideDailyCents: 1_100 }))).toEqual([]);
  });

  it("settles for 'not short' when 'covered' would break the 30% cap, and offers no set-aside when even that would", () => {
    const thin = (perDay: number): ForecastInput => ({ ...input(), expectedByWeekday: [perDay, perDay, perDay, perDay, perDay, perDay, perDay], startBalanceCents: 300_000 });
    for (const perDay of [3_000, 5_000, 8_000, 20_000]) {
      const i = thin(perDay);
      const gap = runForecast(i).firstShortfall;
      const fix = fixOptionsFrom(i).find((f) => f.kind === "SET_ASIDE");
      if (!gap || !fix) continue;
      expect(fix.dailyAmountCents! * 10).toBeLessThanOrEqual(perDay * 3);
      expect(fix.resultingState).not.toBe("short");
    }
  });

  it("offers no set-aside when no transfer to the bank comes before the short day", () => {
    const i = input();
    const noTransfer = { ...i, outs: i.outs.filter((d) => d.kind !== "OWNER_TRANSFER"), startBalanceCents: i.startBalanceCents - 250_000 };
    const fixes = fixOptionsFrom(noTransfer);
    expect(fixes.length).toBeGreaterThan(0);
    expect(fixes.some((f) => f.kind === "SET_ASIDE")).toBe(false);
  });
});
