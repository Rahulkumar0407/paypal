import type {
  ActionProposal,
  AffordabilityCheck,
  Cents,
  Confidence,
  DayState,
  Due,
  Forecast,
  ForecastDay,
  IsoDate,
  PayeeKind,
  RecurringPayee,
  Shortfall,
  StoreId,
} from "@/types";
import { addDays, daysBetween, eachDay, weekdayIndex } from "@/lib/shared/dates";
import { assertCents } from "@/lib/shared/money";
import { isRisky, scoreOrder } from "@/lib/shared/risk";
import { type Cadence, datesBetween, detectPattern, type PastPayment, type Pattern, summaryFor } from "./detect";

/**
 * The 30-day cash forecast. Pure and deterministic: rows in, numbers out. No AI, no database, no clock.
 *
 *   start of today's balance = opening balance + every ledger entry before today
 *   money in, per day        = average net sales for that weekday over the last 8 weeks
 *                              (+ money that already arrived today, + a simulated gap loan)
 *   money out, per day       = scheduled dues (bills, confirmed payees, moved payments)
 *                              + the next payments of regular payees we found but you haven't confirmed yet
 *                              (Volta, your transfers to the bank), less any set-aside kept back from a transfer
 *   closing                  = opening + money in − money out
 *   state                    = short below the minimum balance, tight within the margin above it, else covered
 */

export const FORECAST_DAYS = 30;
/** How far ahead dues, projections and "can I afford" look. The demo seed has 35 days of dues. */
export const MAX_HORIZON_DAYS = 35;
export const SALES_WEEKS = 8;
/** A week's sales within this share of the average gives high confidence; within MEDIUM_SWING gives medium. */
export const HIGH_SWING = 0.2;
export const MEDIUM_SWING = 0.35;

// ---------------------------------------------------------------------------
// Rows: what the loader reads from the database. The demo seed has the same shape.
// ---------------------------------------------------------------------------

export interface StoreRows {
  store: { id: string; minimumBalanceCents: number; tightMarginCents: number; openingBalanceCents: number; openingBalanceOn: string };
  ledger: readonly {
    id: string;
    occurredOn: string;
    direction: "IN" | "OUT";
    amountCents: number;
    category: string;
    description: string;
    payeeId?: string | null;
  }[];
  payees: readonly PayeeRow[];
  dues: readonly {
    id: string;
    payeeId: string;
    dueOn: string;
    amountCents: number;
    status?: Due["status"];
    movedFromOn?: string | null;
    simulated?: boolean;
  }[];
  /** Active set-asides only. */
  setAsides: readonly { dailyAmountCents: number; startOn: string; endOn: string; forDate: string }[];
  gapLoans: readonly { id: string; amountCents: number; feeCents: number; receivedOn: string; repayOn: string }[];
  /**
   * Orders approved but not captured yet, with what would arrive after PayPal's fee. They count as money in today,
   * unless they're on risk hold or the risk score flags them and the owner hasn't cleared them (feature 7).
   */
  pendingOrders: readonly PendingOrder[];
  /** The usual order size (median of paid orders), for the risk score. */
  typicalOrderCents: number;
}

export interface PendingOrder {
  id: string;
  number: number;
  totalCents: number;
  netCents: number;
  riskHold: boolean;
  /** The owner declined the risk check's hold, so it counts like any other order. */
  cleared: boolean;
  failedAttempts: number;
  placedOn: string;
  customerFirstSeenOn: string;
  customerPaidOrders: number;
}

export interface PayeeRow {
  id: string;
  name: string;
  label: string;
  kind: PayeeKind;
  status: RecurringPayee["status"];
  typicalAmountCents: number;
  cadence: "EVERY_N_DAYS" | "MONTHLY" | "EVERY_N_WEEKS";
  intervalDays?: number | null;
  intervalWeeks?: number | null;
  weekday?: number | null;
  dayOfMonth?: number | null;
  autoDebit?: boolean;
  optional?: boolean;
}

