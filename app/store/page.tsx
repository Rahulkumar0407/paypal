import type { Metadata } from "next";
import Link from "next/link";
import { getVisitorStoreId } from "@/lib/demo";
import { listProducts } from "@/lib/store";
import { formatDollars } from "@/lib/shared/money";

export const metadata: Metadata = { title: "Loop Audio store" };

/**
 * The buyer's side: Loop Audio's shop. Owner: Person 2.
 * TODO(Person 2, P2-1): PayPal checkout per product (Orders v2, sandbox), return and cancel pages.
 */
export default async function StorePage() {
  const storeId = await getVisitorStoreId();
  const products = await listProducts(storeId);

  return (
    <div className="min-h-dvh bg-paper">
      <div className="bg-brand px-5 py-2 text-[13px] leading-5 text-white lg:px-12">
        <p className="mx-auto flex max-w-[1160px] flex-wrap justify-between gap-x-4">
          <span>Sandbox store: payments go through the PayPal sandbox, so no real money moves.</span>
          <Link href="/" className="font-medium underline decoration-white/40 underline-offset-4 hover:decoration-white">
            Back to NeverShort
          </Link>
        </p>
      </div>

      <header className="mx-auto max-w-[1160px] px-5 pt-10 lg:px-12 lg:pt-16">
        <h1 className="font-serif text-[3rem] leading-none text-ink lg:text-[4rem]">Loop Audio</h1>
        <p className="mt-3 max-w-[46ch] text-[17px] leading-7 text-ink-muted">
          Headphones, earbuds and the spare parts that keep them going. Shipped from Portland, Oregon.
        </p>
      </header>

      <main className="mx-auto max-w-[1160px] px-5 pt-10 pb-20 lg:px-12">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <li key={p.id} className="flex flex-col rounded-card bg-surface p-5">
              <div aria-hidden className="flex aspect-[5/2] items-end rounded-tile bg-paper p-4 sm:aspect-[4/3]">
                <span className="font-serif text-[1.75rem] leading-[1.05] text-ink">{p.name.replace(/ (wireless|monitor|volume-safe) headphones$/, "")}</span>
              </div>
              <h2 className="mt-4 text-[16px] leading-6 font-semibold text-ink">{p.name}</h2>
              <p className="mt-1 flex-1 text-[14px] leading-[1.45] text-ink-muted">{p.description}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="font-serif text-[1.75rem] leading-none text-ink">{formatDollars(p.priceCents)}</span>
                <button
                  type="button"
                  disabled
                  className="min-h-11 rounded-control bg-ink px-4 text-[15px] font-medium text-white disabled:opacity-45"
                  title="PayPal checkout is connected in task P2-1"
                >
                  Buy with PayPal
                </button>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-[14px] text-ink-muted">PayPal checkout connects in the next build. Prices in US dollars.</p>
      </main>
    </div>
  );
}
