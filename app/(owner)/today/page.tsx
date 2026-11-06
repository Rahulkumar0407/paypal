import { Suspense } from "react";
import Link from "next/link";
import type { Forecast, Due, FixOption } from "@/types";
import { ButtonLink } from "@/components/ui";
import { UnifiedForecastChart } from "@/components/app/UnifiedForecastChart";
import { ShortfallNote } from "@/components/app/ShortfallNote";
import { duesInForecast } from "@/components/app/due-state";
import { getVisitorStoreId } from "@/lib/demo";
import { getDues, getFixOptions, getForecast } from "@/lib/forecast";
import { formatDay } from "@/lib/shared/dates";
import { formatDollars, formatShortfall } from "@/lib/shared/money";

interface HomeData {
  forecast: Forecast;
  dues: Due[];
  fixes: FixOption[];
}

async function load(): Promise<HomeData | null> {
  const storeId = await getVisitorStoreId();
  try {
    const [forecast, dues, fixes] = await Promise.all([
      getForecast(storeId),
      getDues(storeId),
      getFixOptions(storeId),
    ]);
    return { forecast, dues, fixes };
  } catch (error) {
    console.error("[home] could not load forecast:", error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Minimal, world-class Overview for small business owners.
 * Strict adherence to the 10-Second Rule:
 * 1. How much cash is available?
 * 2. Is there a future financial problem?
 * 3. What should I do about it?
 */
export default async function HomePage() {
  const data = await load();

  if (!data) {
    return (
      <div className="max-w-xl mx-auto p-8 rounded-2xl bg-white border border-slate-200 text-center shadow-xs">
        <h2 className="text-xl font-bold text-slate-900">Couldn&apos;t load financial status</h2>
        <p className="mt-2 text-sm text-slate-500">
          Your funds are completely safe. Retry in a moment.
        </p>
        <div className="mt-5">
          <ButtonLink href="/today" variant="secondary">
            Retry
          </ButtonLink>
        </div>
      </div>
    );
  }

  const { forecast, dues, fixes } = data;
  const gap = forecast.firstShortfall;
  const upcoming = duesInForecast(dues, forecast);
  const startOn = gap?.date ?? forecast.days[0]?.date ?? forecast.asOf;

  // Key Financial Figures
  const availableCashCents = forecast.days[0]?.openingCents ?? 0;
  const totalMoneyOutCents = forecast.days.reduce((sum, d) => sum + d.knownOutCents, 0);
  const lowestDay = forecast.days.reduce(
    (min, d) => (d.closingCents < min.closingCents ? d : min),
    forecast.days[0] ?? { closingCents: 0, date: forecast.asOf, state: "covered" }
  );

  // Top Prioritized Fix
  const topFix = fixes[0];

  return (
    <div className="space-y-6 max-w-[960px] mx-auto">
      {/* ── 1. Top: One Concise Financial Status ── */}
      {gap ? (
        <section
          aria-label="Cash status alert"
          className="rounded-2xl border border-rose-200/90 bg-rose-50/60 p-5 sm:p-6 shadow-xs space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-800">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
              Cash Warning
            </span>
            <span className="text-xs font-mono font-bold text-rose-700 bg-white/80 px-2.5 py-0.5 rounded-full border border-rose-200">
              Short by {formatShortfall(gap.amountCents)} on {formatDay(gap.date)}
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight">
              You may fall {formatShortfall(gap.amountCents)} below your cash reserve next {formatDay(gap.date)}.
            </h1>
            <Suspense fallback={null}>
              <ShortfallNote forecast={forecast} className="text-sm text-slate-600 mt-1 leading-relaxed" />
            </Suspense>
          </div>
        </section>
      ) : (
        <section
          aria-label="Cash status safe"
          className="rounded-2xl border border-emerald-200/90 bg-emerald-50/50 p-5 sm:p-6 shadow-xs space-y-1.5"
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Cash Position Healthy
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight">
            Your cash is covered for the next two weeks.
          </h1>
          <p className="text-sm text-slate-600">
            All scheduled obligations are fully covered by incoming PayPal revenues.
          </p>
        </section>
      )}

      {/* ── 2. Below: Three Essential Financial Metrics ── */}
      <section aria-label="Essential metrics" className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">
            Available Cash Today
          </span>
          <div className="text-2xl sm:text-3xl font-serif font-black text-slate-900 mt-1">
            {formatDollars(availableCashCents)}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Settled in PayPal account
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">
            Lowest Projected Balance
          </span>
          <div
            className={`text-2xl sm:text-3xl font-serif font-black mt-1 ${
              lowestDay.state === "short" ? "text-rose-600" : "text-slate-900"
            }`}
          >
            {formatDollars(lowestDay.closingCents)}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            On {formatDay(lowestDay.date)} • Reserve {formatDollars(forecast.minimumBalanceCents)}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">
            Upcoming Obligations (14d)
          </span>
          <div className="text-2xl sm:text-3xl font-serif font-black text-slate-900 mt-1">
            {formatDollars(totalMoneyOutCents)}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Across {dues.length} scheduled payments
          </p>
        </div>
      </section>

      {/* ── 3. Middle: ONE Clean, Interactive 14-Day Cash-Flow Chart ── */}
      <UnifiedForecastChart
        days={forecast.days}
        minimumBalanceCents={forecast.minimumBalanceCents}
        initialDate={startOn}
      />

      {/* ── 4. Below Chart: ONE Important Recommendation with a Clear Action ── */}
      {gap && topFix && (
        <section
          aria-label="Recommended action"
          className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block">
              Recommended Fix
            </span>
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">
              {topFix.title}
            </h2>
            <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
              Covering the {formatShortfall(gap.amountCents)} shortfall on {formatDay(gap.date)} brings your projected closing balance to{" "}
              <strong className="text-slate-900 font-semibold">{formatDollars(topFix.resultingClosingCents)}</strong> without borrowing.
            </p>
          </div>
          <Link
            href="/fix"
            className="shrink-0 inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
          >
            Fix the Gap →
          </Link>
        </section>
      )}

      {/* ── 5. Bottom: A Compact List of Upcoming Bills ── */}
      <section
        aria-labelledby="upcoming-bills-title"
        className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 id="upcoming-bills-title" className="text-base font-semibold text-slate-900">
              Approaching Payments
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Bills and supplier orders due in the next 14 days.
            </p>
          </div>
          <Link
            href="/dues"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            See all payments →
          </Link>
        </div>

        <ul className="divide-y divide-slate-100">
          {upcoming.slice(0, 4).map(({ due, state }) => {
            const isShort = state === "short";
            return (
              <li key={due.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                <div>
                  <span className="font-medium text-slate-900 block truncate max-w-[240px] sm:max-w-md">
                    {due.payeeName}
                  </span>
                  <span className="text-xs text-slate-400">
                    Due {formatDay(due.dueOn)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900 block">
                    {formatDollars(due.amountCents)}
                  </span>
                  <span
                    className={`inline-block text-[10px] font-semibold px-2 py-0.2 rounded-full ${
                      isShort
                        ? "bg-rose-100 text-rose-700"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {isShort ? "Needs Attention" : "Covered"}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
