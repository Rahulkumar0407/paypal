import type { PrismaClient } from "@/generated/prisma/client";
import type { ActionProposal, Due, PayeeKind } from "@/types";
import { createCheckoutForOrder, createPayout, paypalMode, PayPalNotConfiguredError, refundCapture } from "@/lib/paypal";
import { getDues } from "@/lib/forecast";
import { recordAttempt } from "@/lib/store";
import { today } from "@/lib/shared/clock";
import { formatDay } from "@/lib/shared/dates";
import { formatCents } from "@/lib/shared/money";
import { ExecutionError, type ExecutionResult } from "./flow";

/**
 * The executor: the ONLY code that carries out actions (AGENTS.md section 4). It runs after APPROVE, or after the
 * owner approves an ESCALATE and the BLOCK rules pass again. PayPal calls go through lib/paypal and carry a
 * PayPal-Request-Id made from the action's idempotency key. Everything except PayPal itself is simulated and says so.
 */

type Proposal<K extends ActionProposal["type"]> = Extract<ActionProposal, { type: K }>;

const LEDGER_CATEGORY: Record<PayeeKind, "SUPPLIER" | "BILL" | "OWNER_TRANSFER" | "LOAN_REPAYMENT"> = {
  SUPPLIER: "SUPPLIER",
  BILL: "BILL",
  OWNER_TRANSFER: "OWNER_TRANSFER",
  LOAN: "LOAN_REPAYMENT",
};

/** A reminder template, used when there's no drafted text. Code, never AI, puts the link in. */
function reminderTemplate(firstName: string, number: number): string {
  return `Hi ${firstName}, your Loop Audio order #${number} is still waiting for you. Here's a fresh checkout link if you'd like to finish it: {checkout_link}. Thanks, Loop Audio`;
}

export function withCheckoutLink(draft: string, link: string): string {
  return draft.includes("{checkout_link}") ? draft.replaceAll("{checkout_link}", link) : `${draft}\n\n${link}`;
}

/** The PayPal mode, or "off" when it can't be used (fake mode refused in production). */
function safeMode(): "sandbox" | "fake" | "off" {
  try {
    return paypalMode();
  } catch {
    return "off";
  }
}

/** PayPal calls that need PayPal set up: without it, the action stops with plain words and nothing changes. */
async function withPayPal<T>(what: string, call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (error) {
    if (error instanceof PayPalNotConfiguredError || safeMode() === "off") throw new ExecutionError(`PayPal isn't set up yet, so ${what}.`);
    throw error;
  }
}

