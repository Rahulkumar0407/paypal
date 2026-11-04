import type { ActionProposal, Decision, GuardDecision, InboxItem, Receipt, RuleId, RuleOutcome, RuleResult } from "@/types";
import { MOCK_STORE_ID } from "./forecast";

/**
 * FAKE Margin Guard data: proposals, decisions and receipts for the demo story.
 * The real Guard is lib/guard (Person 2). Rule names and order follow AGENTS.md section 4.
 */

const RUN = "run_8f2c1a9d0e";
const RULES: readonly { id: RuleId; name: string; onFail: "BLOCK" | "ESCALATE" }[] = [
  { id: "ALREADY_PAID", name: "Already paid", onFail: "BLOCK" },
  { id: "CONSENT", name: "Consent", onFail: "BLOCK" },
  { id: "CONTACT_FREQUENCY", name: "Contact frequency", onFail: "BLOCK" },
  { id: "RISK_HOLD", name: "Risk hold", onFail: "ESCALATE" },
  { id: "DUPLICATE", name: "Duplicate action", onFail: "BLOCK" },
  { id: "MINIMUM_BALANCE", name: "Minimum balance", onFail: "BLOCK" },
  { id: "SET_ASIDE_CAP", name: "Set-aside cap", onFail: "BLOCK" },
  { id: "OWNER_APPROVAL", name: "Owner approval", onFail: "ESCALATE" },
  { id: "TOTAL_SPENDING", name: "Total spending", onFail: "ESCALATE" },
];

type RuleInput = Partial<Record<RuleId, [RuleOutcome, string]>>;

function rules(input: RuleInput): RuleResult[] {
  return RULES.map((r, i) => {
    const [outcome, reason] = input[r.id] ?? ["N/A", "Doesn't apply to this action."];
    return { number: i + 1, id: r.id, name: r.name, outcome, onFail: r.onFail, reason };
  });
}

function decide(proposal: ActionProposal, results: RuleResult[], decidedAt: string, paypalIdsChecked: string[] = []): GuardDecision {
  const failing = results.filter((r) => r.outcome === "FAIL");
  const decision: Decision = failing.some((r) => r.onFail === "BLOCK") ? "BLOCK" : failing.length > 0 ? "ESCALATE" : "APPROVE";
  const headline = decision === "APPROVE" ? null : failing.find((r) => r.onFail === decision)!;
  return {
    proposalId: proposal.id,
    decision,
    headlineRule: headline?.id ?? null,
    headlineReason: headline ? headline.reason : "Every rule passed.",
    rules: results,
    paypalIdsChecked,
    decidedAt,
    demoDate: proposal.demoDate,
  };
}

// --- Proposals -----------------------------------------------------------------

const DRAFT =
  "Hi Maya, your Loop Kids headphones and ear cushions are still waiting for you. " +
  "Here's a fresh checkout link if you'd like to finish your order: {checkout_link}. Loop Audio";

export const mockReminderProposal: ActionProposal = {
  id: "prop_reminder_1",
  storeId: MOCK_STORE_ID,
  type: "SEND_REMINDER",
  target: { kind: "ORDER", id: "ord_1243", label: "Order #1243, Maya Okafor" },
  amountCents: 7_200,
  proposedBy: { kind: "AGENT", agent: "RECOVERY" },
  idempotencyKey: `${RUN}:SEND_REMINDER:ord_1243:1`,
  sequence: 1,
  draftText: DRAFT,
  params: { orderId: "ord_1243", customerId: "cust_0001", channel: "SIMULATED_OUTBOX" },
  createdAt: "2026-11-05T09:12:00-05:00",
  demoDate: "2026-11-05",
};

export const mockSecondReminderProposal: ActionProposal = {
  ...mockReminderProposal,
  id: "prop_reminder_2",
  idempotencyKey: `${RUN}:SEND_REMINDER:ord_1243:2`,
  sequence: 2,
  createdAt: "2026-11-05T10:41:00-05:00",
};