/** The id a projected payment gets, and keeps when the owner confirms the payee or the executor acts on it. */
export function projectedDueId(payeeId: string, date: IsoDate): string {
  return `${payeeId}_due_${date}`;
}

// ---------------------------------------------------------------------------
// Regular payees
// ---------------------------------------------------------------------------

/** Each payee's pattern, found from its past payments (money out with a payee, before today). */
export function findPatterns(rows: StoreRows, today: IsoDate): Map<string, Pattern | null> {
  const history = new Map<string, PastPayment[]>();
  for (const e of rows.ledger) {
    if (e.direction !== "OUT" || !e.payeeId || e.occurredOn >= today) continue;
    const list = history.get(e.payeeId) ?? [];
    list.push({ date: e.occurredOn, amountCents: e.amountCents });
    history.set(e.payeeId, list);
  }
  return new Map(rows.payees.map((p) => [p.id, detectPattern(history.get(p.id) ?? [], today)]));
}

function storedCadence(p: PayeeRow): Cadence | null {
  if (p.cadence === "EVERY_N_DAYS" && p.intervalDays) return { every: "DAYS", days: p.intervalDays };
  if (p.cadence === "EVERY_N_WEEKS" && p.intervalWeeks && p.weekday !== null && p.weekday !== undefined) {
    return { every: "WEEKS", weeks: p.intervalWeeks, weekday: p.weekday };
  }
  if (p.cadence === "MONTHLY" && p.dayOfMonth) return { every: "MONTH", dayOfMonth: p.dayOfMonth };
  return null;
}

/**
 * Every payee with a regular pattern ("We think Volta Audio Parts is paid about $300 every 10 days, next on Thu 12 Nov"),
 * plus confirmed payees (their own schedule). Found but not confirmed: DETECTED. Sorted by next payment.
 */
export function recurringPayeesFromRows(rows: StoreRows, storeId: StoreId, today: IsoDate): RecurringPayee[] {
  const patterns = findPatterns(rows, today);
  const result: RecurringPayee[] = [];
  for (const p of rows.payees) {
    const pattern = patterns.get(p.id) ?? null;
    const confirmed = p.status === "CONFIRMED";
    const cadence = confirmed ? (storedCadence(p) ?? pattern?.cadence ?? null) : (pattern?.cadence ?? null);
    if (!cadence || (!pattern && !confirmed)) continue;
    const typical = confirmed ? p.typicalAmountCents : pattern!.typicalAmountCents;
    const scheduled = rows.dues
      .filter((d) => d.payeeId === p.id && d.dueOn >= today && (d.status ?? "SCHEDULED") !== "PAID" && d.status !== "CANCELLED")
      .map((d) => d.dueOn)
      .sort()[0];
    const nextDueOn = (confirmed ? scheduled : undefined) ?? pattern?.nextDueOn ?? null;
    result.push({
      id: p.id,
      storeId,
      name: p.name,
      kind: p.kind,
      typicalAmountCents: typical,
      cadence,
      status: p.status,
      summary: summaryFor({ name: p.name, kind: p.kind, status: p.status, typicalAmountCents: typical, amountsVary: pattern?.amountsVary ?? false, cadence, nextDueOn }),
      nextDueOn,
    });
  }
  return result.sort((a, b) => (a.nextDueOn ?? "9999").localeCompare(b.nextDueOn ?? "9999") || a.name.localeCompare(b.name));
}

/** The future payment dates a found (not yet confirmed) payee is expected on, skipping dates that already have a Due row. */
export function projectedDates(rows: StoreRows, payeeId: string, pattern: Pattern, today: IsoDate): IsoDate[] {
  const taken = new Set(rows.dues.filter((d) => d.payeeId === payeeId).flatMap((d) => [d.dueOn, d.movedFromOn ?? d.dueOn]));
  return datesBetween(pattern.cadence, pattern.nextDueOn, addDays(today, MAX_HORIZON_DAYS - 1)).filter((d) => !taken.has(d));
}

// ---------------------------------------------------------------------------
// Forecast input
// ---------------------------------------------------------------------------

