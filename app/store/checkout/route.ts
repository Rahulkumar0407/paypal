import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { ensureStore, getVisitorStoreId } from "@/lib/demo";
import { createOrder } from "@/lib/paypal";
import { getEnv } from "@/lib/shared/env";
import { recordAttempt, startStoreCheckout } from "@/lib/store";
import { storeMode } from "../store-mode";

/**
 * "Buy with PayPal": the buyer creates their own order (the store checkout is one of the few places allowed to call
 * PayPal, AGENTS.md section 6). A new order, a PayPal order carrying the visitor's storeId, then off to PayPal.
 */
export async function POST(request: NextRequest) {
  const back = (reason: string) => NextResponse.redirect(new URL(`/store?${reason}=1`, request.url), 303);
  if (storeMode() === "off") return back("paypal-off");
  const sku = z.string().min(1).max(40).safeParse((await request.formData()).get("sku"));
  if (!sku.success) return back("error");
  const storeId = await getVisitorStoreId();
  try {
    await ensureStore(storeId);
    const order = await startStoreCheckout(storeId, sku.data);
    const appUrl = getEnv().APP_URL.replace(/\/$/, "");
    const paypal = await createOrder({
      storeId,
      orderId: order.orderId,
      amountCents: order.amountCents,
      description: order.description,
      idempotencyKey: order.idempotencyKey,
      returnUrl: `${appUrl}/store/return`,
      cancelUrl: `${appUrl}/store/cancel`,
    });
    if (!paypal.approveUrl) return back("error");
    await recordAttempt({ storeId, orderId: order.orderId, paypalOrderId: paypal.id, source: "STORE" });
    return NextResponse.redirect(paypal.approveUrl, 303);
  } catch (error) {
    console.error("[store] checkout failed:", error instanceof Error ? error.message : error);
    return back("error");
  }
}
