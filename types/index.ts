/**
 * Shared data shapes between modules. Modules talk to each other only through these types.
 * Shared types used across modules.
 *
 * Conventions (AGENTS.md section 9):
 * - Money is always integer cents (`Cents`). Never floats.
 * - Business dates are `IsoDate` strings ('YYYY-MM-DD') in the store's time zone.
 * - Timestamps (`IsoDateTime`) are ISO 8601 strings with an offset, used for audit trails only.
 */

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** Integer number of US cents. $90.00 is 9000. */
export type Cents = number;
/** A business date, 'YYYY-MM-DD', in the store's time zone. */
export type IsoDate = string;
/** An ISO 8601 timestamp with offset, e.g. '2026-11-05T10:42:00-05:00'. */
export type IsoDateTime = string;
/** One visitor's private copy of the demo store, e.g. 'st_3f9c2a71b0d4'. */
export type StoreId = string;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export interface StoreSettings {
  storeId: StoreId;
  name: string;
  currency: "USD";
  timezone: string;
  /** The owner's comfort line. A day below it is "short". */
  minimumBalanceCents: Cents;
  /** A day at or above the minimum but within this margin of it is "tight". */
  tightMarginCents: Cents;
  /** Starting cash balance at the start of openingBalanceOn. */
  openingBalanceCents: Cents;
  openingBalanceOn: IsoDate;
  openingBalanceSource: string;
  /** Setup form answers. */
  whatYouSell: string;
  supplierPaymentMethod: "PAYPAL_PAYOUTS" | "BANK_TRANSFER" | "CARD";
  busySeasons: string[];
  isDemo?: boolean;
}

export interface Product {
  id: string;
  storeId: StoreId;
  sku: string;
  name: string;
  description: string;
  priceCents: Cents;
  costCents: Cents;
}

export type OrderStatus = "ABANDONED" | "FAILED" | "PENDING" | "CAPTURED" | "REFUNDED";

export interface Order {
  id: string;
  storeId: StoreId;
  number: number;
  customerId: string;
  customerName: string;
  status: OrderStatus;
  placedOn: IsoDate;
  totalCents: Cents;
  /** PayPal's fee, once captured. */
  feeCents: Cents | null;
  /** What actually arrived after the fee, once captured. */
  netCents: Cents | null;
  failedAttempts: number;
  riskHold: boolean;
  paypalOrderId: string | null;
  paypalCaptureId: string | null;
  simulated: boolean;
}

// ---------------------------------------------------------------------------
// Money out, forecast, fixes (lib/forecast, Person 3)
// ---------------------------------------------------------------------------

export type DayState = "covered" | "tight" | "short";
export type Confidence = "high" | "medium" | "low";
export type PayeeKind = "SUPPLIER" | "BILL" | "OWNER_TRANSFER" | "LOAN";

/** A known payment going out on a date. */
export interface Due {
  id: string;
  storeId: StoreId;
  payeeId: string;
  payeeName: string;
  /** How the item reads inside a sentence: "the supplier order", "rent". */
  label: string;
  kind: PayeeKind;
  dueOn: IsoDate;
  amountCents: Cents;
  /** How much of it the forecast says will be ready on the day. */
  readyCents: Cents;
  status: "SCHEDULED" | "PAID" | "MOVED" | "CANCELLED";
  /** Set when the payment was moved; the move itself is simulated. */
  movedFromOn: IsoDate | null;
  simulated: boolean;
}

/** A payee found from payment history ("We think Volta is paid ~$300 every 10 days"). */
export interface RecurringPayee {
  id: string;
  storeId: StoreId;
  name: string;
  kind: PayeeKind;
  typicalAmountCents: Cents;
  cadence: { every: "DAYS"; days: number } | { every: "MONTH"; dayOfMonth: number } | { every: "WEEKS"; weeks: number; weekday: number };
  status: "DETECTED" | "CONFIRMED" | "DISMISSED";
  /** Plain sentence, e.g. "We think Volta Audio Parts is paid about $300 every 10 days." */
  summary: string;
  nextDueOn: IsoDate | null;
}

export interface ForecastDay {
  date: IsoDate;
  isToday: boolean;
  openingCents: Cents;
  /** Expected sales for the day (weekday-based average), after PayPal fees. */
  expectedInCents: Cents;
  /** Expected money left out because the order is on risk hold. */
  heldInCents: Cents;
  /** Known money out: the dues listed below. */
  knownOutCents: Cents;
  closingCents: Cents;
  state: DayState;
  /** 0 unless the day is short: minimum balance minus closing balance. */
  shortByCents: Cents;
  dues: Due[];
}

