import type { Metadata } from "next";
import Link from "next/link";
import type { Receipt as ReceiptData } from "@/types";
import { EmptyState, ErrorState, Receipt, RefereeCard } from "@/components/ui";
import { ACTION_WORD, DECISION_FILL } from "@/components/ui/meaning";
import { FILTERS, clockTime, filterFrom, newestFirst, outcomeLine, receiptNo } from "@/components/app/receipt-words";
import { getVisitorStoreId } from "@/lib/demo";
import { listReceipts } from "@/lib/guard";
import { formatDay } from "@/lib/shared/dates";
import { formatCents } from "@/lib/shared/money";

export const metadata: Metadata = { title: "Receipts & Audit Trail • tmrw" };

/** Every Guard decision, newest first, filterable by Approved / Escalated / Blocked. */
export default async function ReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const show = filterFrom((await searchParams).show);
  const storeId = await getVisitorStoreId();
  const receipts = await listReceipts(storeId).then(newestFirst, (error: unknown) => {
    console.error("[receipts] could not load:", error instanceof Error ? error.message : error);
    return null;
  });

  if (!receipts) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <ErrorState
          title="Couldn't load audit receipts."
          body="Receipts are immutable: they only gain new execution lines. Try again in a minute."
          retryHref="/receipts"
        />
      </div>
    );
  }

  const filter = FILTERS.find((f) => f.key === show)!;
  const shown = filter.decision ? receipts.filter((r) => r.decision.decision === filter.decision) : receipts;
  const latest = shown[0];

  return (
    <div className="space-y-8 max-w-[960px] mx-auto">
      {/* ── Page Header ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-600">
            Immutable Audit Trail
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-black text-slate-900 tracking-tight">
          Every Margin Guard decision and rule verification.
        </h1>
        <p className="max-w-[75ch] text-sm sm:text-base text-slate-600 leading-relaxed">
          Before any money moves or any recovery reminder is sent, the Margin Guard executes 9 pure deterministic rules. Each evaluation generates an append-only receipt with PayPal transaction references.
        </p>
      </div>

      {receipts.length === 0 ? (
        <div className="py-8 bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm">
          <EmptyState
            title="No receipts recorded yet."
            body="The first receipt prints immediately when an agent suggests a checkout reminder or when you evaluate a gap fix."
            action={{ label: "Explore Gap Fixes", href: "/fix" }}
          />
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] items-start">
          <section aria-labelledby="list-title" className="min-w-0 space-y-4">
            <h2 id="list-title" className="sr-only">
              Receipts, newest first
            </h2>

            {/* Filter Navigation */}
            <nav aria-label="Show receipts" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
              <ul className="flex w-max gap-2 pb-1">
                {FILTERS.map((f) => {
                  const count = f.decision ? receipts.filter((r) => r.decision.decision === f.decision).length : receipts.length;
                  const active = f.key === show;
                  return (
                    <li key={f.key}>
                      <Link
                        href={f.key === "all" ? "/receipts" : `/receipts?show=${f.key}`}
                        aria-current={active ? "page" : undefined}
                        className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium transition-all ${
                          active
                            ? "bg-slate-900 font-semibold text-white shadow-sm"
                            : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {f.decision && <FilterMark decision={f.decision} />}
                        <span>{f.label}</span>
                        <span
                          className={`font-mono text-[11px] px-1.5 py-0.2 rounded ${
                            active ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {count}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Receipt Item List */}
            {shown.length > 0 ? (
              <ol className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 shadow-sm overflow-hidden px-5 sm:px-6">
                {shown.map((r) => (
                  <ReceiptRow key={r.id} receipt={r} />
                ))}
              </ol>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm">
                <EmptyState
                  title={filter.key === "escalated" ? "No pending escalations." : `No ${filter.label.toLowerCase()} receipts recorded.`}
                  body="No records match the active filter criteria."
                  action={{ label: "Show all receipts", href: "/receipts" }}
                />
              </div>
            )}
          </section>

          {/* Newest Receipt Preview */}
          {latest && (
            <aside aria-label="The newest receipt in this list" className="hidden lg:sticky lg:top-8 lg:block space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-500 px-1">
                <span>Latest Audit Record</span>
                <span className="font-semibold text-slate-700">Live Thermal Output</span>
              </div>
              <div className="flex justify-center rounded-2xl bg-slate-900 p-6 sm:p-8 shadow-sm border border-slate-800">
                <Receipt receipt={latest} animateStamp={false} />
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}

function ReceiptRow({ receipt }: { receipt: ReceiptData }) {
  const { proposal, decision } = receipt;
  return (
    <li className="py-4.5">
      <Link href={`/receipts/${receipt.id}`} className="group block space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <RefereeCard decision={decision.decision} size="sm" />
          <span className="font-mono text-sm font-bold text-slate-900">
            {formatCents(proposal.amountCents)}
          </span>
        </div>
        <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
          {ACTION_WORD[proposal.type]}: {proposal.target.label}
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          {decision.headlineReason}
        </p>
        {outcomeLine(receipt) && (
          <div className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded inline-block">
            {outcomeLine(receipt)}
          </div>
        )}
        <div className="text-[11px] font-mono text-slate-400 pt-1">
          {receiptNo(receipt)} • {formatDay(decision.demoDate)} at {clockTime(decision.decidedAt)}
        </div>
      </Link>
    </li>
  );
}

function FilterMark({ decision }: { decision: "APPROVE" | "ESCALATE" | "BLOCK" }) {
  return (
    <span
      aria-hidden
      className={`inline-block h-2 w-2 rounded-full ${DECISION_FILL[decision]}`}
    />
  );
}
