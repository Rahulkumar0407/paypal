import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  approveFakeOrder,
  captureOrder,
  createOrder,
  createPayout,
  fromPayPalValue,
  getOrder,
  paypalMode,
  PayPalNotConfiguredError,
  refundCapture,
  resetPayPalForTests,
  toPayPalValue,
  verifyWebhookSignature,
} from "./client";

interface Call {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
}

const ORDER_INPUT = { storeId: "st_test", orderId: "st_test_ord_1258", amountCents: 7_200, description: "Loop Audio order #1258", idempotencyKey: "run_a:SEND_REMINDER:st_test_ord_1258:1", returnUrl: "http://localhost:3000/store/return", cancelUrl: "http://localhost:3000/store/cancel" };
const CAPTURED = {
  id: "PP_ORDER",
  status: "COMPLETED",
  purchase_units: [{ payments: { captures: [{ id: "CAP_1", status: "COMPLETED", amount: { value: "72.00" }, seller_receivable_breakdown: { gross_amount: { value: "72.00" }, paypal_fee: { value: "3.00" }, net_amount: { value: "69.00" } } }] } }],
};

function off() {
  vi.stubEnv("PAYPAL_CLIENT_ID", "");
  vi.stubEnv("PAYPAL_CLIENT_SECRET", "");
  vi.stubEnv("PAYPAL_FAKE", "");
}
function sandbox(base = "https://api-m.sandbox.paypal.com") {
  vi.stubEnv("PAYPAL_CLIENT_ID", "client-id");
  vi.stubEnv("PAYPAL_CLIENT_SECRET", "client-secret");
  vi.stubEnv("PAYPAL_FAKE", "");
  vi.stubEnv("PAYPAL_API_BASE", base);
  vi.stubEnv("PAYPAL_WEBHOOK_ID", "WH-123");
}
function fake() {
  off();
  vi.stubEnv("PAYPAL_FAKE", "1");
  vi.stubEnv("APP_URL", "http://localhost:3000");
}
/** A pretend PayPal: answers by path, and remembers every call. */
function paypal(routes: Record<string, { status?: number; json: unknown }>) {
  const calls: Call[] = [];
  vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
    const path = new URL(url).pathname;
    const headers = Object.fromEntries(Object.entries((init.headers ?? {}) as Record<string, string>));
    calls.push({ url, method: init.method ?? "GET", headers, body: typeof init.body === "string" && init.body.startsWith("{") ? JSON.parse(init.body) : init.body });
    if (path === "/v1/oauth2/token") return new Response(JSON.stringify({ access_token: "TOKEN", expires_in: 3600 }), { status: 200 });
    const route = routes[`${init.method ?? "GET"} ${path}`];
    if (!route) return new Response(JSON.stringify({ name: "NOT_FOUND" }), { status: 404 });
    return new Response(JSON.stringify(route.json), { status: route.status ?? 200 });
  });
  return calls;
}

beforeEach(() => resetPayPalForTests());
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("modes", () => {
  it("uses the sandbox when the keys are set, fake mode for tests, and nothing otherwise", () => {
    sandbox();
    expect(paypalMode()).toBe("sandbox");
    fake();
    expect(paypalMode()).toBe("fake");
    off();
    expect(paypalMode()).toBe("off");
  });

  it("without keys, every call says PayPal isn't set up, and a webhook can't be verified", async () => {
    off();
    await expect(createOrder(ORDER_INPUT)).rejects.toThrow(PayPalNotConfiguredError);
    await expect(getOrder("X")).rejects.toThrow(PayPalNotConfiguredError);
    expect(await verifyWebhookSignature(new Headers(), "{}")).toBe(false);
  });

  it("refuses fake mode in production", async () => {
    fake();
    vi.stubEnv("NODE_ENV", "production");
    expect(() => paypalMode()).toThrow("PAYPAL_FAKE=1 is refused in production");
    await expect(createOrder(ORDER_INPUT)).rejects.toThrow("refused in production");
  });

  it("refuses any base URL but the sandbox, before any network call", async () => {
    sandbox("https://api-m.paypal.com");
    const calls = paypal({});
    await expect(createOrder(ORDER_INPUT)).rejects.toThrow("Refusing PayPal base URL https://api-m.paypal.com");
    expect(calls).toHaveLength(0);
  });
});