interface SetAside {
  dailyAmountCents: Cents;
  startOn: IsoDate;
  endOn: IsoDate;
  forDate: IsoDate;
}

export interface ForecastInput {
  storeId: StoreId;
  today: IsoDate;
  minimumBalanceCents: Cents;
  tightMarginCents: Cents;
  /** Balance at the start of today. */
  startBalanceCents: Cents;
  /** Average net sales per weekday (0 = Sunday) over the last 8 weeks. */
  expectedByWeekday: readonly Cents[];
  confidence: Confidence;
  confidenceReason: string;
  /** Extra money in by date: money that already arrived today, a gap loan. */
  extraIn: ReadonlyMap<IsoDate, Cents>;
  /** Every known payment out from today on, within MAX_HORIZON_DAYS. readyCents is filled in by the run. */
  outs: readonly Due[];
  setAsides: readonly SetAside[];
  heldByDate: ReadonlyMap<IsoDate, Cents>;
}

const LEDGER_KIND: Record<string, PayeeKind> = { SUPPLIER: "SUPPLIER", BILL: "BILL", OWNER_TRANSFER: "OWNER_TRANSFER", LOAN_REPAYMENT: "LOAN" };

/** Turns a store's rows into the forecast's inputs. */
export function inputFromRows(rows: StoreRows, storeId: StoreId, today: IsoDate): ForecastInput {
  const payees = new Map(rows.payees.map((p) => [p.id, p]));
  const lastDay = addDays(today, MAX_HORIZON_DAYS - 1);
  const salesByDay = new Map<IsoDate, Cents>();
  const extraIn = new Map<IsoDate, Cents>();
  const addIn = (date: IsoDate, cents: Cents) => extraIn.set(date, (extraIn.get(date) ?? 0) + cents);
  const outs: Due[] = [];
  let start = rows.store.openingBalanceCents;

  for (const e of rows.ledger) {
    // Simulated gap loans live in GapLoan rows (below), so a ledger copy of one is never counted twice.
    if (e.category === "GAP_LOAN") continue;
    if (e.occurredOn < today) {
      start += e.direction === "IN" ? e.amountCents : -e.amountCents;
      if (e.direction === "IN" && e.category === "SALE") salesByDay.set(e.occurredOn, (salesByDay.get(e.occurredOn) ?? 0) + e.amountCents);
    } else if (e.occurredOn === today) {
      // Money that already moved today: in on top of the expected sales (a recovered order), out as a paid item.
      if (e.direction === "IN") addIn(today, e.amountCents);
      else {
        const payee = e.payeeId ? payees.get(e.payeeId) : undefined;
        outs.push({
          id: e.id,
          storeId,
          payeeId: e.payeeId ?? e.id,
          payeeName: payee?.name ?? e.description,
          label: payee?.label ?? e.description.toLowerCase(),
          kind: payee?.kind ?? LEDGER_KIND[e.category] ?? "BILL",
          dueOn: today,
          amountCents: e.amountCents,
          readyCents: e.amountCents,
          status: "PAID",
          movedFromOn: null,
          simulated: false,
          autoDebit: payee?.autoDebit ?? false,
          optional: payee?.optional ?? false,
        });
      }
    }
    // Ledger entries after today would be money that hasn't moved yet; dues hold those, so they're ignored.
  }

  for (const d of rows.dues) {
    const status = d.status ?? "SCHEDULED";
    if ((status !== "SCHEDULED" && status !== "MOVED") || d.dueOn < today || d.dueOn > lastDay) continue;
    const payee = payees.get(d.payeeId);
    if (!payee) continue;
    outs.push(dueFrom(payee, storeId, d.id, d.dueOn, d.amountCents, status, d.movedFromOn ?? null, d.simulated ?? false));
  }

  const patterns = findPatterns(rows, today);
  for (const payee of rows.payees) {
    const pattern = patterns.get(payee.id);
    if (payee.status !== "DETECTED" || !pattern) continue;
    for (const date of projectedDates(rows, payee.id, pattern, today)) {
      outs.push(dueFrom(payee, storeId, projectedDueId(payee.id, date), date, pattern.typicalAmountCents, "SCHEDULED", null, false));
    }
  }

  for (const loan of rows.gapLoans) {
    if (loan.receivedOn < today) start += loan.amountCents;
    else addIn(loan.receivedOn, loan.amountCents);
    if (loan.repayOn < today) start -= loan.amountCents + loan.feeCents;
    else outs.push(loanRepayment(storeId, loan.id, loan.repayOn, loan.amountCents + loan.feeCents));
  }

  let heldToday = 0;
  for (const o of rows.pendingOrders) {
    const risky = o.riskHold || (!o.cleared && isRisky(scoreOrder(o, rows.typicalOrderCents)));
    if (risky) heldToday += o.netCents;
    else addIn(today, o.netCents);
  }
  const historyStart = rows.store.openingBalanceOn;
  const { confidence, reason } = salesConfidence(salesByDay, historyStart, today);

  return {
    storeId,
    today,
    minimumBalanceCents: rows.store.minimumBalanceCents,
    tightMarginCents: rows.store.tightMarginCents,
    startBalanceCents: start,
    expectedByWeekday: expectedSalesByWeekday(salesByDay, historyStart, today),
    confidence,
    confidenceReason: reason,
    extraIn,
    outs,
    setAsides: rows.setAsides,
    heldByDate: heldToday > 0 ? new Map([[today, heldToday]]) : new Map(),
  };
}

