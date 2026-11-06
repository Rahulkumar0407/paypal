/**
 * Clean, minimal loading skeleton for the Overview page.
 * Aligns 1:1 with the simplified 10-Second Rule layout:
 * 1. Financial status header skeleton
 * 2. 3 KPI summary metrics skeleton
 * 3. Unified 14-day cash-flow trajectory chart skeleton
 * 4. Prioritized recommendation & upcoming dues skeleton
 */
export default function HomeLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading financial overview"
      className="space-y-6 max-w-[960px] mx-auto animate-pulse"
    >
      {/* 1. Status Banner Skeleton */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 rounded-full bg-slate-200" />
          <div className="h-5 w-40 rounded-full bg-slate-100" />
        </div>
        <div className="h-8 w-3/4 rounded-lg bg-slate-200" />
        <div className="h-4 w-1/2 rounded bg-slate-100" />
      </div>

      {/* 2. 3 Metrics Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-2">
            <div className="h-3.5 w-24 rounded bg-slate-200" />
            <div className="h-7 w-28 rounded bg-slate-200" />
            <div className="h-3 w-32 rounded bg-slate-100" />
          </div>
        ))}
      </div>

      {/* 3. 14-Day Trajectory Chart Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-5 w-48 rounded bg-slate-200" />
            <div className="h-3.5 w-64 rounded bg-slate-100" />
          </div>
          <div className="h-4 w-24 rounded-full bg-slate-100" />
        </div>

        {/* 14 Bar Columns */}
        <div className="h-48 pt-8 flex items-end justify-between gap-1 sm:gap-2 border-b border-slate-100 pb-2">
          {Array.from({ length: 14 }).map((_, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <div
                className="w-full rounded-t bg-slate-200"
                style={{ height: `${35 + ((idx * 17) % 55)}%` }}
              />
              <div className="h-2.5 w-5 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>

      {/* 4. Bottom Row Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-3">
          <div className="h-5 w-40 rounded bg-slate-200" />
          <div className="h-4 w-3/4 rounded bg-slate-100" />
          <div className="h-10 w-32 rounded-xl bg-slate-200 mt-2" />
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-3">
          <div className="h-5 w-32 rounded bg-slate-200" />
          <div className="space-y-2 mt-2">
            <div className="h-12 rounded-xl bg-slate-50 border border-slate-100" />
            <div className="h-12 rounded-xl bg-slate-50 border border-slate-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
