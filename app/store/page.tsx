import type { Metadata } from "next";
import Link from "next/link";
import { PayPalStatus, paypalSetup } from "@/components/app/PayPalStatus";
import { getVisitorStoreId } from "@/lib/demo";
import { listProducts } from "@/lib/store";
import { formatDollars } from "@/lib/shared/money";
import { storeMode } from "./store-mode";

export const metadata: Metadata = { title: "Loop Audio store" };

const NOTICE: Record<string, string> = {
  cancelled: "You cancelled at PayPal, so no payment was made.",
  declined: "PayPal declined that payment, so nothing was taken. Try again in a minute.",
  error: "That checkout didn't go through, and nothing was taken. Try again in a minute.",
  "paypal-off": "PayPal isn't set up yet, so checkout is switched off.",
};

/** The buyer's side: Loop Audio's shop, with PayPal checkout (sandbox, or fake mode for tests and offline demos). */
export default async function StorePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const notice = Object.keys(NOTICE).find((k) => params[k] !== undefined);
  const storeId = await getVisitorStoreId();
  const products = await listProducts(storeId).catch(() => []);
  const mode = storeMode();
  const banner =
    mode === "sandbox"
      ? "Test store: payments use PayPal's test mode, so no real money moves."
      : mode === "fake"
        ? "Test store: PayPal is in fake mode, so payments are simulated and no money moves."
        : "Test store: PayPal isn't set up yet, so checkout is switched off.";

  return (
    <div className="min-h-dvh bg-paper">
      <div className="bg-brand px-5 py-2 text-[13px] leading-5 text-white lg:px-12">
        <p className="mx-auto flex max-w-[1160px] flex-wrap justify-between gap-x-4">
          <span>{banner}</span>
          <Link href="/today" className="font-medium underline decoration-white/40 underline-offset-4 hover:decoration-white">
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

      <main className="mx-auto max-w-[1160px] space-y-8 px-5 pt-10 pb-20 lg:px-12">
        {notice ? (
          <p role="status" className="flex max-w-[60ch] items-start gap-2 rounded-tile bg-surface p-4 text-[15px] leading-6 text-ink">
            <span aria-hidden className="mt-2 inline-block size-2 shrink-0 rounded-full bg-ink-muted" />
            {NOTICE[notice]}
          </p>
        ) : null}
        {mode === "off" ? <PayPalStatus setup={paypalSetup()} /> : null}

        {products.length === 0 ? (
          <p className="text-[16px] text-ink-muted">The shop is being set up. Reload in a moment.</p>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <li key={p.id} className="flex flex-col rounded-card bg-surface p-5">
                <div aria-hidden className="flex aspect-[5/2] items-end rounded-tile bg-paper p-4 sm:aspect-[4/3]">
                  <span className="font-serif text-[1.75rem] leading-[1.05] text-ink">{p.name.replace(/ (wireless|monitor|volume-safe) headphones$/, "")}</span>
                </div>
                <h2 className="mt-4 text-[16px] leading-6 font-semibold text-ink">{p.name}</h2>
                <p className="mt-1 flex-1 text-[14px] leading-[1.45] text-ink-muted">{p.description}</p>
                <form action="/store/checkout" method="post" className="mt-4 flex items-center justify-between gap-3">
                  <span className="font-serif text-[1.75rem] leading-none text-ink">{formatDollars(p.priceCents)}</span>
                  <input type="hidden" name="sku" value={p.sku} />
                  <button
                    type="submit"
                    disabled={mode === "off"}
                    className="min-h-11 rounded-control bg-ink px-4 text-[15px] font-medium text-white hover:bg-brand disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Buy with PayPal
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <p className="text-[14px] text-ink-muted">Prices in US dollars. One item per checkout.</p>
      </main>
    </div>
  );
}