export function createExecutor(db: PrismaClient) {
  /** A payment from today on, whether it has its own row or is still a projection from a found payee. */
  async function findDue(storeId: string, dueId: string): Promise<Due> {
    const due = (await getDues(storeId)).find((d) => d.id === dueId);
    if (!due) throw new ExecutionError("That payment isn't due any more, so nothing was changed.");
    return due;
  }

  async function sendReminder(p: Proposal<"SEND_REMINDER">): Promise<ExecutionResult> {
    const order = await db.order.findFirst({ where: { id: p.params.orderId, storeId: p.storeId }, include: { customer: true } });
    if (!order) throw new ExecutionError("That order isn't there any more, so no reminder was sent.");
    // A fresh PayPal checkout for the unpaid order, made now (approval links expire, so never in the seed).
    // Without PayPal set up, the reminder still goes to the outbox, without a link, and says so.
    const live = safeMode() !== "off";
    const paypalOrder = live
      ? await createCheckoutForOrder({ storeId: p.storeId, orderId: order.id, orderNumber: order.number, amountCents: order.totalCents, idempotencyKey: p.idempotencyKey })
      : null;
    if (live && !paypalOrder?.approveUrl) throw new ExecutionError("PayPal didn't return a checkout link, so no reminder was sent.");
    const firstName = order.customer.name.split(" ")[0] ?? order.customer.name;
    const draft = p.draftText ?? reminderTemplate(firstName, order.number);
    const body = paypalOrder?.approveUrl ? withCheckoutLink(draft, paypalOrder.approveUrl) : draft.replaceAll("{checkout_link}", "(link to follow)");
    await db.$transaction(async (tx) => {
      if (paypalOrder) await recordAttempt({ storeId: p.storeId, orderId: order.id, paypalOrderId: paypalOrder.id, source: "REMINDER" }, tx);
      await tx.outboxMessage.create({
        data: {
          storeId: p.storeId,
          proposalId: p.id,
          orderId: order.id,
          to: order.customer.email,
          subject: p.sequence > 1 ? `A last reminder about Loop Audio order #${order.number}` : `Your Loop Audio order #${order.number} is waiting`,
          body,
          checkoutUrl: paypalOrder?.approveUrl ?? "",
          paypalOrderId: paypalOrder?.id ?? null,
          simulated: true,
        },
      });
    });
    return paypalOrder
      ? { detail: `Reminder to ${order.customer.name} put in Sent reminders (simulated), with a new PayPal checkout link for ${formatCents(order.totalCents)}.`, paypalIds: [paypalOrder.id] }
      : { detail: `Reminder to ${order.customer.name} put in Sent reminders (simulated). PayPal isn't set up yet, so it has no payment link.`, paypalIds: [] };
  }

  async function setAside(p: Proposal<"SET_ASIDE">): Promise<ExecutionResult> {
    const { dailyAmountCents, startOn, endOn, forDate } = p.params;
    await db.setAside.create({ data: { storeId: p.storeId, proposalId: p.id, dailyAmountCents, startOn, endOn, forDate, active: true } });
    return {
      detail: `Keeping ${formatCents(dailyAmountCents)} a day back from your transfers to the bank until ${formatDay(forDate)}: ${formatCents(p.amountCents)} in all.`,
      paypalIds: [],
    };
  }

  async function movePayment(p: Proposal<"MOVE_PAYMENT">): Promise<ExecutionResult> {
    const { dueId, fromOn, toOn } = p.params;
    const due = await findDue(p.storeId, dueId);
    const moved = { dueOn: toOn, movedFromOn: fromOn, status: "MOVED" as const, simulated: true };
    await db.due.upsert({
      where: { id: dueId },
      update: moved,
      create: { id: dueId, storeId: p.storeId, payeeId: due.payeeId, amountCents: due.amountCents, ...moved },
    });
    return {
      detail: `Moved ${due.payeeName}'s ${formatCents(due.amountCents)} payment from ${formatDay(fromOn)} to ${formatDay(toOn)}. Simulated: no real payment date changed.`,
      paypalIds: [],
    };
  }

  async function gapLoan(p: Proposal<"GAP_LOAN">): Promise<ExecutionResult> {
    const { amountCents, feeCents, repayOn } = p.params;
    await db.gapLoan.create({ data: { storeId: p.storeId, proposalId: p.id, amountCents, feeCents, receivedOn: today(), repayOn, simulated: true } });
    return {
      detail: `Simulated loan recorded: ${formatCents(amountCents)} in today, ${formatCents(amountCents + feeCents)} back on ${formatDay(repayOn)}. No real loan was made.`,
      paypalIds: [],
    };
  }

  async function paySupplier(p: Proposal<"PAY_SUPPLIER">): Promise<ExecutionResult> {
    const payee = await db.payee.findFirst({ where: { id: p.params.payeeId, storeId: p.storeId } });
    if (!payee) throw new ExecutionError("That supplier isn't there any more, so nothing was paid.");
    if (!payee.paypalEmail) throw new ExecutionError(`${payee.name} has no PayPal email for payouts, so nothing was paid.`);
    const due = p.params.dueId ? await findDue(p.storeId, p.params.dueId) : null;
    const { payoutBatchId } = await withPayPal("nothing was paid", () =>
      createPayout({ receiverEmail: payee.paypalEmail!, amountCents: p.amountCents, note: "Payment from Loop Audio", idempotencyKey: p.idempotencyKey }),
    );
    const day = today();
    await db.$transaction([
      db.ledgerEntry.create({
        data: {
          id: `${p.id}_out`,
          storeId: p.storeId,
          occurredOn: day,
          direction: "OUT",
          amountCents: p.amountCents,
          category: LEDGER_CATEGORY[payee.kind],
          description: payee.name,
          payeeId: payee.id,
          paypalRef: payoutBatchId,
        },
      }),
      ...(due
        ? [
            db.due.upsert({
              where: { id: due.id },
              update: { status: "PAID" },
              create: { id: due.id, storeId: p.storeId, payeeId: payee.id, dueOn: due.dueOn, amountCents: due.amountCents, status: "PAID" },
            }),
          ]
        : []),
    ]);
    return { detail: `Paid ${payee.name} ${formatCents(p.amountCents)} through PayPal Payouts.`, paypalIds: [payoutBatchId] };
  }

  async function refund(p: Proposal<"REFUND">): Promise<ExecutionResult> {
    const order = await db.order.findFirst({ where: { id: p.params.orderId, storeId: p.storeId } });
    if (!order) throw new ExecutionError("That order isn't there any more, so nothing was refunded.");
    const captureId = p.params.captureId ?? order.paypalCaptureId;
    if (!captureId || order.status !== "CAPTURED") throw new ExecutionError(`Order #${order.number} has no PayPal payment to refund.`);
    const { refundId } = await withPayPal("nothing was refunded", () => refundCapture(captureId, p.amountCents, p.idempotencyKey));
    await db.$transaction([
      db.ledgerEntry.create({
        data: {
          id: `${p.id}_out`,
          storeId: p.storeId,
          occurredOn: today(),
          direction: "OUT",
          amountCents: p.amountCents,
          category: "REFUND",
          description: `Refund for order #${order.number}`,
          orderId: order.id,
          paypalRef: refundId,
        },
      }),
      db.order.updateMany({ where: { id: order.id, storeId: p.storeId }, data: { status: "REFUNDED" } }),
    ]);
    return { detail: `Refunded ${formatCents(p.amountCents)} for order #${order.number} through PayPal.`, paypalIds: [captureId, refundId] };
  }

  async function hold(p: Proposal<"HOLD_ORDER">): Promise<ExecutionResult> {
    const order = await db.order.findFirst({ where: { id: p.params.orderId, storeId: p.storeId }, select: { number: true } });
    if (!order) throw new ExecutionError("That order isn't there any more, so nothing was held.");
    await db.order.updateMany({ where: { id: p.params.orderId, storeId: p.storeId }, data: { riskHold: true } });
    return { detail: `Order #${order.number} is on hold. Its money isn't counted until you release it.`, paypalIds: [] };
  }

  return async function execute(proposal: ActionProposal): Promise<ExecutionResult> {
    switch (proposal.type) {
      case "SEND_REMINDER":
        return sendReminder(proposal);
      case "SET_ASIDE":
        return setAside(proposal);
      case "MOVE_PAYMENT":
        return movePayment(proposal);
      case "GAP_LOAN":
        return gapLoan(proposal);
      case "PAY_SUPPLIER":
        return paySupplier(proposal);
      case "REFUND":
        return refund(proposal);
      case "HOLD_ORDER":
        return hold(proposal);
    }
  };
}

