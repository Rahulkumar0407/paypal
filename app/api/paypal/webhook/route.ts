import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { captureOrder, handleWebhook, verifyWebhookSignature } from "@/lib/paypal";
import { applyPayPalEvent, recordCapture } from "@/lib/store";

/**
 * PayPal webhooks (AGENTS.md section 6): verify the signature first (a bad one changes nothing), store the event id
 * (a repeat is ignored), find the visitor's copy from custom_id, update the order. Handles CHECKOUT.ORDER.APPROVED,
 * PAYMENT.CAPTURE.COMPLETED, PAYMENT.CAPTURE.DENIED and PAYMENT.CAPTURE.REFUNDED. Returns 2xx quickly.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const { status, body } = await handleWebhook(
    { rawBody, headers: request.headers },
    {
      verify: verifyWebhookSignature,
      apply: async (event, payload) => {
        const { result, captureNeeded } = await applyPayPalEvent(event, payload);
        // An approved order nobody captured (the buyer closed the tab before returning): capture it now.
        if (captureNeeded) {
          try {
            await recordCapture(captureNeeded.paypalOrderId, await captureOrder(captureNeeded.paypalOrderId, captureNeeded.idempotencyKey));
          } catch (error) {
            console.error("[paypal] capture after approval failed:", error instanceof Error ? error.message : error);
          }
        }
        if (result === "applied") revalidatePath("/", "layout");
        return result;
      },
    },
  );
  return NextResponse.json(body, { status });
}
