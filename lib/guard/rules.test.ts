import { describe, expect, it } from "vitest";
import type { ActionProposal, RuleId, RuleOutcome } from "@/types";
import { previewDemoForecast } from "@/lib/forecast";
import { decide, judge, recheckBlockingRules, runRules, type GuardContext, type OrderFacts } from "./rules";

/**
 * The 9 rules, one at a time, with fixed facts. Rules 6 and 7 use the demo store's real forecast:
 * after the $72 payment, Thu 12 Nov closes at $79.00 ($21 short); with $11 a day set aside it closes at $156.00.
 */

const TODAY = "2026-11-05";
const AT = { decidedAt: "2026-11-05T10:00:00-05:00", demoDate: TODAY };
const MAYA: OrderFacts = { id: "ord_1258", number: 1258, status: "ABANDONED", riskHold: false, totalCents: 7_200, paypalOrderId: null, customerName: "Maya Okafor", contactConsent: true };

const recovered = previewDemoForecast({ recovered: true });
const setAside = previewDemoForecast({ recovered: true, setAsideDailyCents: 1_100 });
const start = previewDemoForecast();

const ctx = (over: Partial<GuardContext> = {}): GuardContext => ({
  order: MAYA,
  orderMissing: false,
  paypal: { kind: "NO_PAYPAL_ORDER" },
  remindersLast48h: 0,
  duplicate: false,
  forecast: { kind: "NOT_NEEDED" },
  spentLast7DaysCents: 0,
  ...over,
});
const ready = (before = recovered, after = setAside): GuardContext["forecast"] => ({ kind: "READY", before, after });

const base = {
  storeId: "st_test",
  proposedBy: { kind: "OWNER" as const },
  sequence: 1,
  draftText: null,
  createdAt: AT.decidedAt,
  demoDate: TODAY,
};
const reminder = (over: Partial<ActionProposal> = {}): ActionProposal => ({
  ...base,
  id: "prop_reminder",
  type: "SEND_REMINDER",
  target: { kind: "ORDER", id: "ord_1258", label: "Order #1258, Maya Okafor" },
  amountCents: 7_200,
  proposedBy: { kind: "AGENT", agent: "RECOVERY" },
  idempotencyKey: "run_a:SEND_REMINDER:ord_1258:1",
  params: { orderId: "ord_1258", customerId: "cust_1", channel: "SIMULATED_OUTBOX" },
  ...over,
} as ActionProposal);
const setAsideProposal = (daily: number, endOn = "2026-11-11"): ActionProposal => ({
  ...base,
  id: "prop_set_aside",
  type: "SET_ASIDE",
  target: { kind: "STORE", id: "st_test", label: "Set aside for Thu 12 Nov" },
  amountCents: daily * 7,
  idempotencyKey: "run_a:SET_ASIDE:st_test:1",
  params: { dailyAmountCents: daily, startOn: TODAY, endOn, forDate: "2026-11-12" },
});
const gapLoan = (amountCents: number): ActionProposal => ({
  ...base,
  id: "prop_loan",
  type: "GAP_LOAN",
  target: { kind: "STORE", id: "st_test", label: "Gap loan for Thu 12 Nov" },
  amountCents,
  idempotencyKey: "run_a:GAP_LOAN:st_test:1",
  params: { amountCents, feeCents: 300, repayOn: "2026-11-14" },
});
const refund: ActionProposal = {
  ...base,
  id: "prop_refund",
  type: "REFUND",
  target: { kind: "ORDER", id: "ord_1258", label: "Order #1258" },
  amountCents: 7_200,
  idempotencyKey: "run_a:REFUND:ord_1258:1",
  params: { orderId: "ord_1258", captureId: "CAP1" },
};
const hold: ActionProposal = {
  ...base,
  id: "prop_hold",
  type: "HOLD_ORDER",
  target: { kind: "ORDER", id: "ord_1260", label: "Order #1260, Jordan Reyes" },
  amountCents: 56_700,
  proposedBy: { kind: "AGENT", agent: "RISK" },
  idempotencyKey: "run_a:HOLD_ORDER:ord_1260:1",
  params: { orderId: "ord_1260", riskFlagIds: [] },
};

const rule = (p: ActionProposal, c: GuardContext, id: RuleId) => runRules(p, c).find((r) => r.id === id)!;
const outcomes = (p: ActionProposal, c: GuardContext): RuleOutcome[] => runRules(p, c).map((r) => r.outcome);

