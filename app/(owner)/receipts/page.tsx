import type { Metadata } from "next";
import Link from "next/link";
import type { Receipt as ReceiptData } from "@/types";
import { EmptyState, ErrorState, PageSentence, Receipt, RefereeCard } from "@/components/ui";
import { ACTION_WORD, DECISION_FILL } from "@/components/ui/meaning";
import { FILTERS, clockTime, filterFrom, newestFirst, outcomeLine, receiptNo } from "@/components/app/receipt-words";
import { getVisitorStoreId } from "@/lib/demo";
import { listReceipts } from "@/lib/guard";
import { formatDay } from "@/lib/shared/dates";
import { formatCents } from "@/lib/shared/money";

export const metadata: Metadata = { title: "Receipts" };

/** Every Guard decision, newest first, filterable by Approved / Escalated / Blocked. The newest one prints alongside on a laptop. */
export default async function ReceiptsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const show = filterFrom((await searchParams).show);
  const storeId = await getVisitorStoreId();
  const receipts = await listReceipts(storeId).then(newestFirst, (error: unknown) => {
    console.error("[receipts] could not load:", error instanceof Error ? error.message : error);
    return null;
  });

  if (!receipts) {
    return (
      <div className="space-y-8">
        <PageSentence>Every safety check NeverShort ran, and why it said yes, wait or no.</PageSentence>
        <ErrorState
          title="Couldn't load your receipts."
          body="Receipts are never changed or lost: they only gain new lines. Try again in a minute."
          retryHref="/receipts"
        />
      </div>
    );
  }

  const filter = FILTERS.find((f) => f.key === show)!;
  const shown = filter.decision ? receipts.filter((r) => r.decision.decision === filter.decision) : receipts;
  const latest = shown[0];

  return (
    <div className="space-y-8 lg:space-y-10">
      <div className="space-y-4">
        <PageSentence>Every safety check NeverShort ran, and why it said yes, wait or no.</PageSentence>
        <p className="max-w-[62ch] text-[16px] leading-7 text-ink-muted">
          Before NeverShort does anything with money, the Margin Guard checks it against eight fixed rules. Each check prints a
          receipt, like a shop till, so you can see exactly why.
        </p>
      </div>

      {receipts.length === 0 ? (
        <EmptyState
          title="No receipts yet."
          body="The first one prints when NeverShort suggests something or you pick a fix."
          action={{ label: "See ways to fix a gap", href: "/fix" }}
        />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-12">
          <section aria-labelledby="list-title" className="min-w-0 space-y-4">
            <h2 id="list-title" className="sr-only">
              Receipts, newest first
            </h2>
            <nav aria-label="Show receipts" className="-mx-5 overflow-x-auto px-5 [scrollbar-width:none] sm:mx-0 sm:px-0">
              <ul className="flex w-max gap-2">
                {FILTERS.map((f) => {
                  const count = f.decision ? receipts.filter((r) => r.decision.decision === f.decision).length : receipts.length;
                  const active = f.key === show;
                  return (
                    <li key={f.key}>
                      <Link
                        href={f.key === "all" ? "/receipts" : `/receipts?show=${f.key}`}
                        aria-current={active ? "page" : undefined}
                        className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-[15px] whitespace-nowrap ${
                          active ? "bg-brand font-semibold text-white" : "bg-paper text-ink ring-1 ring-line ring-inset hover:bg-surface"
                        }`}
                      >
                        {f.decision ? <FilterMark decision={f.decision} /> : null}
                        {f.label}
                        <span className={`tabular ${active ? "text-white/80" : "text-ink-muted"}`}>{count}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {shown.length > 0 ? (
              <ol className="divide-y divide-line rounded-card bg-paper px-5 ring-1 ring-ink/[0.06] lg:px-6">
                {shown.map((r) => (
                  <ReceiptRow key={r.id} receipt={r} />
                ))}
              </ol>
            ) : (
              <EmptyState
                title={filter.key === "escalated" ? "Nothing needs your OK." : `Nothing ${filter.label.toLowerCase()} yet.`}
                body="Nothing so far fits this filter."
                action={{ label: "Show every receipt", href: "/receipts" }}
              />
            )}
          </section>

          {latest ? (
            <aside aria-label="The newest receipt in this list" className="hidden lg:sticky lg:top-8 lg:block">
              <p className="mb-3 text-[15px] text-ink-muted">Newest, printed in full</p>
              <div className="flex justify-center rounded-card bg-brand px-6 py-10">
                <Receipt receipt={latest} animateStamp={false} />
              </div>
            </aside>
          ) : null}
        </div>
      )}
    </div>
  );
}

function ReceiptRow({ receipt }: { receipt: ReceiptData }) {
  const { proposal, decision } = receipt;
  return (
    <li>
      <Link href={`/receipts/${receipt.id}`} className="group block py-4">
        <span className="flex items-center justify-between gap-4">
          <RefereeCard decision={decision.decision} size="sm" />
          <span className="tabular text-[15px] font-semibold text-ink">{formatCents(proposal.amountCents)}</span>
        </span>
        <span className="mt-1.5 block text-[16px] leading-6 font-semibold text-ink group-hover:underline group-hover:decoration-ink/30 group-hover:underline-offset-4">
          {ACTION_WORD[proposal.type]}: {proposal.target.label}
        </span>
        <span className="mt-0.5 block text-[15px] leading-6 text-ink-muted">{decision.headlineReason}</span>
        {outcomeLine(receipt) ? <span className="mt-1 block text-[15px] leading-6 text-ink">{outcomeLine(receipt)}</span> : null}
        <span className="mt-0.5 block text-[13px] leading-5 text-ink-muted">
          {receiptNo(receipt)}, {formatDay(decision.demoDate)} at {clockTime(decision.decidedAt)}
        </span>
      </Link>
    </li>
  );
}

function FilterMark({ decision }: { decision: "APPROVE" | "ESCALATE" | "BLOCK" }) {
  return (
    <span aria-hidden className={`inline-block h-[13px] w-[10px] -rotate-[11deg] rounded-[2px] shadow-[1px_1.5px_0_rgb(20_32_27/0.3)] ${DECISION_FILL[decision]}`} />
  );
}