export const mockSetAsideProposal: ActionProposal = {
  id: "prop_set_aside_1",
  storeId: MOCK_STORE_ID,
  type: "SET_ASIDE",
  target: { kind: "DUE", id: "due_owner_1109", label: "Transfer to your bank, Mon 9 Nov" },
  amountCents: 7_700,
  proposedBy: { kind: "OWNER" },
  idempotencyKey: `${RUN}:SET_ASIDE:due_owner_1109:1`,
  sequence: 1,
  draftText: null,
  params: { dailyAmountCents: 1_100, startOn: "2026-11-05", endOn: "2026-11-11", forDate: "2026-11-12" },
  createdAt: "2026-11-05T10:48:00-05:00",
  demoDate: "2026-11-05",
};

export const mockGapLoanProposal: ActionProposal = {
  id: "prop_gap_loan_1",
  storeId: MOCK_STORE_ID,
  type: "GAP_LOAN",
  target: { kind: "STORE", id: MOCK_STORE_ID, label: "Gap loan for Thu 12 Nov" },
  amountCents: 15_000,
  proposedBy: { kind: "OWNER" },
  idempotencyKey: `${RUN}:GAP_LOAN:${MOCK_STORE_ID}:1`,
  sequence: 1,
  draftText: null,
  params: { amountCents: 15_000, feeCents: 300, repayOn: "2026-11-14" },
  createdAt: "2026-11-05T09:30:00-05:00",
  demoDate: "2026-11-05",
};

export const mockPaySupplierProposal: ActionProposal = {
  id: "prop_pay_volta_1",
  storeId: MOCK_STORE_ID,
  type: "PAY_SUPPLIER",
  target: { kind: "PAYEE", id: "payee_volta", label: "Volta Audio Parts, order due Thu 12 Nov" },
  amountCents: 30_000,
  proposedBy: { kind: "OWNER" },
  idempotencyKey: `${RUN}:PAY_SUPPLIER:payee_volta:1`,
  sequence: 1,
  draftText: null,
  params: { payeeId: "payee_volta", dueId: "due_volta_1112" },
  createdAt: "2026-11-05T09:05:00-05:00",
  demoDate: "2026-11-05",
};

export const mockHoldProposal: ActionProposal = {
  id: "prop_hold_1",
  storeId: MOCK_STORE_ID,
  type: "HOLD_ORDER",
  target: { kind: "ORDER", id: "ord_1245", label: "Order #1245, Jordan Reyes" },
  amountCents: 56_700,
  proposedBy: { kind: "AGENT", agent: "RISK" },
  idempotencyKey: `${RUN}:HOLD_ORDER:ord_1245:1`,
  sequence: 1,
  draftText: null,
  params: { orderId: "ord_1245", riskFlagIds: ["risk_1"] },
  createdAt: "2026-11-05T08:02:00-05:00",
  demoDate: "2026-11-05",
};

// --- Decisions -------------------------------------------------------------------

const PAYPAL_ORDER = "5O190127TN364715T";

export const mockApproveReminder = decide(
  mockReminderProposal,
  rules({
    ALREADY_PAID: ["PASS", "PayPal shows no payment for order #1243."],
    CONSENT: ["PASS", "Maya allowed reminders when she checked out."],
    CONTACT_FREQUENCY: ["PASS", "No reminders sent for this order in the last 48 hours."],
    RISK_HOLD: ["PASS", "Order #1243 is not on risk hold."],
    DUPLICATE: ["PASS", "First reminder for this order."],
    OWNER_APPROVAL: ["PASS", "$72.00 is under the $100 owner-approval line."],
  }),
  "2026-11-05T09:12:04-05:00",
);

export const mockBlockSecondReminder = decide(
  mockSecondReminderProposal,
  rules({
    ALREADY_PAID: ["FAIL", `PayPal shows order ${PAYPAL_ORDER} captured at 10:37 on Thu 5 Nov.`],
    CONSENT: ["PASS", "Maya allowed reminders when she checked out."],
    CONTACT_FREQUENCY: ["PASS", "1 reminder sent in the last 48 hours. The limit is 2."],
    RISK_HOLD: ["PASS", "Order #1243 is not on risk hold."],
    DUPLICATE: ["PASS", "Second attempt, so it has a new key."],
    OWNER_APPROVAL: ["PASS", "$72.00 is under the $100 owner-approval line."],
  }),
  "2026-11-05T10:41:02-05:00",
  [PAYPAL_ORDER],
);