describe("rule 1: already paid", () => {
  it("passes for an order nobody has paid", () => {
    expect(rule(reminder(), ctx(), "ALREADY_PAID")).toMatchObject({ outcome: "PASS", reason: "Order #1258 hasn't been paid." });
    expect(rule(reminder(), ctx({ paypal: { kind: "CHECKED", paypalOrderId: "PP1", status: "CREATED" } }), "ALREADY_PAID").reason).toBe(
      "PayPal shows order #1258 not paid yet.",
    );
  });
  it("blocks when PayPal shows it paid, or our records do", () => {
    expect(rule(reminder(), ctx({ paypal: { kind: "CHECKED", paypalOrderId: "PP1", status: "COMPLETED" } }), "ALREADY_PAID")).toMatchObject({
      outcome: "FAIL",
      onFail: "BLOCK",
      reason: "PayPal shows order #1258 already paid (PayPal order PP1).",
    });
    expect(rule(reminder(), ctx({ order: { ...MAYA, status: "CAPTURED" } }), "ALREADY_PAID").outcome).toBe("FAIL");
  });
  it("blocks when PayPal can't be reached (fails closed)", () => {
    expect(rule(reminder(), ctx({ paypal: { kind: "UNREACHABLE", paypalOrderId: "PP1" } }), "ALREADY_PAID")).toMatchObject({
      outcome: "FAIL",
      reason: "Couldn't reach PayPal to check order #1258, so it's stopped to be safe.",
    });
  });
});

describe("rule 2: consent", () => {
  it("passes when the customer agreed to be contacted", () => {
    expect(rule(reminder(), ctx(), "CONSENT")).toMatchObject({ outcome: "PASS", reason: "Maya Okafor agreed to hear from the shop." });
  });
  it("blocks when they didn't", () => {
    const hana = { ...MAYA, customerName: "Hana Sato", contactConsent: false };
    expect(rule(reminder(), ctx({ order: hana }), "CONSENT")).toMatchObject({ outcome: "FAIL", onFail: "BLOCK", reason: "Hana Sato hasn't agreed to hear from the shop." });
  });
});

describe("rule 3: contact frequency", () => {
  it("passes with fewer than 2 reminders in the last 48 hours", () => {
    expect(rule(reminder(), ctx({ remindersLast48h: 1 }), "CONTACT_FREQUENCY")).toMatchObject({ outcome: "PASS" });
  });
  it("blocks the third reminder, and when the count can't be checked", () => {
    expect(rule(reminder(), ctx({ remindersLast48h: 2 }), "CONTACT_FREQUENCY")).toMatchObject({
      outcome: "FAIL",
      reason: "Maya Okafor already got 2 reminders about order #1258 in the last 48 hours.",
    });
    expect(rule(reminder(), ctx({ remindersLast48h: null }), "CONTACT_FREQUENCY").outcome).toBe("FAIL");
  });
});

describe("rule 4: risk hold", () => {
  it("passes for an order that isn't held", () => {
    expect(rule(refund, ctx(), "RISK_HOLD")).toMatchObject({ outcome: "PASS", reason: "Order #1258 isn't on risk hold." });
  });
  it("asks the owner when the order is held", () => {
    expect(rule(reminder(), ctx({ order: { ...MAYA, riskHold: true } }), "RISK_HOLD")).toMatchObject({ outcome: "FAIL", onFail: "ESCALATE" });
  });
});

describe("rule 5: duplicate action", () => {
  it("passes the first time, blocks a repeat, and blocks when it can't check", () => {
    expect(rule(reminder(), ctx(), "DUPLICATE").outcome).toBe("PASS");
    expect(rule(reminder(), ctx({ duplicate: true }), "DUPLICATE")).toMatchObject({ outcome: "FAIL", onFail: "BLOCK" });
    expect(rule(reminder(), ctx({ duplicate: null }), "DUPLICATE").outcome).toBe("FAIL");
  });
});

describe("rule 6: minimum balance", () => {
  it("passes when no day ends lower and below the minimum", () => {
    expect(rule(setAsideProposal(1_100), ctx({ forecast: ready() }), "MINIMUM_BALANCE")).toMatchObject({
      outcome: "PASS",
      reason: "Every day stays at or above your $100.00 minimum.",
    });
  });
  it("passes when a day is already short but the action doesn't make it worse", () => {
    expect(rule(gapLoan(1_000), ctx({ forecast: ready(start, start) }), "MINIMUM_BALANCE")).toMatchObject({
      outcome: "PASS",
      reason: "Thu 12 Nov is already short, and this doesn't make it worse.",
    });
  });
  it("blocks when a day would end lower than before and below the minimum", () => {
    expect(rule(gapLoan(1_000), ctx({ forecast: ready(recovered, start) }), "MINIMUM_BALANCE")).toMatchObject({
      outcome: "FAIL",
      onFail: "BLOCK",
      reason: "It would leave Thu 12 Nov at $10.00, below your $100.00 minimum.",
    });
  });
  it("blocks when the forecast can't be worked out (fails closed)", () => {
    expect(rule(gapLoan(1_000), ctx({ forecast: { kind: "FAILED" } }), "MINIMUM_BALANCE").outcome).toBe("FAIL");
  });
});