export interface Shortfall {
  date: IsoDate;
  amountCents: Cents;
  dueIds: string[];
  /** Plain words, e.g. "the supplier order and rent land the same day". */
  reason: string;
}

export interface Forecast {
  storeId: StoreId;
  asOf: IsoDate;
  /** Exactly 14 days, starting with today. */
  days: ForecastDay[];
  firstShortfall: Shortfall | null;
  confidence: Confidence;
  confidenceReason: string;
  minimumBalanceCents: Cents;
  tightMarginCents: Cents;
}

/** The one-sentence forecast that opens the home screen. Built by code, never by AI. */
export interface Headline {
  text: string;
  tone: DayState;
}

export type FixKind = "SET_ASIDE" | "MOVE_PAYMENT" | "GAP_LOAN";

/** One way to close a shortfall. At most three are offered. */
export interface FixOption {
  id: string;
  kind: FixKind;
  forDate: IsoDate;
  title: string;
  detail: string;
  /** Total money involved: set-aside total, moved payment, or loan amount. */
  amountCents: Cents;
  dailyAmountCents: Cents | null;
  days: number | null;
  dueId: string | null;
  moveToOn: IsoDate | null;
  loanFeeCents: Cents | null;
  repayOn: IsoDate | null;
  simulated: boolean;
  resultingClosingCents: Cents;
  resultingState: DayState;
}

/** Answer to "Can I afford $X on <date>?", calculated by code. */
export interface AffordabilityCheck {
  date: IsoDate;
  amountCents: Cents;
  affordable: boolean;
  balanceAfterOnDateCents: Cents;
  shortfallBefore: Shortfall | null;
  shortfallAfter: Shortfall | null;
}

// ---------------------------------------------------------------------------
// Proposals and the Margin Guard (lib/guard)
// ---------------------------------------------------------------------------

export type ActionType =
  | "SEND_REMINDER"
  | "SET_ASIDE"
  | "MOVE_PAYMENT"
  | "GAP_LOAN"
  | "PAY_SUPPLIER"
  | "REFUND"
  | "HOLD_ORDER";

export interface ActionParamsMap {
  SEND_REMINDER: { orderId: string; customerId: string; channel: "SIMULATED_OUTBOX" };
  SET_ASIDE: { dailyAmountCents: Cents; startOn: IsoDate; endOn: IsoDate; forDate: IsoDate };
  MOVE_PAYMENT: { dueId: string; fromOn: IsoDate; toOn: IsoDate };
  GAP_LOAN: { amountCents: Cents; feeCents: Cents; repayOn: IsoDate };
  PAY_SUPPLIER: { payeeId: string; dueId: string | null };
  REFUND: { orderId: string; captureId: string | null };
  HOLD_ORDER: { orderId: string; riskFlagIds: string[] };
}

export type Proposer =
  | { kind: "AGENT"; agent: "RECOVERY" | "RISK" | "ASK" }
  | { kind: "OWNER" };

interface ProposalBase {
  id: string;
  storeId: StoreId;
  target: { kind: "ORDER" | "DUE" | "PAYEE" | "STORE"; id: string; label: string };
  /** The money the action moves or asks for (Guard rule 8). */
  amountCents: Cents;
  proposedBy: Proposer;
  /** `<demo run id>:<action type>:<target id>:<sequence>` (AGENTS.md section 4). */
  idempotencyKey: string;
  sequence: number;
  /** AI-drafted text, e.g. the reminder message. */
  draftText: string | null;
  createdAt: IsoDateTime;
  demoDate: IsoDate;
}

/** An action an agent or the owner wants. Nothing happens until the Guard decides. */
export type ActionProposal = {
  [K in ActionType]: ProposalBase & { type: K; params: ActionParamsMap[K] };
}[ActionType];

export type Decision = "APPROVE" | "ESCALATE" | "BLOCK";
export type RuleOutcome = "PASS" | "FAIL" | "N/A";
export type RuleId =
  | "ALREADY_PAID"
  | "CONSENT"
  | "CONTACT_FREQUENCY"
  | "RISK_HOLD"
  | "DUPLICATE"
  | "MINIMUM_BALANCE"
  | "SET_ASIDE_CAP"
  | "OWNER_APPROVAL"
  | "TOTAL_SPENDING";

export interface RuleResult {
  /** 1 to 9, as numbered in AGENTS.md section 4. */
  number: number;
  id: RuleId;
  name: string;
  outcome: RuleOutcome;
  /** What a FAIL of this rule produces. */
  onFail: "BLOCK" | "ESCALATE";
  /** Plain reason, e.g. "PayPal shows order 5O190127TN364715T captured on Thu 5 Nov." */
  reason: string;
}