export const mockApproveSetAside = decide(
  mockSetAsideProposal,
  rules({
    DUPLICATE: ["PASS", "First set-aside for Thu 12 Nov."],
    MINIMUM_BALANCE: ["PASS", "No day in the next 14 drops below your $100 minimum."],
    SET_ASIDE_CAP: ["PASS", "$11 a day is 6% of Monday's expected sales. The cap is 30%."],
    OWNER_APPROVAL: ["PASS", "$77.00 in total is under the $100 owner-approval line."],
  }),
  "2026-11-05T10:48:01-05:00",
);

export const mockEscalateGapLoan = decide(
  mockGapLoanProposal,
  rules({
    DUPLICATE: ["PASS", "First gap loan this month."],
    MINIMUM_BALANCE: ["PASS", "Repaying $153 on Sat 14 Nov keeps every day above $100."],
    OWNER_APPROVAL: ["FAIL", "Gap loans always need your OK."],
  }),
  "2026-11-05T09:30:01-05:00",
);

export const mockEscalatePaySupplier = decide(
  mockPaySupplierProposal,
  rules({
    DUPLICATE: ["PASS", "No payment to Volta yet for the order due Thu 12 Nov."],
    MINIMUM_BALANCE: ["PASS", "Paying today keeps every day above your $100 minimum."],
    OWNER_APPROVAL: ["FAIL", "$300.00 is over the $100 owner-approval line."],
  }),
  "2026-11-05T09:05:02-05:00",
);

export const mockEscalateHold = decide(
  mockHoldProposal,
  rules({
    DUPLICATE: ["PASS", "Order #1245 has not been held before."],
    OWNER_APPROVAL: ["FAIL", "$567.00 is over the $100 owner-approval line."],
  }),
  "2026-11-05T08:02:01-05:00",
);

// --- Receipts ------------------------------------------------------------------------

function receipt(number: number, proposal: ActionProposal, decision: GuardDecision, extra: Partial<Receipt> = {}): Receipt {
  return {
    id: `rcpt_${String(number).padStart(4, "0")}`,
    storeId: MOCK_STORE_ID,
    number,
    proposal,
    decision,
    events: [{ kind: "DECIDED", at: decision.decidedAt, demoDate: decision.demoDate, detail: `Guard: ${decision.decision}`, paypalIds: decision.paypalIdsChecked }],
    paypalIds: { checked: decision.paypalIdsChecked, created: [] },
    ...extra,
  };
}

export const mockReceiptReminderApproved = receipt(7, mockReminderProposal, mockApproveReminder, {
  events: [
    { kind: "DECIDED", at: "2026-11-05T09:12:04-05:00", demoDate: "2026-11-05", detail: "Guard: APPROVE", paypalIds: [] },
    { kind: "EXECUTED", at: "2026-11-05T09:12:06-05:00", demoDate: "2026-11-05", detail: "Reminder placed in the outbox with a fresh PayPal checkout link (simulated email).", paypalIds: [PAYPAL_ORDER] },
  ],
  paypalIds: { checked: [], created: [PAYPAL_ORDER] },
});
export const mockReceiptReminderBlocked = receipt(9, mockSecondReminderProposal, mockBlockSecondReminder);
export const mockReceiptSetAsideApproved = receipt(10, mockSetAsideProposal, mockApproveSetAside);
export const mockReceiptGapLoanEscalated = receipt(8, mockGapLoanProposal, mockEscalateGapLoan);
export const mockReceiptPaySupplierEscalated = receipt(6, mockPaySupplierProposal, mockEscalatePaySupplier);
export const mockReceiptHoldEscalated = receipt(5, mockHoldProposal, mockEscalateHold);

export const mockReceipts: Receipt[] = [
  mockReceiptSetAsideApproved,
  mockReceiptReminderBlocked,
  mockReceiptGapLoanEscalated,
  mockReceiptReminderApproved,
  mockReceiptPaySupplierEscalated,
  mockReceiptHoldEscalated,
];

export const mockInbox: InboxItem[] = [
  { receipt: mockReceiptGapLoanEscalated, status: "WAITING" },
  { receipt: mockReceiptPaySupplierEscalated, status: "WAITING" },
  { receipt: mockReceiptHoldEscalated, status: "WAITING" },
  { receipt: mockReceiptSetAsideApproved, status: "DONE" },
  { receipt: mockReceiptReminderBlocked, status: "DONE" },
  { receipt: mockReceiptReminderApproved, status: "DONE" },
];