function dueFrom(
  payee: PayeeRow,
  storeId: StoreId,
  id: string,
  dueOn: IsoDate,
  amountCents: Cents,
  status: Due["status"],
  movedFromOn: IsoDate | null,
  simulated: boolean,
): Due {
  return {
    id,
    storeId,
    payeeId: payee.id,
    payeeName: payee.name,
    label: payee.label,
    kind: payee.kind,
    dueOn,
    amountCents,
    readyCents: 0,
    status,
    movedFromOn,
    simulated,
    autoDebit: payee.autoDebit ?? false,
    optional: payee.optional ?? false,
  };
}

function loanRepayment(storeId: StoreId, loanId: string, repayOn: IsoDate, amountCents: Cents): Due {
  return {
    id: `${loanId}_repay`,
    storeId,
    payeeId: loanId,
    payeeName: "Short-term loan repayment",
    label: "the short-term loan repayment",
    kind: "LOAN",
    dueOn: repayOn,
    amountCents,
    readyCents: 0,
    status: "SCHEDULED",
    movedFromOn: null,
    simulated: true,
  };
}

// ---------------------------------------------------------------------------
// Sales: weekday averages and confidence
// ---------------------------------------------------------------------------

/** Average net sales for each weekday (0 = Sunday) over the last `weeks` weeks before today. Days with no sales count as 0. */
export function expectedSalesByWeekday(salesByDay: ReadonlyMap<IsoDate, Cents>, historyStart: IsoDate, today: IsoDate, weeks = SALES_WEEKS): Cents[] {
  const sums = [0, 0, 0, 0, 0, 0, 0];
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (let back = 1; back <= weeks * 7; back++) {
    const date = addDays(today, -back);
    if (date < historyStart) break;
    const w = weekdayIndex(date);
    sums[w]! += salesByDay.get(date) ?? 0;
    counts[w]! += 1;
  }
  return sums.map((sum, w) => (counts[w] ? Math.round(sum / counts[w]!) : 0));
}

