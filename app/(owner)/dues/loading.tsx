/**
 * Clean, minimal loading skeleton for the Payments (Dues) page.
 * Matches 1:1 with app/(owner)/dues/page.tsx:
 * 1. Page Header (Title + Subtitle)
 * 2. 3 KPI Summary metric cards
 * 3. Scheduled payments list skeleton
 * 4. Detected payees section skeleton
 */
export default function DuesLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading scheduled payments"
      className="space-y-6 max-w-[960px] mx-auto motion-safe:animate-pulse"
    >
      {/* 1. Page Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-72 rounded-lg bg-slate-200" />
        <div className="h-4 w-96 max-w-full rounded bg-slate-100" />
      </div>

      {/* 2. 3 KPI Summary Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-2">
            <div className="h-3.5 w-24 rounded bg-slate-200" />
            <div className="h-7 w-28 rounded bg-slate-200" />
            <div className="h-3 w-32 rounded bg-slate-100" />
          </div>
        ))}
      </div>

      {/* 3. Scheduled Payments Card Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-5 w-48 rounded bg-slate-200" />
            <div className="h-3.5 w-56 rounded bg-slate-100" />
          </div>
          <div className="h-6 w-20 rounded-full bg-slate-100" />
        </div>

        {/* Payment Rows */}
        <div className="divide-y divide-slate-100 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-4 w-36 rounded bg-slate-200" />
                  <div className="h-3 w-24 rounded bg-slate-100" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-5 w-20 rounded-full bg-slate-100" />
                <div className="h-5 w-16 rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Detected Recurring Payees Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="space-y-1">
          <div className="h-5 w-44 rounded bg-slate-200" />
          <div className="h-3.5 w-72 rounded bg-slate-100" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-slate-200/70 p-4 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-4 w-32 rounded bg-slate-200" />
                <div className="h-4 w-16 rounded-full bg-slate-100" />
              </div>
              <div className="h-3 w-48 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