describe("the sandbox", () => {
  it("creates an order with the storeId in custom_id and the key as PayPal-Request-Id", async () => {
    sandbox();
    const calls = paypal({ "POST /v2/checkout/orders": { status: 201, json: { id: "PP_ORDER", status: "PAYER_ACTION_REQUIRED", links: [{ rel: "payer-action", href: "https://www.sandbox.paypal.com/checkoutnow?token=PP_ORDER" }] } } });
    expect(await createOrder(ORDER_INPUT)).toEqual({ id: "PP_ORDER", status: "CREATED", approveUrl: "https://www.sandbox.paypal.com/checkoutnow?token=PP_ORDER" });
    const create = calls.find((c) => c.url.endsWith("/v2/checkout/orders"))!;
    expect(create.headers["PayPal-Request-Id"]).toBe(ORDER_INPUT.idempotencyKey);
    expect(create.headers.Authorization).toBe("Bearer TOKEN");
    expect(create.body).toMatchObject({
      intent: "CAPTURE",
      purchase_units: [{ reference_id: "st_test_ord_1258", custom_id: "st_test", amount: { currency_code: "USD", value: "72.00" } }],
      payment_source: { paypal: { experience_context: { return_url: ORDER_INPUT.returnUrl, cancel_url: ORDER_INPUT.cancelUrl } } },
    });
  });

  it("sends a PayPal-Request-Id on every call that creates or changes something", async () => {
    sandbox();
    const calls = paypal({
      "POST /v2/checkout/orders": { json: { id: "PP_ORDER", status: "CREATED", links: [] } },
      "POST /v2/checkout/orders/PP_ORDER/capture": { json: CAPTURED },
      "POST /v2/payments/captures/CAP_1/refund": { json: { id: "REF_1" } },
      "POST /v1/payments/payouts": { json: { batch_header: { payout_batch_id: "BATCH_1" } } },
    });
    await createOrder(ORDER_INPUT);
    await captureOrder("PP_ORDER", "k:capture");
    await refundCapture("CAP_1", 7_200, "k:refund");
    await createPayout({ receiverEmail: "orders@volta.example", amountCents: 30_000, note: "Payment", idempotencyKey: "k:payout" });
    const writes = calls.filter((c) => c.method === "POST" && !c.url.endsWith("/oauth2/token"));
    expect(writes.map((c) => c.headers["PayPal-Request-Id"])).toEqual([ORDER_INPUT.idempotencyKey, "k:capture", "k:refund", "k:payout"]);
    expect(writes[3]!.body).toMatchObject({ sender_batch_header: { sender_batch_id: "k:payout" }, items: [{ receiver: "orders@volta.example", amount: { value: "300.00" } }] });
  });

  it("reads gross, PayPal's fee and what actually arrives from the capture", async () => {
    sandbox();
    paypal({ "POST /v2/checkout/orders/PP_ORDER/capture": { json: CAPTURED } });
    expect(await captureOrder("PP_ORDER", "k")).toEqual({ orderId: "PP_ORDER", captureId: "CAP_1", grossCents: 7_200, feeCents: 300, netCents: 6_900 });
  });

  it("returns the existing capture when the order was already captured", async () => {
    sandbox();
    paypal({
      "POST /v2/checkout/orders/PP_ORDER/capture": { status: 422, json: { name: "UNPROCESSABLE_ENTITY", details: [{ issue: "ORDER_ALREADY_CAPTURED" }] } },
      "GET /v2/checkout/orders/PP_ORDER": { json: CAPTURED },
    });
    expect((await captureOrder("PP_ORDER", "k")).captureId).toBe("CAP_1");
  });

  it("says so when PayPal declines the payment", async () => {
    sandbox();
    const declined = structuredClone(CAPTURED);
    declined.purchase_units[0]!.payments.captures[0]!.status = "DECLINED";
    paypal({ "POST /v2/checkout/orders/PP_ORDER/capture": { json: declined } });
    await expect(captureOrder("PP_ORDER", "k")).rejects.toMatchObject({ issue: "CAPTURE_DECLINED" });
  });

  it("verifies a webhook with PayPal, and says no without the headers", async () => {
    sandbox();
    const calls = paypal({ "POST /v1/notifications/verify-webhook-signature": { json: { verification_status: "SUCCESS" } } });
    expect(await verifyWebhookSignature(new Headers(), '{"id":"WH-EVT"}')).toBe(false);
    expect(calls).toHaveLength(0);
    const headers = new Headers({ "paypal-auth-algo": "SHA256withRSA", "paypal-cert-url": "https://api.sandbox.paypal.com/cert", "paypal-transmission-id": "T1", "paypal-transmission-sig": "SIG", "paypal-transmission-time": "2026-11-05T15:00:00Z" });
    expect(await verifyWebhookSignature(headers, '{"id":"WH-EVT"}')).toBe(true);
    expect(calls.at(-1)!.body).toMatchObject({ webhook_id: "WH-123", transmission_sig: "SIG", webhook_event: { id: "WH-EVT" } });
    paypal({ "POST /v1/notifications/verify-webhook-signature": { json: { verification_status: "FAILURE" } } });
    expect(await verifyWebhookSignature(headers, '{"id":"WH-EVT"}')).toBe(false);
  });
});

describe("fake mode", () => {
  it("runs the whole checkout without a network: create, approve, capture, with the published fee", async () => {
    fake();
    const calls = paypal({});
    const order = await createOrder(ORDER_INPUT);
    expect(order.approveUrl).toBe(`http://localhost:3000/store/fake-paypal?token=${order.id}`);
    expect((await createOrder(ORDER_INPUT)).id).toBe(order.id);
    await expect(captureOrder(order.id, "k")).rejects.toMatchObject({ issue: "ORDER_NOT_APPROVED" });
    expect(approveFakeOrder(order.id)).toBe(true);
    const capture = await captureOrder(order.id, "k");
    expect(capture).toMatchObject({ grossCents: 7_200, feeCents: 300, netCents: 6_900 });
    expect(await captureOrder(order.id, "k")).toEqual(capture);
    expect((await getOrder(order.id)).status).toBe("COMPLETED");
    expect(calls).toHaveLength(0);
  });
});

describe("money", () => {
  it("turns cents into PayPal's strings and back, exactly", () => {
    expect([toPayPalValue(7_200), toPayPalValue(5), toPayPalValue(123_456)]).toEqual(["72.00", "0.05", "1234.56"]);
    expect([fromPayPalValue("72.00"), fromPayPalValue("0.5"), fromPayPalValue("1234.56"), fromPayPalValue("3")]).toEqual([7_200, 50, 123_456, 300]);
    expect(() => fromPayPalValue("7.2.0")).toThrow();
  });
});