/** How far to trust the sales side: from how much weekly sales have swung over the last 8 weeks. */
export function salesConfidence(
  salesByDay: ReadonlyMap<IsoDate, Cents>,
  historyStart: IsoDate,
  today: IsoDate,
  weeks = SALES_WEEKS,
): { confidence: Confidence; reason: string; swing: number | null } {
  const fullWeeks = Math.min(weeks, Math.floor(Math.max(0, daysBetween(historyStart, today)) / 7));
  if (fullWeeks < 4) {
    const reason =
      fullWeeks === 0 ? "No sales history yet, so this is only a rough guess." : `Only ${fullWeeks} week${fullWeeks === 1 ? "" : "s"} of sales so far, so this is only a rough guess.`;
    return { confidence: "low", reason, swing: null };
  }
  const totals = Array.from({ length: fullWeeks }, (_, i) =>
    eachDay(addDays(today, -7 * (i + 1)), 7).reduce((sum, d) => sum + (salesByDay.get(d) ?? 0), 0),
  );
  const mean = totals.reduce((a, b) => a + b, 0) / totals.length;
  if (mean <= 0) return { confidence: "low", reason: `No sales in the last ${fullWeeks} weeks, so this is only a rough guess.`, swing: null };
  const sd = Math.sqrt(totals.reduce((sum, t) => sum + (t - mean) ** 2, 0) / (totals.length - 1));
  const swing = sd / mean;
  const pct = Math.round(swing * 100);
  if (swing <= HIGH_SWING) return { confidence: "high", reason: `Based on ${fullWeeks} weeks of sales. A usual week lands within about ${pct}% of the average.`, swing };
  if (swing <= MEDIUM_SWING) return { confidence: "medium", reason: `Based on ${fullWeeks} weeks of sales, which swing by about ${pct}% from week to week.`, swing };
  return { confidence: "low", reason: `Sales have swung by about ${pct}% from week to week, so treat this as a rough guess.`, swing };
}

// ---------------------------------------------------------------------------
// The day-by-day run
// ---------------------------------------------------------------------------

/** Order in which a day's money is given to its payments: already paid, bills, loans, the supplier, then your own transfer. */
const READY_ORDER: Record<PayeeKind, number> = { BILL: 0, LOAN: 1, SUPPLIER: 2, OWNER_TRANSFER: 3 };
const REASON_ORDER: Record<PayeeKind, number> = { SUPPLIER: 0, BILL: 1, LOAN: 2, OWNER_TRANSFER: 3 };

function byReadiness(a: Due, b: Due): number {
  return (
    Number(b.status === "PAID") - Number(a.status === "PAID") ||
    READY_ORDER[a.kind] - READY_ORDER[b.kind] ||
    a.payeeName.localeCompare(b.payeeName) ||
    a.id.localeCompare(b.id)
  );
}

/** A set-aside keeps money back from your transfers to the bank between its start and the day it's for. */
function applySetAsides(outs: readonly Due[], setAsides: readonly SetAside[]): Due[] {
  const result = outs.map((d) => ({ ...d }));
  for (const s of setAsides) {
    let left = s.dailyAmountCents * (daysBetween(s.startOn, s.endOn) + 1);
    const transfers = result
      .filter((d) => d.kind === "OWNER_TRANSFER" && d.status !== "PAID" && d.dueOn >= s.startOn && d.dueOn < s.forDate)
      .sort((a, b) => a.dueOn.localeCompare(b.dueOn));
    for (const t of transfers) {
      const kept = Math.min(left, t.amountCents);
      t.amountCents -= kept;
      left -= kept;
      if (left === 0) break;
    }
  }
  return result.filter((d) => d.amountCents > 0);
}

export function stateFor(closing: Cents, minimum: Cents, margin: Cents): DayState {
  if (closing < minimum) return "short";
  if (closing < minimum + margin) return "tight";
  return "covered";
}

/** "the supplier order and rent land the same day". */
export function reasonFor(dues: readonly Due[]): string {
  const labels = [...dues].sort((a, b) => REASON_ORDER[a.kind] - REASON_ORDER[b.kind]).map((d) => d.label);
  if (labels.length === 0) return "sales that day won't cover what's already gone out";
  if (labels.length === 1) return `${labels[0]} is due`;
  return `${labels.slice(0, -1).join(", ")} and ${labels.at(-1)} land the same day`;
}

export interface ForecastRun {
  days: ForecastDay[];
  firstShortfall: Shortfall | null;
}

