import { z } from "zod";
import type { PayPalCapture } from "@/types";
import { fromPayPalValue, publishedFeeCents } from "./client";

/**
 * PayPal webhooks: verify first, then turn the event into one of four plain shapes. No database here: the route
 * passes an `apply` that records the event (lib/store), so this flow is unit-tested on its own.
 */

export type PayPalWebhookEvent =
  | { kind: "ORDER_APPROVED"; eventId: string; eventType: string; storeId: string | null; paypalOrderId: string }
  | { kind: "CAPTURE_COMPLETED"; eventId: string; eventType: string; storeId: string | null; paypalOrderId: string | null; capture: PayPalCapture }
  | { kind: "CAPTURE_DENIED"; eventId: string; eventType: string; storeId: string | null; paypalOrderId: string | null; captureId: string }
  | { kind: "CAPTURE_REFUNDED"; eventId: string; eventType: string; storeId: string | null; captureId: string | null; refundId: string; amountCents: number }
  | { kind: "OTHER"; eventId: string; eventType: string; storeId: null };

const ENVELOPE = z.object({ id: z.string().min(1), event_type: z.string().min(1), resource: z.record(z.string(), z.unknown()) });
const MONEY = z.object({ value: z.string() });
const APPROVED = z.object({ id: z.string(), purchase_units: z.array(z.object({ custom_id: z.string().optional() })).optional() });
const CAPTURE = z.object({
  id: z.string(),
  amount: MONEY,
  custom_id: z.string().optional(),
  supplementary_data: z.object({ related_ids: z.object({ order_id: z.string().optional() }).optional() }).optional(),
  seller_receivable_breakdown: z.object({ gross_amount: MONEY, paypal_fee: MONEY.optional(), net_amount: MONEY.optional() }).optional(),
});
const REFUND = z.object({ id: z.string(), amount: MONEY, custom_id: z.string().optional(), links: z.array(z.object({ rel: z.string(), href: z.string() })).optional() });

/** One plain shape per event type we act on. Anything else is OTHER (acknowledged, not acted on). */
export function normalizeEvent(raw: unknown): PayPalWebhookEvent | null {
  const envelope = ENVELOPE.safeParse(raw);
  if (!envelope.success) return null;
  const { id: eventId, event_type: eventType, resource } = envelope.data;
  switch (eventType) {
    case "CHECKOUT.ORDER.APPROVED": {
      const r = APPROVED.safeParse(resource);
      return r.success ? { kind: "ORDER_APPROVED", eventId, eventType, storeId: r.data.purchase_units?.[0]?.custom_id ?? null, paypalOrderId: r.data.id } : null;
    }
    case "PAYMENT.CAPTURE.COMPLETED":
    case "PAYMENT.CAPTURE.DENIED": {
      const r = CAPTURE.safeParse(resource);
      if (!r.success) return null;
      const c = r.data;
      const paypalOrderId = c.supplementary_data?.related_ids?.order_id ?? null;
      if (eventType === "PAYMENT.CAPTURE.DENIED") return { kind: "CAPTURE_DENIED", eventId, eventType, storeId: c.custom_id ?? null, paypalOrderId, captureId: c.id };
      const gross = fromPayPalValue(c.seller_receivable_breakdown?.gross_amount.value ?? c.amount.value);
      const fee = c.seller_receivable_breakdown?.paypal_fee ? fromPayPalValue(c.seller_receivable_breakdown.paypal_fee.value) : publishedFeeCents(gross);
      const net = c.seller_receivable_breakdown?.net_amount ? fromPayPalValue(c.seller_receivable_breakdown.net_amount.value) : gross - fee;
      return {
        kind: "CAPTURE_COMPLETED",
        eventId,
        eventType,
        storeId: c.custom_id ?? null,
        paypalOrderId,
        capture: { orderId: paypalOrderId ?? "", captureId: c.id, grossCents: gross, feeCents: fee, netCents: net },
      };
    }
    case "PAYMENT.CAPTURE.REFUNDED": {
      const r = REFUND.safeParse(resource);
      if (!r.success) return null;
      const up = r.data.links?.find((l) => l.rel === "up")?.href ?? null;
      const captureId = up ? (up.split("/").filter(Boolean).at(-1) ?? null) : null;
      return { kind: "CAPTURE_REFUNDED", eventId, eventType, storeId: r.data.custom_id ?? null, captureId, refundId: r.data.id, amountCents: fromPayPalValue(r.data.amount.value) };
    }
    default:
      return { kind: "OTHER", eventId, eventType, storeId: null };
  }
}

export type ApplyResult = "applied" | "duplicate" | "ignored";

export interface WebhookDeps {
  verify(headers: Headers, rawBody: string): Promise<boolean>;
  /** Records the event once (by its event id) and updates the visitor's copy. Must be idempotent. */
  apply(event: PayPalWebhookEvent, payload: unknown): Promise<ApplyResult>;
}

/**
 * The webhook flow: signature first (a bad one changes nothing), then the event, once. Returns quickly with 2xx for
 * anything handled or ignored, 400 for a bad signature or body, and 500 only when recording failed (PayPal retries).
 */
export async function handleWebhook(request: { rawBody: string; headers: Headers }, deps: WebhookDeps): Promise<{ status: number; body: { result: string } }> {
  let payload: unknown;
  try {
    payload = JSON.parse(request.rawBody);
  } catch {
    return { status: 400, body: { result: "not json" } };
  }
  if (!(await deps.verify(request.headers, request.rawBody))) return { status: 400, body: { result: "bad signature" } };
  const event = normalizeEvent(payload);
  if (!event) return { status: 400, body: { result: "not a PayPal event we understand" } };
  try {
    return { status: 200, body: { result: await deps.apply(event, payload) } };
  } catch (error) {
    console.error("[paypal] webhook could not be recorded:", error instanceof Error ? error.message : error);
    return { status: 500, body: { result: "not recorded, please retry" } };
  }
}