describe("rule 7: set-aside cap", () => {
  it("passes within 30% of every day's expected sales, up to the exact cent", () => {
    expect(rule(setAsideProposal(1_100), ctx({ forecast: ready() }), "SET_ASIDE_CAP")).toMatchObject({
      outcome: "PASS",
      reason: "$11.00 a day is within 30% of each day's expected sales (lowest: Tue 10 Nov, $186.55).",
    });
    // 30% of $186.55 is $55.965.
    expect(rule(setAsideProposal(5_596), ctx({ forecast: ready() }), "SET_ASIDE_CAP").outcome).toBe("PASS");
  });
  it("blocks a day over 30%, and days outside the forecast", () => {
    expect(rule(setAsideProposal(5_597), ctx({ forecast: ready() }), "SET_ASIDE_CAP")).toMatchObject({
      outcome: "FAIL",
      reason: "$55.97 a day is more than 30% of Tue 10 Nov's expected sales ($186.55).",
    });
    expect(rule(setAsideProposal(1_100, "2026-11-30"), ctx({ forecast: ready() }), "SET_ASIDE_CAP").outcome).toBe("FAIL");
  });
});

describe("rule 8: owner approval", () => {
  it("passes up to and including $100.00", () => {
    expect(rule(reminder({ amountCents: 10_000 }), ctx(), "OWNER_APPROVAL")).toMatchObject({ outcome: "PASS", reason: "$100.00 is within the $100.00 NeverShort can do on its own." });
  });
  it("asks the owner above $100.00, and always for loans, moved payments and refunds", () => {
    expect(rule(reminder({ amountCents: 10_001 }), ctx(), "OWNER_APPROVAL")).toMatchObject({ outcome: "FAIL", onFail: "ESCALATE" });
    expect(rule(gapLoan(100), ctx({ forecast: ready() }), "OWNER_APPROVAL").reason).toBe("Loans always need your OK.");
    expect(rule(refund, ctx({ forecast: ready() }), "OWNER_APPROVAL").reason).toBe("Refunds always need your OK.");
  });
});

describe("rule 9: total spending", () => {
  const payVolta = (amountCents: number): ActionProposal => ({
    ...base,
    id: "prop_pay",
    type: "PAY_SUPPLIER",
    target: { kind: "PAYEE", id: "volta", label: "Volta Audio Parts" },
    amountCents,
    idempotencyKey: "run_a:PAY_SUPPLIER:volta:1",
    params: { payeeId: "volta", dueId: null },
  });

  it("passes while the week's spending stays at or under $500, counting this action", () => {
    expect(rule(payVolta(9_000), ctx({ spentLast7DaysCents: 41_000, forecast: ready() }), "TOTAL_SPENDING")).toMatchObject({
      outcome: "PASS",
      reason: "That makes $500.00 in 7 days with this one, against a limit of $500.00.",
    });
  });

  it("asks the owner when many small actions add up past $500, even though each is under $100", () => {
    const small = payVolta(9_000);
    const r = rule(small, ctx({ spentLast7DaysCents: 45_000, forecast: ready() }), "TOTAL_SPENDING");
    expect(r).toMatchObject({ outcome: "FAIL", onFail: "ESCALATE", reason: "That makes $540.00 in 7 days with this one, against a limit of $500.00, so you decide." });
    expect(rule(small, ctx({ spentLast7DaysCents: 45_000, forecast: ready() }), "OWNER_APPROVAL").outcome).toBe("PASS");
    expect(judge(small, ctx({ spentLast7DaysCents: 45_000, forecast: ready() }), AT)).toMatchObject({ decision: "ESCALATE", headlineRule: "TOTAL_SPENDING" });
  });

  it("asks the owner when the total can't be added up (fails safe), and doesn't apply to reminders, set-asides or holds", () => {
    expect(rule(payVolta(1_000), ctx({ spentLast7DaysCents: null, forecast: ready() }), "TOTAL_SPENDING").outcome).toBe("FAIL");
    for (const p of [reminder(), setAsideProposal(1_100), hold]) expect(rule(p, ctx({ spentLast7DaysCents: 99_999 }), "TOTAL_SPENDING").outcome).toBe("N/A");
  });
});

