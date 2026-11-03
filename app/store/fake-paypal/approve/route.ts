import { notFound } from "next/navigation";
import { NextResponse, type NextRequest } from "next/server";
import { approveFakeOrder, getFakeOrder } from "@/lib/paypal";
import { storeMode } from "../../store-mode";

/** Fake mode only: the test buyer pressed Pay on the fake checkout. Approve, then return to the store like PayPal does. */
export async function GET(request: NextRequest) {
  if (storeMode() !== "fake") notFound();
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const order = getFakeOrder(token);
  if (!order) return NextResponse.redirect(new URL("/store?error=1", request.url), 303);
  approveFakeOrder(token);
  const back = new URL(order.returnUrl);
  back.searchParams.set("token", token);
  back.searchParams.set("PayerID", "FAKEBUYER");
  return NextResponse.redirect(back, 303);
}
