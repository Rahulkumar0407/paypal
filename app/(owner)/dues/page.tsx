import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyState, ErrorState, SimulatedTag } from "@/components/ui";
import { DetectedPayees } from "@/components/app/DetectedPayees";
import { ExplainedPayees } from "@/components/app/ExplainedPayees";
import { duesInForecast } from "@/components/app/due-state";
import { getVisitorStoreId } from "@/lib/demo";
import { getDues, getForecast, getRecurringPayees } from "@/lib/forecast";
import { formatDay } from "@/lib/shared/dates";
import { formatDollars, formatShortfall } from "@/lib/shared/money";
import type { PayeeKind } from "@/types";

export const metadata: Metadata = { title: "Payments • tmrw" };

const KIND_LABEL: Record<PayeeKind, string> = {
  SUPPLIER: "Supplier Order",
  BILL: "Operating Bill",
  OWNER_TRANSFER: "Bank Transfer",
  LOAN: "Loan Repayment",
};

async function load() {
  const storeId = await getVisitorStoreId();
  try {
    const [forecast, dues, payees] = await Promise.all([
      getForecast(storeId),
      getDues(storeId),
      getRecurringPayees(storeId),
    ]);
    return { storeId, forecast, dues, payees };
  } catch (error) {
    console.error("[dues] could not load:", error instanceof Error ? error.message : error);
    return null;
  }
}

export default async function DuesPage() {
  const data = await load();
  if (!data) {
    return (
      <div className="space-y-6 max-w-xl mx-auto">
        <ErrorState
          title="Couldn't load scheduled payments."
          body="Your funds are safe. Nothing executes without Margin Guard verification. Try again in a minute."
          retryHref="/dues"
        />
      </div>
    );
  }

  const items = duesInForecast(data.dues, data.forecast);
  const firstShort = items.find((i) => i.state === "short");
  const detected = data.payees.filter((p) => p.status === "DETECTED");
  const totalDueCents = items.reduce((sum, item) => sum + item.due.amountCents, 0);

  return (
    <div className="space-y-6 max-w-[960px] mx-auto">
      {/* ── Page Header ── */}
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight">
          Payment Schedule
        </h1>
        <p className="text-sm text-slate-500">
          All vendor payouts, recurring bills, and owner bank transfers scheduled for the next 30 days.
        </p>
      </div>

      {/* ── Highlighted Risk Alert (if any payment needs attention) ── */}
      {firstShort && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 mt-1.5 shrink-0" />
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-800">
                Action Needed
              </span>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">
                {firstShort.due.payeeName} ({formatDollars(firstShort.due.amountCents)}) is {formatShortfall(firstShort.due.amountCents - firstShort.due.readyCents)} short on {formatDay(firstShort.due.dueOn)}.
              </p>
            </div>
          </div>
          <Link
            href="/fix"
            className="shrink-0 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors shadow-xs"
          >
            Fix Shortfall →
          </Link>
        </div>
      )}

      {/* ── Summary Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Total Obligations</span>
          <div className="text-xl sm:text-2xl font-serif font-black text-slate-900 mt-1">
            {formatDollars(totalDueCents)}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Scheduled Count</span>
          <div className="text-xl sm:text-2xl font-serif font-black text-slate-900 mt-1">
            {items.length} Payments
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-xs font-medium text-slate-500">Status</span>
          <div
            className={`text-xl sm:text-2xl font-serif font-black mt-1 ${
              firstShort ? "text-rose-600" : "text-emerald-700"
            }`}
          >
            {firstShort ? "1 Shortfall" : "All Covered"}
          </div>
        </div>
      </div>

      {/* ── Minimal, Clean Payment Schedule ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            Upcoming Payments
          </h2>
          <span className="text-xs text-slate-500">
            Next 30 Days
          </span>
        </div>

        {items.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {items.map(({ due, state }) => {
              const isShort = state === "short";
              const isTight = state === "tight";

              return (
                <div
                  key={due.id}
                  className={`p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    isShort ? "bg-rose-50/20" : "hover:bg-slate-50/60"
                  }`}
                >
                  {/* Recipient & Type */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 truncate">
                        {due.payeeName}
                      </span>
                      {due.simulated && <SimulatedTag />}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="inline-block px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium text-[11px]">
                        {KIND_LABEL[due.kind]}
                      </span>
                      <span>•</span>
                      <span>Due {formatDay(due.dueOn)}</span>
                    </div>
                  </div>

                  {/* Amount & Status */}
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-left sm:text-right">
                      <span className="font-mono text-base font-bold text-slate-900 block">
                        {formatDollars(due.amountCents)}
                      </span>
                      <span
                        className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          isShort
                            ? "bg-rose-100 text-rose-800"
                            : isTight
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {isShort
                          ? `${formatShortfall(due.amountCents - due.readyCents)} short`
                          : "Fully Covered"}
                      </span>
                    </div>

                    {isShort && (
                      <Link
                        href="/fix"
                        className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors shadow-xs"
                      >
                        Fix →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <EmptyState
              title="No payments due."
              body="No upcoming bills or supplier disbursements found for the next 30 days."
            />
          </div>
        )}
      </div>

      {/* ── Secondary Area: Recurring Payment Suggestions ── */}
      {detected.length > 0 && (
        <section
          aria-labelledby="detected-title"
          className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-3"
        >
          <div>
            <h2 id="detected-title" className="text-base font-semibold text-slate-900">
              Recurring Payments Discovered
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              These recurring patterns were detected from historical transactions. Confirm them to keep your cash forecast accurate.
            </p>
          </div>

          <Suspense fallback={<DetectedPayees payees={detected} />}>
            <ExplainedPayees storeId={data.storeId} payees={detected} />
          </Suspense>
        </section>
      )}
    </div>
  );
}