export interface GuardDecision {
  proposalId: string;
  decision: Decision;
  /** The lowest-numbered failing rule that produced the decision, or null for APPROVE. */
  headlineRule: RuleId | null;
  headlineReason: string;
  /** Always all 9 rules, in order. */
  rules: RuleResult[];
  paypalIdsChecked: string[];
  decidedAt: IsoDateTime;
  demoDate: IsoDate;
}

export type ReceiptEventKind =
  | "DECIDED"
  | "OWNER_APPROVED"
  | "OWNER_REJECTED"
  | "RECHECK_BLOCKED"
  | "EXECUTED"
  | "EXECUTION_FAILED";

export interface ReceiptEvent {
  kind: ReceiptEventKind;
  at: IsoDateTime;
  demoDate: IsoDate;
  detail: string;
  paypalIds: string[];
}

/** The append-only record of one Guard decision. Printed as a thermal receipt. */
export interface Receipt {
  id: string;
  storeId: StoreId;
  number: number;
  proposal: ActionProposal;
  decision: GuardDecision;
  events: ReceiptEvent[];
  paypalIds: { checked: string[]; created: string[] };
}

/** An item in the owner's approval inbox. */
export interface InboxItem {
  receipt: Receipt;
  status: "WAITING" | "APPROVED" | "REJECTED" | "DONE";
}

// ---------------------------------------------------------------------------
// Recovery (lib/recovery, Person 3)
// ---------------------------------------------------------------------------

export interface RecoveryCandidate {
  orderId: string;
  orderNumber: number;
  customerId: string;
  customerName: string;
  status: "ABANDONED" | "FAILED";
  amountCents: Cents;
  lastActivityOn: IsoDate;
  contactConsent: boolean;
  remindersSentLast48h: number;
}

/** A reminder written to the simulated outbox after the Guard approves it. */
export interface OutboxMessage {
  id: string;
  storeId: StoreId;
  proposalId: string;
  orderId: string;
  to: string;
  subject: string;
  body: string;
  checkoutUrl: string;
  paypalOrderId: string | null;
  sentAt: IsoDateTime;
  simulated: true;
}

/** A reminder drafted by AI (or a template when AI is down). Code inserts the link. */
export interface ReminderDraft {
  subject: string;
  body: string;
  source: "ai" | "template";
}

// ---------------------------------------------------------------------------
// Risk and alerts (lib/risk, Person 4)
// ---------------------------------------------------------------------------

export type RiskFlagKind = "UNUSUAL_AMOUNT" | "NEW_BUYER_BIG_ORDER" | "REPEATED_FAILED_ATTEMPTS";

export interface RiskFlag {
  id: string;
  storeId: StoreId;
  orderId: string;
  orderNumber: number;
  kind: RiskFlagKind;
  /** Plain words, e.g. "First order from this buyer, and 4 times the usual order size." */
  detail: string;
  amountCents: Cents;
  createdAt: IsoDateTime;
  held: boolean;
}

export type AlertKind = "PRICE_RISE" | "SLOW_WEEK" | "BELOW_MINIMUM";

export interface Alert {
  id: string;
  kind: AlertKind;
  title: string;
  detail: string;
  confidence: Confidence;
}

// ---------------------------------------------------------------------------
// Ask chat (lib/ai, Person 4)
// ---------------------------------------------------------------------------

/** A number the answer relies on. Always calculated by code, never by the model. */
export interface ChatFact {
  label: string;
  cents: Cents | null;
  date: IsoDate | null;
}

export interface ChatAnswer {
  question: string;
  answer: string;
  facts: ChatFact[];
  /** Names of the tools whose numbers the answer used, e.g. ["canAfford"]. */
  toolsUsed: string[];
  /** "fallback" when the AI call failed and the app answered from a template. */
  source: "ai" | "fallback";
}

// ---------------------------------------------------------------------------
// PayPal (lib/paypal)
// ---------------------------------------------------------------------------

export interface PayPalOrderRef {
  id: string;
  status: "CREATED" | "APPROVED" | "COMPLETED" | "VOIDED";
  approveUrl: string | null;
}

export interface PayPalCapture {
  orderId: string;
  captureId: string;
  grossCents: Cents;
  feeCents: Cents;
  netCents: Cents;
}

// ---------------------------------------------------------------------------
// Demo copies (lib/demo, Person 3)
// ---------------------------------------------------------------------------

export interface DemoStoreStatus {
  storeId: StoreId;
  exists: boolean;
  demoRunId: string | null;
  createdAt: IsoDateTime | null;
  lastResetAt: IsoDateTime | null;
  counts: { products: number; orders: number; ledgerEntries: number; dues: number };
}