describe("which rules apply", () => {
  it("marks rules that don't apply as N/A, in order, all 9 every time", () => {
    expect(outcomes(reminder(), ctx())).toEqual(["PASS", "PASS", "PASS", "PASS", "PASS", "N/A", "N/A", "PASS", "N/A"]);
    expect(outcomes(hold, ctx())).toEqual(["N/A", "N/A", "N/A", "N/A", "PASS", "N/A", "N/A", "FAIL", "N/A"]);
    expect(runRules(hold, ctx())[0]!.reason).toBe("Doesn't apply to a hold.");
    expect(runRules(refund, ctx({ forecast: ready() })).map((r) => r.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
});

describe("the decision", () => {
  it("BLOCK beats ESCALATE beats APPROVE, headed by the lowest-numbered rule behind it", () => {
    const results = runRules(reminder({ amountCents: 20_000 }), ctx({ order: { ...MAYA, riskHold: true, contactConsent: false }, remindersLast48h: 2 }));
    expect(results.filter((r) => r.outcome === "FAIL").map((r) => r.number)).toEqual([2, 3, 4, 8]);
    expect(decide(results)).toMatchObject({ decision: "BLOCK", headlineRule: "CONSENT" });
    expect(decide(runRules(reminder({ amountCents: 20_000 }), ctx({ order: { ...MAYA, riskHold: true } })))).toMatchObject({
      decision: "ESCALATE",
      headlineRule: "RISK_HOLD",
    });
    expect(decide(runRules(reminder(), ctx()))).toEqual({ decision: "APPROVE", headlineRule: null, headlineReason: "Every rule passed." });
  });

  it("lists the PayPal order it checked", () => {
    expect(judge(reminder(), ctx({ paypal: { kind: "CHECKED", paypalOrderId: "PP1", status: "CREATED" } }), AT).paypalIdsChecked).toEqual(["PP1"]);
  });
});

describe("the demo story's decisions", () => {
  it("step 2: the $72 reminder is approved", () => {
    expect(judge(reminder(), ctx(), AT)).toMatchObject({ decision: "APPROVE", headlineRule: null });
  });

  it("step 4: a second reminder after the order is paid is blocked, with Already paid the only failing rule", () => {
    const second = reminder({ id: "prop_reminder_2", sequence: 2, idempotencyKey: "run_a:SEND_REMINDER:ord_1258:2" });
    const paid = ctx({ order: { ...MAYA, status: "CAPTURED", paypalOrderId: "PP1" }, paypal: { kind: "CHECKED", paypalOrderId: "PP1", status: "COMPLETED" }, remindersLast48h: 1 });
    const d = judge(second, paid, AT);
    expect(d).toMatchObject({ decision: "BLOCK", headlineRule: "ALREADY_PAID", paypalIdsChecked: ["PP1"] });
    expect(d.rules.filter((r) => r.outcome === "FAIL").map((r) => r.id)).toEqual(["ALREADY_PAID"]);
  });

  it("step 5: setting aside $11 a day ($77) is approved", () => {
    const d = judge(setAsideProposal(1_100), ctx({ order: null, forecast: ready() }), AT);
    expect(d).toMatchObject({ decision: "APPROVE" });
    expect(d.rules.map((r) => r.outcome)).toEqual(["N/A", "N/A", "N/A", "N/A", "PASS", "PASS", "PASS", "PASS", "N/A"]);
  });

  it("a gap loan always waits for the owner, however small", () => {
    for (const amount of [100, 15_000]) {
      expect(judge(gapLoan(amount), ctx({ order: null, forecast: ready(start, start) }), AT)).toMatchObject({
        decision: "ESCALATE",
        headlineRule: "OWNER_APPROVAL",
        headlineReason: "Loans always need your OK.",
      });
    }
  });
});

describe("the re-check before an approved action runs", () => {
  it("ignores ESCALATE rules and returns the first BLOCK rule that now fails", () => {
    expect(recheckBlockingRules(reminder({ amountCents: 20_000 }), ctx({ order: { ...MAYA, riskHold: true } }))).toBeNull();
    expect(recheckBlockingRules(reminder(), ctx({ order: { ...MAYA, status: "CAPTURED" }, remindersLast48h: 2 }))?.id).toBe("ALREADY_PAID");
  });
});
