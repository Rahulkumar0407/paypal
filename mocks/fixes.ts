import type { AffordabilityCheck, FixOption } from "@/types";
import { buildMockForecast, MOCK_RECOVERED_NET, MOCK_TODAY } from "./forecast";

/** FAKE fix-the-gap options for the stubs. Each one's result is checked against the mock forecast in tests. */

const close12 = (f: ReturnType<typeof buildMockForecast>) => f.days.find((d) => d.date === "2026-11-12")!;

const setAside = buildMockForecast({ dueDelta: { due_owner_1109: -2_000 * 7 } });
const moveVolta = buildMockForecast({ moveDue: { due_volta_1112: "2026-11-14" } });
const loan = buildMockForecast({ extraIn: { "2026-11-12": 15_000 } });

/** For the $90 gap on Thu 12 Nov (story step 1). */
export const mockFixes: FixOption[] = [
  {
    id: "fix_set_aside",
    kind: "SET_ASIDE",
    forDate: "2026-11-12",
    title: "Set aside $20 a day until Thu 12 Nov",
    detail: "Keep $20 a day of sales in PayPal instead of moving it to your bank on Monday. That's $140 by Thursday.",
    amountCents: 14_000,
    dailyAmountCents: 2_000,
    days: 7,
    dueId: null,
    moveToOn: null,
    loanFeeCents: null,
    repayOn: null,
    simulated: false,
    resultingClosingCents: close12(setAside).closingCents,
    resultingState: close12(setAside).state,
  },
  {
    id: "fix_move_volta",
    kind: "MOVE_PAYMENT",
    forDate: "2026-11-12",
    title: "Move Volta's $300 order to Sat 14 Nov",
    detail: "Friday and Saturday sales cover it, and rent still goes out on Thursday.",
    amountCents: 30_000,
    dailyAmountCents: null,
    days: null,
    dueId: "due_volta_1112",
    moveToOn: "2026-11-14",
    loanFeeCents: null,
    repayOn: null,
    simulated: true,
    resultingClosingCents: close12(moveVolta).closingCents,
    resultingState: close12(moveVolta).state,
  },
  {
    id: "fix_gap_loan",
    kind: "GAP_LOAN",
    forDate: "2026-11-12",
    title: "Take a $150 gap loan",
    detail: "Paid in on Thursday, $153 back on Sat 14 Nov. Simulated: no real loan is made.",
    amountCents: 15_000,
    dailyAmountCents: null,
    days: null,
    dueId: null,
    moveToOn: null,
    loanFeeCents: 300,
    repayOn: "2026-11-14",
    simulated: true,
    resultingClosingCents: close12(loan).closingCents,
    resultingState: close12(loan).state,
  },
];

const afterSetAside = buildMockForecast({ extraIn: { [MOCK_TODAY]: MOCK_RECOVERED_NET }, dueDelta: { due_owner_1109: -1_100 * 7 } });

/** For the $21 left after the $72 order is paid (story step 5). */
export const mockFixesAfterRecovery: FixOption[] = [
  {
    ...mockFixes[0]!,
    id: "fix_set_aside_small",
    title: "Set aside $11 a day until Thu 12 Nov",
    detail: "Keep $11 a day of sales in PayPal instead of moving it to your bank on Monday. That's $77 by Thursday.",
    amountCents: 7_700,
    dailyAmountCents: 1_100,
    resultingClosingCents: close12(afterSetAside).closingCents,
    resultingState: close12(afterSetAside).state,
  },
  mockFixes[1]!,
  { ...mockFixes[2]!, title: "Take an $80 gap loan", detail: "Paid in on Thursday, $82 back on Sat 14 Nov. Simulated: no real loan is made.", amountCents: 8_000, loanFeeCents: 200 },
];

/** "Can I afford a $200 order on Monday?" (story step 6), from the initial forecast. */
const withOrder = buildMockForecast({ extraIn: { "2026-11-09": -20_000 } });
export const mockAffordability: AffordabilityCheck = {
  date: "2026-11-09",
  amountCents: 20_000,
  affordable: false,
  balanceAfterOnDateCents: withOrder.days.find((d) => d.date === "2026-11-09")!.closingCents,
  shortfallBefore: buildMockForecast().firstShortfall,
  shortfallAfter: withOrder.firstShortfall,
};
