/**
 * The ONE file that talks to PayPal (AGENTS.md section 6).
 *
 * Three modes, chosen from the environment on every call (no code change to switch):
 *   sandbox  PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are set: the real PayPal sandbox, over a small typed REST wrapper.
 *   fake     PAYPAL_FAKE=1 and no keys: an in-memory PayPal for tests and offline demos. Refused in production.
 *   off      neither: every call throws PayPalNotConfiguredError, and the app shows "PayPal isn't set up yet".
 * Sandbox only: any base URL other than https://api-m.sandbox.paypal.com is refused. Every call that creates or
 * changes something sends a PayPal-Request-Id made from the action's idempotency key.
 */
import { z } from "zod";
import type { Cents, PayPalCapture, PayPalOrderRef, StoreId } from "@/types";
import { getEnv } from "@/lib/shared/env";

export const PAYPAL_SANDBOX_BASE = "https://api-m.sandbox.paypal.com";

export type PayPalMode = "sandbox" | "fake" | "off";

export class PayPalNotConfiguredError extends Error {
  constructor() {
    super("PayPal isn't set up: add the sandbox keys (SWITCH-ON.md), or PAYPAL_FAKE=1 for tests.");
    this.name = "PayPalNotConfiguredError";
  }
}

export class PayPalError extends Error {
  constructor(
    readonly status: number,
    readonly issue: string,
    message: string,
  ) {
    super(message);
    this.name = "PayPalError";
  }
}

export function paypalMode(): PayPalMode {
  const env = getEnv();
  if (env.PAYPAL_CLIENT_ID && env.PAYPAL_CLIENT_SECRET) return "sandbox";
  if (env.PAYPAL_FAKE === "1") {
    if (env.NODE_ENV === "production") throw new Error("PAYPAL_FAKE=1 is refused in production. Set the sandbox keys instead (SWITCH-ON.md).");
    return "fake";
  }
  return "off";
}

// ---------------------------------------------------------------------------
// Money: PayPal sends "72.00" strings; we keep integer cents.
// ---------------------------------------------------------------------------

export function toPayPalValue(cents: Cents): string {
  if (!Number.isSafeInteger(cents) || cents < 0) throw new Error(`Not an amount in cents: ${cents}`);
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
}

export function fromPayPalValue(value: string): Cents {
  const m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!m) throw new Error(`Not a PayPal amount: ${value}`);
  return Number(m[1]) * 100 + Number((m[2] ?? "0").padEnd(2, "0"));
}

/** PayPal's published US rate, 3.49% + $0.49. Used only by fake mode and where PayPal hasn't said the fee yet. */
export function publishedFeeCents(gross: Cents): Cents {
  return Math.round(gross * 0.0349) + 49;
}

// ---------------------------------------------------------------------------
// The sandbox: OAuth and a typed fetch
// ---------------------------------------------------------------------------

let token: { value: string; expiresAt: number } | null = null;

function sandboxBase(): string {
  const base = getEnv().PAYPAL_API_BASE.replace(/\/$/, "");
  if (base !== PAYPAL_SANDBOX_BASE) throw new Error(`Refusing PayPal base URL ${base}: tmrw only talks to the sandbox (${PAYPAL_SANDBOX_BASE}).`);
  return base;
}

