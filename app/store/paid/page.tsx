import type { Metadata } from "next";
import Link from "next/link";
import { getPaidOrder } from "@/lib/store";
import { formatCents } from "@/lib/shared/money";

export const metadata: Metadata = { title: "Paid" };

/** After the buyer pays: what PayPal took, and what actually arrives in Dunder Mifflin & Co.'s PayPal (the forecast counts that). */
export default async function PaidPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const orderId = (await searchParams).order;
  const paid = typeof orderId === "string" ? await getPaidOrder(orderId).catch(() => null) : null;
  return (
    <div className="min-h-dvh bg-paper px-5 py-12 lg:px-12 lg:py-20">
      <main className="mx-auto max-w-[560px] space-y-6">
        {paid ? (
          <>
            <h1 className="font-serif text-[2.5rem] leading-tight text-ink">Paid. Thank you.</h1>
            <div className="rounded-card bg-surface p-6">
              <p className="text-[15px] text-ink-muted">Dunder Mifflin & Co. order #{paid.orderNumber}</p>
              <dl className="mt-3 space-y-2 text-[16px] leading-6">
                <Row term="You paid" value={formatCents(paid.grossCents)} />
                <Row term="PayPal's fee" value={formatCents(paid.feeCents)} />
                <Row term="Arrives in Dunder Mifflin & Co.'s PayPal" value={formatCents(paid.netCents)} strong />
              </dl>
              <p className="mt-4 text-[13px] leading-5 break-all text-ink-muted">
                PayPal order {paid.paypalOrderId} · payment {paid.paypalCaptureId}
              </p>
            </div>
            <p className="text-[16px] leading-7 text-ink-muted">tmrw&apos;s forecast now counts the {formatCents(paid.netCents)} that arrived.</p>
          </>
        ) : (
          <>
            <h1 className="font-serif text-[2.5rem] leading-tight text-ink">We couldn&apos;t find that payment.</h1>
            <p className="text-[16px] leading-7 text-ink-muted">If you just paid, PayPal may still be confirming it. Wait a minute, then reload this page.</p>
          </>
        )}
        <div className="flex flex-wrap gap-4 text-[15px]">
          <Link href="/today" className="inline-flex min-h-11 items-center rounded-control bg-brand px-4 font-medium text-white hover:bg-ink">
            See the forecast in tmrw
          </Link>
          <Link href="/store" className="inline-flex min-h-11 items-center text-ink underline decoration-ink/30 underline-offset-4">
            Back to the shop
          </Link>
        </div>
      </main>
    </div>
  );
}

function Row({ term, value, strong = false }: { term: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-ink-muted">{term}</dt>
      <dd className={`tabular ${strong ? "font-semibold text-ink" : "text-ink"}`}>{value}</dd>
    </div>
  );
}
