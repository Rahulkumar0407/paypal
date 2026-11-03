import type { Cents, OrderStatus, PayPalCapture } from "@/types";

/**
 * What a PayPal event does to a payment attempt, its order and the ledger. Pure, so the order things arrive in can't
 * change the result: the buyer's return and the webhook can come in either order, or twice, and the final state is
 * the same. A change that has already happened returns the state unchanged.
 */

export type AttemptStatus = "CREATED" | "APPROVED" | "CAPTURED" | "DENIED" | "CANCELLED" | "REFUNDED";

export interface PaymentState {
  attempt: { status: AttemptStatus; paypalCaptureId: string | null; grossCents: Cents | null; feeCents: Cents | null; netCents: Cents | null };
  order: { status: OrderStatus; failedAttempts: number; feeCents: Cents | null; netCents: Cents | null; paypalOrderId: string | null; paypalCaptureId: string | null };
  /** Money already in the ledger for this order: sales by capture id, refunds by refund id. */
  ledger: { sales: { captureId: string; netCents: Cents }[]; refunds: { refundId: string; amountCents: Cents }[] };
}

const settled = (s: AttemptStatus) => s === "CAPTURED" || s === "REFUNDED";

/** The buyer approved at PayPal. Not paid yet: the order is pending until the capture. */
export function afterApproved(s: PaymentState): PaymentState {
  if (s.attempt.status !== "CREATED") return s;
  const order = s.order.status === "ABANDONED" || s.order.status === "FAILED" ? { ...s.order, status: "PENDING" as const } : s.order;
  return { ...s, attempt: { ...s.attempt, status: "APPROVED" }, order };
}

/** PayPal captured the payment: the order is paid, and what arrived after PayPal's fee goes in the ledger once. */
export function afterCaptured(s: PaymentState, paypalOrderId: string, capture: PayPalCapture): PaymentState {
  if (settled(s.attempt.status)) return s;
  const sales = s.ledger.sales.some((x) => x.captureId === capture.captureId) ? s.ledger.sales : [...s.ledger.sales, { captureId: capture.captureId, netCents: capture.netCents }];
  return {
    attempt: { status: "CAPTURED", paypalCaptureId: capture.captureId, grossCents: capture.grossCents, feeCents: capture.feeCents, netCents: capture.netCents },
    order: {
      ...s.order,
      status: s.order.status === "REFUNDED" ? "REFUNDED" : "CAPTURED",
      feeCents: capture.feeCents,
      netCents: capture.netCents,
      paypalOrderId,
      paypalCaptureId: capture.captureId,
    },
    ledger: { ...s.ledger, sales },
  };
}

/** PayPal denied the capture: one more failed attempt, and the order counts as failed unless it was paid another way. */
export function afterDenied(s: PaymentState): PaymentState {
  if (settled(s.attempt.status) || s.attempt.status === "DENIED") return s;
  const paid = s.order.status === "CAPTURED" || s.order.status === "REFUNDED";
  return { ...s, attempt: { ...s.attempt, status: "DENIED" }, order: { ...s.order, failedAttempts: s.order.failedAttempts + 1, status: paid ? s.order.status : "FAILED" } };
}

/** The buyer cancelled at PayPal. Nothing was paid; the order stays as it was (still unfinished). */
export function afterCancelled(s: PaymentState): PaymentState {
  if (s.attempt.status !== "CREATED" && s.attempt.status !== "APPROVED") return s;
  return { ...s, attempt: { ...s.attempt, status: "CANCELLED" } };
}

/** A refund went through: the order is refunded and the money out goes in the ledger once. */
export function afterRefunded(s: PaymentState, refundId: string, amountCents: Cents): PaymentState {
  if (s.ledger.refunds.some((r) => r.refundId === refundId)) return s;
  return {
    attempt: { ...s.attempt, status: "REFUNDED" },
    order: { ...s.order, status: "REFUNDED" },
    ledger: { ...s.ledger, refunds: [...s.ledger.refunds, { refundId, amountCents }] },
  };
}