async function accessToken(): Promise<string> {
  if (token && token.expiresAt > Date.now() + 60_000) return token.value;
  const env = getEnv();
  const response = await fetch(`${sandboxBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!response.ok) throw new PayPalError(response.status, "AUTH", `PayPal refused the sandbox keys (${response.status}).`);
  const body = z.object({ access_token: z.string(), expires_in: z.number() }).parse(await response.json());
  token = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
  return token.value;
}

async function call<T>(method: "GET" | "POST", path: string, schema: z.ZodType<T>, options: { body?: unknown; requestId?: string } = {}): Promise<T> {
  const headers: Record<string, string> = { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json", Prefer: "return=representation" };
  if (options.requestId) headers["PayPal-Request-Id"] = options.requestId;
  const response = await fetch(`${sandboxBase()}${path}`, { method, headers, body: options.body === undefined ? undefined : JSON.stringify(options.body) });
  const text = await response.text();
  const json: unknown = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const issue = z.object({ details: z.array(z.object({ issue: z.string() })).optional(), name: z.string().optional() }).safeParse(json);
    const name = issue.success ? (issue.data.details?.[0]?.issue ?? issue.data.name ?? "ERROR") : "ERROR";
    throw new PayPalError(response.status, name, `PayPal said ${response.status} ${name} for ${method} ${path}.`);
  }
  return schema.parse(json);
}

/** PayPal-Request-Id is at most 108 characters. */
function requestId(key: string): string {
  return key.length <= 108 ? key : key.slice(0, 108);
}

// ---------------------------------------------------------------------------
// Fake mode: a tiny in-memory PayPal (dev server and tests only)
// ---------------------------------------------------------------------------

interface FakeOrder {
  id: string;
  storeId: StoreId;
  referenceId: string;
  amountCents: Cents;
  description: string;
  status: PayPalOrderRef["status"];
  returnUrl: string;
  cancelUrl: string;
  capture: PayPalCapture | null;
}

const fakeState = globalThis as unknown as { nevershortFakePayPal?: Map<string, FakeOrder> };
const fakeOrders = () => (fakeState.nevershortFakePayPal ??= new Map());

/** A PayPal-looking id made from the request's idempotency key, so the same request always gets the same id. */
export function fakeId(seed: string, length: number): string {
  let a = 0x811c9dc5;
  let b = 0x01000193;
  let id = "";
  while (id.length < length) {
    for (let i = 0; i < seed.length; i++) {
      a = Math.imul(a ^ seed.charCodeAt(i), 0x01000193) >>> 0;
      b = Math.imul(b ^ a, 0x5bd1e995) >>> 0;
    }
    id += (a.toString(36) + b.toString(36)).toUpperCase();
    seed += id;
  }
  return id.slice(0, length);
}

/** Fake mode only: the order the fake checkout page shows. */
export function getFakeOrder(paypalOrderId: string): { id: string; amountCents: Cents; description: string; status: string; returnUrl: string; cancelUrl: string } | null {
  if (paypalMode() !== "fake") return null;
  return fakeOrders().get(paypalOrderId) ?? null;
}

/** Fake mode only: after a dev-server restart the in-memory orders are gone; rebuild one from our own payment record. */
export function restoreFakeOrder(input: { paypalOrderId: string; storeId: StoreId; orderId: string; amountCents: Cents; description: string }): ReturnType<typeof getFakeOrder> {
  if (paypalMode() !== "fake") return null;
  const appUrl = getEnv().APP_URL.replace(/\/$/, "");
  if (!fakeOrders().has(input.paypalOrderId)) {
    fakeOrders().set(input.paypalOrderId, {
      id: input.paypalOrderId,
      storeId: input.storeId,
      referenceId: input.orderId,
      amountCents: input.amountCents,
      description: input.description,
      status: "CREATED",
      returnUrl: `${appUrl}/store/return`,
      cancelUrl: `${appUrl}/store/cancel`,
      capture: null,
    });
  }
  return getFakeOrder(input.paypalOrderId);
}

/** Fake mode only: the test buyer approves the payment on the fake checkout page. */
export function approveFakeOrder(paypalOrderId: string): boolean {
  if (paypalMode() !== "fake") return false;
  const order = fakeOrders().get(paypalOrderId);
  if (!order || order.status !== "CREATED") return false;
  order.status = "APPROVED";
  return true;
}

/** Tests only: forget the fake orders and the sandbox token. */
export function resetPayPalForTests(): void {
  fakeOrders().clear();
  token = null;
}

// ---------------------------------------------------------------------------
// Orders v2
// ---------------------------------------------------------------------------

export interface CreateOrderInput {
  storeId: StoreId;
  /** Our order id: PayPal's reference_id. */
  orderId: string;
  amountCents: Cents;
  description: string;
  /** Becomes the PayPal-Request-Id header. */
  idempotencyKey: string;
  returnUrl: string;
  cancelUrl: string;
}

const LINK = z.object({ rel: z.string(), href: z.string() });
const ORDER_STATUS: Record<string, PayPalOrderRef["status"]> = {
  CREATED: "CREATED",
  SAVED: "CREATED",
  PAYER_ACTION_REQUIRED: "CREATED",
  APPROVED: "APPROVED",
  COMPLETED: "COMPLETED",
  VOIDED: "VOIDED",
};
const CAPTURE = z.object({
  id: z.string(),
  status: z.string(),
  amount: z.object({ value: z.string() }),
  custom_id: z.string().optional(),
  seller_receivable_breakdown: z
    .object({ gross_amount: z.object({ value: z.string() }), paypal_fee: z.object({ value: z.string() }).optional(), net_amount: z.object({ value: z.string() }).optional() })
    .optional(),
});
const ORDER = z.object({
  id: z.string(),
  status: z.string(),
  links: z.array(LINK).optional(),
  purchase_units: z.array(z.object({ payments: z.object({ captures: z.array(CAPTURE).optional() }).optional() })).optional(),
});

function captureFrom(paypalOrderId: string, c: z.infer<typeof CAPTURE>): PayPalCapture {
  const gross = fromPayPalValue(c.seller_receivable_breakdown?.gross_amount.value ?? c.amount.value);
  const fee = c.seller_receivable_breakdown?.paypal_fee ? fromPayPalValue(c.seller_receivable_breakdown.paypal_fee.value) : publishedFeeCents(gross);
  const net = c.seller_receivable_breakdown?.net_amount ? fromPayPalValue(c.seller_receivable_breakdown.net_amount.value) : gross - fee;
  return { orderId: paypalOrderId, captureId: c.id, grossCents: gross, feeCents: fee, netCents: net };
}

/** Orders v2: create an order and return its approve link. custom_id carries the storeId, so webhooks find the copy. */
export async function createOrder(input: CreateOrderInput): Promise<PayPalOrderRef> {
  const mode = paypalMode();
  if (mode === "off") throw new PayPalNotConfiguredError();
  if (mode === "fake") {
    const id = fakeId(`order:${input.idempotencyKey}`, 17);
    const existing = fakeOrders().get(id);
    if (!existing) {
      fakeOrders().set(id, { id, storeId: input.storeId, referenceId: input.orderId, amountCents: input.amountCents, description: input.description, status: "CREATED", returnUrl: input.returnUrl, cancelUrl: input.cancelUrl, capture: null });
    }
    const appUrl = getEnv().APP_URL.replace(/\/$/, "");
    return { id, status: existing?.status ?? "CREATED", approveUrl: `${appUrl}/store/fake-paypal?token=${id}` };
  }
  const order = await call("POST", "/v2/checkout/orders", ORDER, {
    requestId: requestId(input.idempotencyKey),
    body: {
      intent: "CAPTURE",
      purchase_units: [
        { reference_id: input.orderId, custom_id: input.storeId, description: input.description.slice(0, 127), amount: { currency_code: "USD", value: toPayPalValue(input.amountCents) } },
      ],
      payment_source: {
        paypal: {
          experience_context: { brand_name: "Dunder Mifflin & Co.", user_action: "PAY_NOW", shipping_preference: "NO_SHIPPING", return_url: input.returnUrl, cancel_url: input.cancelUrl },
        },
      },
    },
  });
  const approve = order.links?.find((l) => l.rel === "payer-action" || l.rel === "approve")?.href ?? null;
  return { id: order.id, status: ORDER_STATUS[order.status] ?? "CREATED", approveUrl: approve };
}

/** Orders v2: read an order's status (the Guard's "already paid" check uses this). */
export async function getOrder(paypalOrderId: string): Promise<PayPalOrderRef> {
  const mode = paypalMode();
  if (mode === "off") throw new PayPalNotConfiguredError();
  if (mode === "fake") {
    const order = fakeOrders().get(paypalOrderId);
    return { id: paypalOrderId, status: order?.status ?? "CREATED", approveUrl: null };
  }
  const order = await call("GET", `/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`, ORDER);
  return { id: order.id, status: ORDER_STATUS[order.status] ?? "CREATED", approveUrl: null };
}

/**
 * Orders v2: capture after the buyer approves. Returns gross, PayPal's fee and net. Safe to call twice: the same
 * key replays PayPal's answer, and an order captured already returns that capture. Throws PayPalError
 * "CAPTURE_DECLINED" when PayPal declines it.
 */
export async function captureOrder(paypalOrderId: string, idempotencyKey: string): Promise<PayPalCapture> {
  const mode = paypalMode();
  if (mode === "off") throw new PayPalNotConfiguredError();
  if (mode === "fake") {
    const order = fakeOrders().get(paypalOrderId);
    if (!order) throw new PayPalError(404, "RESOURCE_NOT_FOUND", `Fake PayPal has no order ${paypalOrderId}.`);
    if (order.capture) return order.capture;
    if (order.status !== "APPROVED") throw new PayPalError(422, "ORDER_NOT_APPROVED", "The buyer hasn't approved this payment yet.");
    const fee = publishedFeeCents(order.amountCents);
    order.capture = { orderId: paypalOrderId, captureId: fakeId(`capture:${idempotencyKey}`, 17), grossCents: order.amountCents, feeCents: fee, netCents: order.amountCents - fee };
    order.status = "COMPLETED";
    return order.capture;
  }
  let order: z.infer<typeof ORDER>;
  try {
    order = await call("POST", `/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, ORDER, { requestId: requestId(idempotencyKey), body: {} });
  } catch (error) {
    if (!(error instanceof PayPalError) || error.issue !== "ORDER_ALREADY_CAPTURED") throw error;
    order = await call("GET", `/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`, ORDER);
  }
  const capture = order.purchase_units?.[0]?.payments?.captures?.[0];
  if (!capture) throw new PayPalError(502, "NO_CAPTURE", "PayPal didn't return a capture.");
  if (capture.status === "DECLINED" || capture.status === "FAILED") throw new PayPalError(422, "CAPTURE_DECLINED", "PayPal declined the payment.");
  return captureFrom(order.id, capture);
}

