import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui";
import { UnifiedForecastChart } from "@/components/app/UnifiedForecastChart";
import { CollapsibleSection } from "@/components/app/CollapsibleSection";
import { DuesList, DuesTable } from "@/components/dashboard/DuesTable";
import { OrdersList, OrdersTable } from "@/components/dashboard/OrdersTable";
import { dueRows, orderRows } from "@/components/dashboard/rows";
import { getVisitorStoreId } from "@/lib/demo";
import { getDues, getForecast } from "@/lib/forecast";
import { listReceipts } from "@/lib/guard";
import { listRiskFlags } from "@/lib/risk";
import { listRecentOrders } from "@/lib/store";
import { formatDay } from "@/lib/shared/dates";
import { formatCents, formatDollars, formatShortfall } from "@/lib/shared/money";

export const metadata: Metadata = { title: "Forecast • NeverShort" };

async function load() {
  const storeId = await getVisitorStoreId();
  try {
    const [forecast, orders, flags, receipts, dues] = await Promise.all([
      getForecast(storeId),
      listRecentOrders(storeId, 50),
      listRiskFlags(storeId),
      listReceipts(storeId),
      getDues(storeId),
    ]);
    return { storeId, forecast, orders, flags, receipts, dues };
  } catch (error) {
    console.error("[dashboard] could not load forecast data:", error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Clean, human-friendly Cash Flow Forecast.
 * Prioritizes:
 * - One readable chart with interactive day inspection.
 * - Clear dates and plain English.
 * - One highlighted risk with an explanation of why it exists.
 * - Progressive disclosure for detailed order ledgers and background tables.
 */
export default async function DashboardPage() {
  const data = await load();
  if (!data) {
    return (
      <div className="max-w-xl mx-auto p-8 rounded-2xl bg-white border border-slate-200 text-center shadow-xs">
        <h2 className="text-xl font-bold text-slate-900">Couldn&apos;t load forecast</h2>
        <p className="mt-2 text-sm text-slate-500">Your funds are completely safe. Retry in a moment.</p>
        <div className="mt-5">
          <ButtonLink href="/dashboard" variant="secondary">
            Retry
          </ButtonLink>
        </div>
      </div>
    );
  }

  const { forecast, orders, flags, receipts, dues } = data;
  const rows = orderRows(orders, flags, receipts);
  const lastDay = forecast.days[forecast.days.length - 1]!.date;
  const duesRows = dueRows(dues.filter((d) => d.dueOn <= lastDay));
  const gap = forecast.firstShortfall;
  const lowest = forecast.days.reduce((a, d) => (d.closingCents < a.closingCents ? d : a), forecast.days[0]!);
  const startOn = gap?.date ?? forecast.days[0]?.date ?? forecast.asOf;

  const arrived = orders.reduce((s, o) => s + (o.netCents ?? 0), 0);
  const fees = orders.reduce((s, o) => s + (o.feeCents ?? 0), 0);

  return (
    <div className="space-y-6 max-w-[960px] mx-auto">
      {/* ── Page Header ── */}
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight">
          14-Day Cash Forecast
        </h1>
        <p className="text-sm text-slate-500">
          A forward-looking estimate of your bank balance based on average sales and scheduled bills.
        </p>
      </div>

      {/* ── Highlighted Risk & Plain Explanation ── */}
      {gap ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-600" />
              Primary Cash Flow Risk
            </span>
            <span className="text-xs font-mono font-bold text-rose-800 bg-white/90 px-2.5 py-0.5 rounded-full border border-rose-200">
              {formatDay(gap.date)}
            </span>
          </div>

          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Projected shortfall of {formatShortfall(gap.amountCents)} on {formatDay(gap.date)}
            </h2>
            <p className="text-sm text-slate-700 mt-1 leading-relaxed">
              Why this happens: {gap.reason}. Your balance is estimated to end at {formatDollars(lowest.closingCents)}, dipping below your {formatDollars(forecast.minimumBalanceCents)} cash reserve.
            </p>
          </div>

          <div className="pt-1">
            <Link
              href="/fix"
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors shadow-xs"
            >
              Explore solutions to fix this gap →
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 sm:p-6 shadow-xs space-y-1">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Forecast Clear
          </span>
          <h2 className="text-lg font-bold text-slate-900">
            No projected shortfalls over the next two weeks.
          </h2>
          <p className="text-sm text-slate-600">
            Lowest estimated balance is {formatDollars(lowest.closingCents)} on {formatDay(lowest.date)}, safely above your {formatDollars(forecast.minimumBalanceCents)} cash reserve.
          </p>
        </div>
      )}

      {/* ── ONE Readable Chart + Day Inspection ── */}
      <UnifiedForecastChart
        days={forecast.days}
        minimumBalanceCents={forecast.minimumBalanceCents}
        initialDate={startOn}
      />

      {/* ── Progressive Disclosure: Scheduled Payments Table ── */}
      <CollapsibleSection
        title="Upcoming Bills & Payments in this Forecast"
        subtitle={`${duesRows.length} obligations due over the next 14 days`}
      >
        <div className="hidden md:block">
          <DuesTable rows={duesRows} />
        </div>
        <div className="md:hidden">
          <DuesList rows={duesRows} />
        </div>
      </CollapsibleSection>

      {/* ── Progressive Disclosure: Complete Transaction Ledger ── */}
      <CollapsibleSection
        title="Recent Customer Orders & PayPal Net Receipts"
        subtitle={`Total settled: ${formatCents(arrived)} net after ${formatCents(fees)} in PayPal processing fees`}
      >
        <div className="hidden md:block">
          <OrdersTable rows={rows} orders={orders} />
        </div>
        <div className="md:hidden">
          <OrdersList orders={orders} />
        </div>
      </CollapsibleSection>
    </div>
  );
}
