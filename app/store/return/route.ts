import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { captureOrder, PayPalError } from "@/lib/paypal";
import { findAttempt, recordCapture, recordDenied } from "@/lib/store";

/**
 * The buyer is back from PayPal (`?token=<PayPal order id>&PayerID=...`). Capture now, so the order updates at once;
 * the webhook confirms it later, and whichever arrives second changes nothing.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const to = (path: string) => NextResponse.redirect(new URL(path, request.url), 303);
  if (!token) return to("/store?error=1");
  const attempt = await findAttempt(token).catch(() => null);
  if (!attempt) return to("/store?error=1");
  try {
    const capture = await captureOrder(token, `${attempt.id}:capture`);
    await recordCapture(token, capture);
    revalidatePath("/", "layout");
    return to(`/store/paid?order=${encodeURIComponent(attempt.orderId)}`);
  } catch (error) {
    if (error instanceof PayPalError && error.issue === "CAPTURE_DECLINED") {
      await recordDenied(token).catch(() => null);
      return to("/store?declined=1");
    }
    console.error("[store] capture on return failed:", error instanceof Error ? error.message : error);
    return to("/store?error=1");
  }
}