/** A fresh checkout link for an unpaid order: the buyer returns to the store's return page, which captures it. */
export async function createCheckoutForOrder(input: { storeId: StoreId; orderId: string; orderNumber: number; amountCents: Cents; idempotencyKey: string }): Promise<PayPalOrderRef> {
  const appUrl = getEnv().APP_URL.replace(/\/$/, "");
  return createOrder({
    storeId: input.storeId,
    orderId: input.orderId,
    amountCents: input.amountCents,
    description: `Dunder Mifflin & Co. order #${input.orderNumber}`,
    idempotencyKey: input.idempotencyKey,
    returnUrl: `${appUrl}/store/return`,
    cancelUrl: `${appUrl}/store/cancel`,
  });
}

// ---------------------------------------------------------------------------
// Payments v2 and Payouts
// ---------------------------------------------------------------------------

/** Payments v2: refund a capture (only after the Guard approves). */
export async function refundCapture(captureId: string, amountCents: Cents, idempotencyKey: string): Promise<{ refundId: string }> {
  const mode = paypalMode();
  if (mode === "off") throw new PayPalNotConfiguredError();
  if (mode === "fake") return { refundId: fakeId(`refund:${idempotencyKey}`, 17) };
  const refund = await call("POST", `/v2/payments/captures/${encodeURIComponent(captureId)}/refund`, z.object({ id: z.string() }), {
    requestId: requestId(idempotencyKey),
    body: { amount: { currency_code: "USD", value: toPayPalValue(amountCents) } },
  });
  return { refundId: refund.id };
}

