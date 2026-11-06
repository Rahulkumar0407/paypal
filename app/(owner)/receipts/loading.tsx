/**
 * Clean, minimal loading skeleton for the Receipts & Audit Trail page.
 * Matches 1:1 with app/(owner)/receipts/page.tsx:
 * 1. Page Header (Title + Subtitle)
 * 2. Filter buttons bar
 * 3. Thermal audit receipt cards skeleton
 */
export default function ReceiptsLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading audit receipts"
      className="space-y-8 max-w-[960px] mx-auto motion-safe:animate-pulse"
    >
      {/* 1. Page Header Skeleton */}
      <div className="space-y-3">
        <div className="h-4 w-36 rounded-full bg-slate-200" />
        <div className="h-8 w-64 rounded-lg bg-slate-200" />
        <div className="h-4 w-96 max-w-full rounded bg-slate-100" />
      </div>

      {/* 2. Filter Bar Skeleton */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-24 rounded-full bg-slate-100" />
        ))}
      </div>

      {/* 3. Receipts Cards Skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4 font-mono"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 rounded bg-slate-200" />
              <div className="h-5 w-20 rounded-full bg-slate-100" />
            </div>
            <div className="space-y-2 py-3 border-y border-dashed border-slate-200">
              <div className="h-3 w-full rounded bg-slate-100" />
              <div className="h-3 w-4/5 rounded bg-slate-100" />
              <div className="h-3 w-3/4 rounded bg-slate-100" />
            </div>
            <div className="flex items-center justify-between pt-1">
              <div className="h-4 w-32 rounded bg-slate-200" />
              <div className="h-4 w-16 rounded bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
