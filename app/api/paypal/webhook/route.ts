import { NextResponse } from "next/server";

/**
 * Owner: Person 2. PayPal webhook endpoint.
 * TODO(Person 2, P2-2): read the raw body, verifyWebhookSignature (lib/paypal), store the event id,
 * ignore repeats, find the visitor's copy from custom_id, update the order. Return 2xx quickly.
 */
export async function POST() {
  return NextResponse.json({ error: "Webhook handling arrives in task P2-2." }, { status: 501 });
}