/** Payouts: pay a supplier (only after the Guard approves). sender_batch_id is the idempotency key too. */
export async function createPayout(input: { receiverEmail: string; amountCents: Cents; note: string; idempotencyKey: string }): Promise<{ payoutBatchId: string }> {
  const mode = paypalMode();
  if (mode === "off") throw new PayPalNotConfiguredError();
  if (mode === "fake") return { payoutBatchId: fakeId(`payout:${input.idempotencyKey}`, 13) };
  const batch = await call("POST", "/v1/payments/payouts", z.object({ batch_header: z.object({ payout_batch_id: z.string() }) }), {
    requestId: requestId(input.idempotencyKey),
    body: {
      sender_batch_header: { sender_batch_id: input.idempotencyKey.slice(0, 127), email_subject: "A payment from Dunder Mifflin & Co." },
      items: [{ recipient_type: "EMAIL", receiver: input.receiverEmail, note: input.note, amount: { currency: "USD", value: toPayPalValue(input.amountCents) } }],
    },
  });
  return { payoutBatchId: batch.batch_header.payout_batch_id };
}

// ---------------------------------------------------------------------------
// Webhooks
// ---------------------------------------------------------------------------

/** The header a fake-mode test sends instead of PayPal's real signature. Fake mode only. */
export const FAKE_WEBHOOK_SIGNATURE = "fake-signature";

/** Webhooks: ask PayPal whether the event really came from it. False (never a throw) when it can't say yes. */
export async function verifyWebhookSignature(headers: Headers, rawBody: string): Promise<boolean> {
  const mode = paypalMode();
  if (mode === "off") return false;
  if (mode === "fake") return headers.get("paypal-transmission-sig") === FAKE_WEBHOOK_SIGNATURE;
  const webhookId = getEnv().PAYPAL_WEBHOOK_ID;
  const get = (name: string) => headers.get(name);
  const fields = ["paypal-auth-algo", "paypal-cert-url", "paypal-transmission-id", "paypal-transmission-sig", "paypal-transmission-time"].map(get);
  if (!webhookId || fields.some((f) => !f)) return false;
  try {
    const result = await call("POST", "/v1/notifications/verify-webhook-signature", z.object({ verification_status: z.string() }), {
      body: {
        auth_algo: fields[0],
        cert_url: fields[1],
        transmission_id: fields[2],
        transmission_sig: fields[3],
        transmission_time: fields[4],
        webhook_id: webhookId,
        webhook_event: JSON.parse(rawBody) as unknown,
      },
    });
    return result.verification_status === "SUCCESS";
  } catch (error) {
    console.error("[paypal] webhook verification failed:", error instanceof Error ? error.message : error);
    return false;
  }
}
