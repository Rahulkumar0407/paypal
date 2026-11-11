import { describe, expect, it } from "vitest";
import { inputFromRows, runForecast, withAdjustments, type ForecastInput } from "./engine";
import { fixOptionsFrom } from "./fixes";
import { demoScenarioRows, type DemoScenario } from "./load";

const TODAY = "2026-11-05";
const input = (scenario: DemoScenario = {}) => inputFromRows(demoScenarioRows("st_fix", TODAY, scenario), "st_fix", TODAY);
const BEANS = "st_fix_payee_beans_due_2026-11-12";

/** The café with Penny also moving $500 to her bank on Mon 9 Nov: the set-aside fix keeps some of it back. */
function withTransfer(i: ForecastInput = input()): ForecastInput {
  const template = i.outs[0]!;
  const transfer = { ...template, id: "transfer_1109", payeeId: "owner", payeeName: "Transfer to your bank", label: "your transfer to the bank", kind: "OWNER_TRANSFER" as const, dueOn: "2026-11-09", amountCents: 50_000, readyCents: 0, status: "SCHEDULED" as const, movedFromOn: null, simulated: false };
  return { ...i, outs: [...i.outs, transfer], startBalanceCents: i.startBalanceCents + 50_000 };
}

describe("fix the gap on the demo store", () => {
  it("offers two ways to cover the $120 gap on Thu 12 Nov (no transfer to the bank to set aside from)", () => {
    expect(fixOptionsFrom(input()).map((f) => [f.kind, f.title, f.amountCents, f.resultingClosingCents, f.resultingState, f.simulated])).toEqual([
      ["MOVE_PAYMENT", "Move Bean There's $400 payment to Sat 14 Nov", 40_000, 48_000, "covered", true],
      ["GAP_LOAN", "Take a $120 short-term loan", 12_000, 20_000, "tight", true],
    ]);
  });

  it("with a transfer to the bank before the short day, also offers to set a little aside each day", () => {
    const [setAside] = fixOptionsFrom(withTransfer());
    expect(setAside).toMatchObject({
      id: "fix_set_aside",
      kind: "SET_ASIDE",
      dailyAmountCents: 3_200,
      days: 7,
      amountCents: 22_400,
      resultingState: "covered",
      detail: "Keep $32 a day of sales in PayPal instead of moving it to your bank on Mon 9 Nov. That's $224 by Thu 12 Nov.",
    });
  });

  it("keeps every set-aside within 30% of each day's expected sales", () => {
    const i = withTransfer();
    const fix = fixOptionsFrom(i).find((f) => f.kind === "SET_ASIDE")!;
    for (const d of runForecast(i).days.slice(0, fix.days!)) expect(fix.dailyAmountCents! * 10).toBeLessThanOrEqual(d.expectedInCents * 3);
  });

  it("moves the payment to the first later day that stays covered, with every day after it covered too", () => {
    const fix = fixOptionsFrom(input()).find((f) => f.kind === "MOVE_PAYMENT")!;
    expect(fix).toMatchObject({ dueId: BEANS, moveToOn: "2026-11-14" });
    const run = runForecast(withAdjustments(input(), [{ kind: "MOVE_DUE", dueId: fix.dueId!, toOn: fix.moveToOn! }]));
    expect(run.firstShortfall).toBeNull();
    expect(run.days.find((d) => d.date === "2026-11-14")!.state).toBe("covered");
  });

  it("lends the exact gap at a 2% fee, so the day ends right at the minimum", () => {
    const loan = fixOptionsFrom(input()).find((f) => f.kind === "GAP_LOAN")!;
    expect(loan).toMatchObject({ amountCents: 12_000, loanFeeCents: 240, resultingClosingCents: 20_000, simulated: true });
  });

  it("offers nothing when nothing is short (Ivory & Vow has paid)", () => {
    expect(fixOptionsFrom(input({ recovered: true }))).toEqual([]);
  });

  it("settles for 'not short' when 'covered' would break the 30% cap, and offers no set-aside when even that would", () => {
    const thin = (perDay: number): ForecastInput => ({ ...withTransfer(), expectedByWeekday: [perDay, perDay, perDay, perDay, perDay, perDay, perDay], startBalanceCents: 100_000 });
    for (const perDay of [3_000, 5_000, 8_000, 20_000]) {
      const i = thin(perDay);
      const gap = runForecast(i).firstShortfall;
      const fix = fixOptionsFrom(i).find((f) => f.kind === "SET_ASIDE");
      if (!gap || !fix) continue;
      expect(fix.dailyAmountCents! * 10).toBeLessThanOrEqual(perDay * 3);
      expect(fix.resultingState).not.toBe("short");
    }
  });
});