export function runForecast(input: ForecastInput, dayCount = FORECAST_DAYS): ForecastRun {
  const outs = applySetAsides(input.outs, input.setAsides);
  const byDate = new Map<IsoDate, Due[]>();
  for (const d of outs) byDate.set(d.dueOn, [...(byDate.get(d.dueOn) ?? []), d]);

  let opening = input.startBalanceCents;
  const days = eachDay(input.today, dayCount).map((date): ForecastDay => {
    const expectedIn = input.expectedByWeekday[weekdayIndex(date)]! + (input.extraIn.get(date) ?? 0);
    let available = Math.max(0, opening + expectedIn - input.minimumBalanceCents);
    const dues = (byDate.get(date) ?? []).sort(byReadiness).map((d) => {
      const ready = d.status === "PAID" ? d.amountCents : Math.min(d.amountCents, available);
      available = Math.max(0, available - ready);
      return { ...d, readyCents: ready };
    });
    const knownOut = dues.reduce((sum, d) => sum + d.amountCents, 0);
    const closing = opening + expectedIn - knownOut;
    const state = stateFor(closing, input.minimumBalanceCents, input.tightMarginCents);
    const day: ForecastDay = {
      date,
      isToday: date === input.today,
      openingCents: opening,
      expectedInCents: expectedIn,
      heldInCents: input.heldByDate.get(date) ?? 0,
      knownOutCents: knownOut,
      closingCents: closing,
      state,
      shortByCents: state === "short" ? input.minimumBalanceCents - closing : 0,
      dues,
    };
    opening = closing;
    return day;
  });

  const short = days.find((d) => d.state === "short");
  return {
    days,
    firstShortfall: short ? { date: short.date, amountCents: short.shortByCents, dueIds: short.dues.map((d) => d.id), reason: reasonFor(short.dues) } : null,
  };
}

export function forecastFrom(input: ForecastInput): Forecast {
  const run = runForecast(input, FORECAST_DAYS);
  return {
    storeId: input.storeId,
    asOf: input.today,
    days: run.days,
    firstShortfall: run.firstShortfall,
    confidence: input.confidence,
    confidenceReason: input.confidenceReason,
    minimumBalanceCents: input.minimumBalanceCents,
    tightMarginCents: input.tightMarginCents,
  };
}

/** Every payment from today on within MAX_HORIZON_DAYS, with how much will be ready on its day. */
export function duesFrom(input: ForecastInput): Due[] {
  return runForecast(input, MAX_HORIZON_DAYS).days.flatMap((d) => d.dues.filter((due) => due.status !== "PAID"));
}

// ---------------------------------------------------------------------------
// What-ifs: Guard rule 6, "can I afford", fix-the-gap
// ---------------------------------------------------------------------------

export type Adjustment =
  | { kind: "EXTRA_IN"; date: IsoDate; amountCents: Cents }
  | { kind: "EXTRA_OUT"; date: IsoDate; amountCents: Cents; payeeName: string; label: string }
  | { kind: "SET_ASIDE"; dailyAmountCents: Cents; startOn: IsoDate; endOn: IsoDate; forDate: IsoDate }
  | { kind: "MOVE_DUE"; dueId: string; toOn: IsoDate }
  | { kind: "PAY_DUE_NOW"; dueId: string }
  | { kind: "GAP_LOAN"; id: string; amountCents: Cents; feeCents: Cents; receivedOn: IsoDate; repayOn: IsoDate };

