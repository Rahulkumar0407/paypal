import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFakeOrder, restoreFakeOrder } from "@/lib/paypal";
import { findAttempt } from "@/lib/store";
import { formatCents } from "@/lib/shared/money";
import { storeMode } from "../store-mode";

export const metadata: Metadata = { title: "Fake PayPal checkout" };

/**
 * Fake mode only: stands in for PayPal's approval page, so the whole payment flow works offline and in tests.
 * It says plainly that it is not PayPal. With the sandbox keys set, links go to the real PayPal sandbox instead.
 */
export default async function FakePayPalPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (storeMode() !== "fake") notFound();
  const token = (await searchParams).token;
  if (typeof token !== "string") notFound();
  let order = getFakeOrder(token);
  if (!order) {
    const attempt = await findAttempt(token).catch(() => null);
    if (attempt) order = restoreFakeOrder({ paypalOrderId: token, storeId: attempt.storeId, orderId: attempt.orderId, amountCents: attempt.amountCents, description: `Loop Audio order #${attempt.orderNumber}` });
  }

  return (
    <div className="min-h-dvh bg-surface px-5 py-12 lg:py-20">
      <main className="mx-auto max-w-[440px] space-y-5">
        <p className="rounded-tile border border-dashed border-ink/40 bg-paper px-4 py-3 text-[14px] leading-5 text-ink">
          <span className="font-semibold">Fake PayPal (test mode).</span> This page stands in for PayPal so the demo works without the sandbox. No money moves.
        </p>
        {order && order.status === "CREATED" ? (
          <div className="rounded-card bg-paper p-6 ring-1 ring-ink/[0.08]">
            <p className="text-[15px] text-ink-muted">{order.description}</p>
            <p className="mt-2 font-serif text-[2.75rem] leading-none text-ink tabular">{formatCents(order.amountCents)}</p>
            <p className="mt-3 text-[14px] leading-5 text-ink-muted">Paying as the test buyer. PayPal&apos;s fee is taken from the shop, not from you.</p>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                href={`/store/fake-paypal/approve?token=${encodeURIComponent(token)}`}
                className="inline-flex min-h-12 items-center justify-center rounded-control bg-brand px-4 text-[16px] font-semibold text-white hover:bg-ink"
              >
                Pay {formatCents(order.amountCents)}
              </Link>
              <Link
                href={`${order.cancelUrl}?token=${encodeURIComponent(token)}`}
                className="inline-flex min-h-11 items-center justify-center text-[15px] text-ink underline decoration-ink/30 underline-offset-4"
              >
                Cancel and go back to the shop
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-card bg-paper p-6 ring-1 ring-ink/[0.08]">
            <p className="text-[17px] leading-7 text-ink">{order ? "This payment has already been made." : "This test checkout link isn't valid any more."}</p>
            <Link href="/store" className="mt-4 inline-flex text-[15px] text-ink underline decoration-ink/30 underline-offset-4">
              Back to the shop
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
