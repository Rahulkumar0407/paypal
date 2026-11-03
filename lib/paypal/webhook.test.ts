import { describe, expect, it } from "vitest";
import { handleWebhook, normalizeEvent, type PayPalWebhookEvent } from "./webhook";

const APPROVED = { id: "WH-1", event_type: "CHECKOUT.ORDER.APPROVED", resource: { id: "PP_ORDER", purchase_units: [{ custom_id: "st_test" }] } };
const COMPLETED = {
  id: "WH-2",
  event_type: "PAYMENT.CAPTURE.COMPLETED",
  resource: {
    id: "CAP_1",
    amount: { value: "72.00" },
    custom_id: "st_test",
    supplementary_data: { related_ids: { order_id: "PP_ORDER" } },
    seller_receivable_breakdown: { gross_amount: { value: "72.00" }, paypal_fee: { value: "3.00" }, net_amount: { value: "69.00" } },
  },
};
const DENIED = { id: "WH-3", event_type: "PAYMENT.CAPTURE.DENIED", resource: { id: "CAP_2", amount: { value: "119.00" }, custom_id: "st_test", supplementary_data: { related_ids: { order_id: "PP_2" } } } };
const REFUNDED = { id: "WH-4", event_type: "PAYMENT.CAPTURE.REFUNDED", resource: { id: "REF_1", amount: { value: "72.00" }, custom_id: "st_test", links: [{ rel: "up", href: "https://api.sandbox.paypal.com/v2/payments/captures/CAP_1" }] } };

describe("reading PayPal's events", () => {
  it("turns the four events we act on into plain shapes", () => {
    expect(normalizeEvent(APPROVED)).toEqual({ kind: "ORDER_APPROVED", eventId: "WH-1", eventType: "CHECKOUT.ORDER.APPROVED", storeId: "st_test", paypalOrderId: "PP_ORDER" });
    expect(normalizeEvent(COMPLETED)).toMatchObject({ kind: "CAPTURE_COMPLETED", storeId: "st_test", paypalOrderId: "PP_ORDER", capture: { captureId: "CAP_1", grossCents: 7_200, feeCents: 300, netCents: 6_900 } });
    expect(normalizeEvent(DENIED)).toMatchObject({ kind: "CAPTURE_DENIED", paypalOrderId: "PP_2", captureId: "CAP_2" });
    expect(normalizeEvent(REFUNDED)).toMatchObject({ kind: "CAPTURE_REFUNDED", captureId: "CAP_1", refundId: "REF_1", amountCents: 7_200 });
    expect(normalizeEvent({ id: "WH-5", event_type: "BILLING.PLAN.CREATED", resource: {} })).toMatchObject({ kind: "OTHER" });
    expect(normalizeEvent({ nope: true })).toBeNull();
  });
});

/** A pretend store that keeps each event id once, like the WebhookEvent table's primary key. */
function store() {
  const seen = new Set<string>();
  const applied: PayPalWebhookEvent[] = [];
  return {
    applied,
    apply: async (event: PayPalWebhookEvent) => {
      if (seen.has(event.eventId)) return "duplicate" as const;
      seen.add(event.eventId);
      applied.push(event);
      return "applied" as const;
    },
  };
}
const post = (body: unknown, verified = true, s = store()) =>
  handleWebhook({ rawBody: typeof body === "string" ? body : JSON.stringify(body), headers: new Headers() }, { verify: async () => verified, apply: s.apply });

describe("the webhook flow", () => {
  it("rejects a bad signature and changes nothing", async () => {
    const s = store();
    expect(await post(COMPLETED, false, s)).toEqual({ status: 400, body: { result: "bad signature" } });
    expect(s.applied).toHaveLength(0);
  });

  it("applies a verified event once; the same event posted twice changes things once", async () => {
    const s = store();
    expect(await post(COMPLETED, true, s)).toEqual({ status: 200, body: { result: "applied" } });
    expect(await post(COMPLETED, true, s)).toEqual({ status: 200, body: { result: "duplicate" } });
    expect(s.applied).toHaveLength(1);
  });

  it("refuses a body that isn't JSON or isn't a PayPal event", async () => {
    expect((await post("not json")).status).toBe(400);
    expect((await post({ hello: "world" })).status).toBe(400);
  });

  it("asks PayPal to retry when the event couldn't be recorded", async () => {
    const r = await handleWebhook({ rawBody: JSON.stringify(APPROVED), headers: new Headers() }, { verify: async () => true, apply: async () => Promise.reject(new Error("db down")) });
    expect(r.status).toBe(500);
  });
});
