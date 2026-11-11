/**
 * Clean, minimal loading skeleton for the Forecast (Dashboard) page.
 * Matches 1:1 with app/(owner)/dashboard/page.tsx:
 * 1. Page Header (Title + Subtitle)
 * 2. 30-Day Trajectory Chart with Day Scrubber
 * 3. Collapsible data tables skeleton (Dues & Orders)
 */
export default function DashboardLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading cash forecast"
      className="space-y-6 max-w-[960px] mx-auto motion-safe:animate-pulse"
    >
      {/* 1. Page Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-64 rounded-lg bg-slate-200" />
        <div className="h-4 w-96 max-w-full rounded bg-slate-100" />
      </div>

      {/* 2. Unified 30-Day Forecast Chart Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="h-5 w-44 rounded bg-slate-200" />
            <div className="h-3.5 w-60 rounded bg-slate-100" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-20 rounded-full bg-slate-100" />
            <div className="h-6 w-24 rounded-full bg-slate-100" />
          </div>
        </div>

        {/* 14 Bar Columns */}
        <div className="h-52 pt-8 flex items-end justify-between gap-1 sm:gap-2 border-b border-slate-100 pb-2">
          {Array.from({ length: 14 }).map((_, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <div
                className="w-full rounded-t bg-slate-200"
                style={{ height: `${30 + ((idx * 23) % 60)}%` }}
              />
              <div className="h-2.5 w-6 rounded bg-slate-100" />
            </div>
          ))}
        </div>

        {/* Active Day Inspector Box Skeleton */}
        <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="h-3.5 w-28 rounded bg-slate-200" />
            <div className="h-6 w-36 rounded bg-slate-200" />
          </div>
          <div className="flex items-center gap-6">
            <div className="space-y-1">
              <div className="h-3 w-16 rounded bg-slate-200" />
              <div className="h-4 w-20 rounded bg-slate-200" />
            </div>
            <div className="space-y-1">
              <div className="h-3 w-16 rounded bg-slate-200" />
              <div className="h-4 w-20 rounded bg-slate-200" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Collapsible Sections Skeleton */}
      <div className="space-y-4">
        {/* Section 1: Dues Table Skeleton */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-5 w-48 rounded bg-slate-200" />
            <div className="h-4 w-12 rounded bg-slate-100" />
          </div>
          <div className="space-y-2 pt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between px-4">
                <div className="h-4 w-32 rounded bg-slate-200" />
                <div className="h-4 w-20 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Orders Table Skeleton */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-5 w-56 rounded bg-slate-200" />
            <div className="h-4 w-12 rounded bg-slate-100" />
          </div>
          <div className="space-y-2 pt-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between px-4">
                <div className="h-4 w-40 rounded bg-slate-200" />
                <div className="h-4 w-16 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