/** The inputs as they would be after these changes. Throws if a change names a payment that isn't there. */
export function withAdjustments(input: ForecastInput, adjustments: readonly Adjustment[]): ForecastInput {
  const extraIn = new Map(input.extraIn);
  const addIn = (date: IsoDate, cents: Cents) => extraIn.set(date, (extraIn.get(date) ?? 0) + cents);
  let outs = [...input.outs];
  const setAsides = [...input.setAsides];
  const find = (dueId: string) => {
    const due = outs.find((d) => d.id === dueId && d.status !== "PAID");
    if (!due) throw new Error(`No upcoming payment with id ${dueId}`);
    return due;
  };

  adjustments.forEach((a, i) => {
    switch (a.kind) {
      case "EXTRA_IN":
        addIn(a.date, a.amountCents);
        break;
      case "EXTRA_OUT":
        outs.push({
          id: `whatif_${i}`,
          storeId: input.storeId,
          payeeId: `whatif_${i}`,
          payeeName: a.payeeName,
          label: a.label,
          kind: "SUPPLIER",
          dueOn: a.date,
          amountCents: a.amountCents,
          readyCents: 0,
          status: "SCHEDULED",
          movedFromOn: null,
          simulated: true,
        });
        break;
      case "SET_ASIDE":
        setAsides.push({ dailyAmountCents: a.dailyAmountCents, startOn: a.startOn, endOn: a.endOn, forDate: a.forDate });
        break;
      case "MOVE_DUE": {
        const due = find(a.dueId);
        outs = outs.map((d) => (d === due ? { ...d, dueOn: a.toOn, movedFromOn: due.dueOn, status: "MOVED", simulated: true } : d));
        break;
      }
      case "PAY_DUE_NOW": {
        const due = find(a.dueId);
        outs = outs.map((d) => (d === due ? { ...d, dueOn: input.today, status: "PAID" } : d));
        break;
      }
      case "GAP_LOAN":
        addIn(a.receivedOn, a.amountCents);
        outs.push(loanRepayment(input.storeId, a.id, a.repayOn, a.amountCents + a.feeCents));
        break;
    }
  });
  return { ...input, extraIn, outs, setAsides };
}

/** What a Guard proposal would change in the forecast. Reminders and holds move no money now. */
export function adjustmentsFor(proposal: ActionProposal, today: IsoDate): Adjustment[] {
  switch (proposal.type) {
    case "SET_ASIDE":
      return [{ kind: "SET_ASIDE", ...proposal.params }];
    case "MOVE_PAYMENT":
      return [{ kind: "MOVE_DUE", dueId: proposal.params.dueId, toOn: proposal.params.toOn }];
    case "GAP_LOAN":
      return [{ kind: "GAP_LOAN", id: proposal.id, amountCents: proposal.params.amountCents, feeCents: proposal.params.feeCents, receivedOn: today, repayOn: proposal.params.repayOn }];
    case "PAY_SUPPLIER":
      return proposal.params.dueId
        ? [{ kind: "PAY_DUE_NOW", dueId: proposal.params.dueId }]
        : [{ kind: "EXTRA_OUT", date: today, amountCents: proposal.amountCents, payeeName: proposal.target.label, label: "the supplier payment" }];
    case "REFUND":
      // PayPal takes the full order total back from the balance (its fee isn't returned), so that's what goes out.
      return [{ kind: "EXTRA_OUT", date: today, amountCents: proposal.amountCents, payeeName: `Refund: ${proposal.target.label}`, label: "the refund" }];
    case "SEND_REMINDER":
    case "HOLD_ORDER":
      return [];
  }
}

/** "Can I afford $X on <date>?": the forecast with $X more going out that day. Affordable when no day from then on ends short. */
export function affordability(input: ForecastInput, amountCents: Cents, date: IsoDate): AffordabilityCheck {
  assertCents(amountCents, "amountCents");
  if (amountCents <= 0) throw new RangeError("The amount must be more than $0.");
  const offset = daysBetween(input.today, date);
  if (offset < 0) throw new RangeError("That date has already passed.");
  if (offset >= MAX_HORIZON_DAYS) throw new RangeError(`The forecast only looks ${MAX_HORIZON_DAYS} days ahead.`);
  const dayCount = Math.min(MAX_HORIZON_DAYS, Math.max(FORECAST_DAYS, offset + 8));
  const before = runForecast(input, dayCount);
  const after = runForecast(withAdjustments(input, [{ kind: "EXTRA_OUT", date, amountCents, payeeName: "Your new order", label: "the new order" }]), dayCount);
  return {
    date,
    amountCents,
    affordable: after.days.every((d) => d.date < date || d.state !== "short"),
    balanceAfterOnDateCents: after.days.find((d) => d.date === date)!.closingCents,
    shortfallBefore: before.firstShortfall,
    shortfallAfter: after.firstShortfall,
  };
}
