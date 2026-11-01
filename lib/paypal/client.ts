/**
 * The ONE file that talks to PayPal (AGENTS.md section 6). Owner: Person 2.
 * Sandbox only. Every call that creates or changes something sends a PayPal-Request-Id.
 * Foundation stubs by Person 1: right signatures, FAKE responses, no network calls.
 */
import type { Cents, PayPalCapture, PayPalOrderRef, StoreId } from "@/types";

export const PAYPAL_SANDBOX_BASE = "https://api-m.sandbox.paypal.com";

export interface CreateOrderInput {
  storeId: StoreId;
  orderId: string;
  amountCents: Cents;
  description: string;
  /** Becomes the PayPal-Request-Id header. */
  idempotencyKey: string;
  returnUrl: string;
  cancelUrl: string;
}

/** Orders v2: create an order and return its approve link. custom_id carries the storeId. */
export async function createOrder(input: CreateOrderInput): Promise<PayPalOrderRef> {
  // TODO(Person 2): POST /v2/checkout/orders with custom_id = storeId (P2-1).
  return {
    id: "5O190127TN364715T",
    status: "CREATED",
    approveUrl: `https://www.sandbox.paypal.com/checkoutnow?token=5O190127TN364715T&ref=${encodeURIComponent(input.orderId)}`,
  };
}

/** Orders v2: read an order's status (the Guard's "already paid" check uses this). */
export async function getOrder(paypalOrderId: string): Promise<PayPalOrderRef> {
  // TODO(Person 2): GET /v2/checkout/orders/{id}.
  return { id: paypalOrderId, status: "CREATED", approveUrl: null };
}

/** Orders v2: capture after the buyer approves. Returns gross, PayPal's fee and net. */
export async function captureOrder(paypalOrderId: string, idempotencyKey: string): Promise<PayPalCapture> {
  // TODO(Person 2): POST /v2/checkout/orders/{id}/capture; read seller_receivable_breakdown.
  void idempotencyKey;
  return { orderId: paypalOrderId, captureId: "3C679366HH908993F", grossCents: 7_200, feeCents: 300, netCents: 6_900 };
}

/** Payments v2: refund a capture (only after the Guard approves). */
export async function refundCapture(captureId: string, amountCents: Cents, idempotencyKey: string): Promise<{ refundId: string }> {
  // TODO(Person 2): POST /v2/payments/captures/{id}/refund.
  void captureId;
  void amountCents;
  void idempotencyKey;
  return { refundId: "1JU08902781691411" };
}

/** Payouts: pay a supplier (only after the Guard approves). */
export async function createPayout(input: { receiverEmail: string; amountCents: Cents; note: string; idempotencyKey: string }): Promise<{ payoutBatchId: string }> {
  // TODO(Person 2): POST /v1/payments/payouts with sender_batch_id = idempotencyKey.
  void input;
  return { payoutBatchId: "5UXD2E8A7EBQJ" };
}

/** Webhooks: verify the signature with PayPal before trusting an event. */
export async function verifyWebhookSignature(headers: Headers, rawBody: string): Promise<boolean> {
  // TODO(Person 2): POST /v1/notifications/verify-webhook-signature with PAYPAL_WEBHOOK_ID (P2-2).
  void headers;
  void rawBody;
  return false;
}
