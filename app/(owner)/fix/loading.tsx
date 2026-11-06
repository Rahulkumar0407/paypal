/**
 * Clean, minimal loading skeleton for the Fix the Gap page.
 * Matches 1:1 with app/(owner)/fix/page.tsx:
 * 1. Page Header (PageSentence)
 * 2. Gap summary banner skeleton
 * 3. Three Fix Option card skeletons
 */
export default function FixLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading fix options"
      className="space-y-6 max-w-[960px] mx-auto motion-safe:animate-pulse"
    >
      {/* 1. Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-72 rounded-lg bg-slate-200" />
        <div className="h-4 w-96 max-w-full rounded bg-slate-100" />
      </div>

      {/* 2. Gap Summary Banner Skeleton */}
      <div className="rounded-2xl border border-rose-200/90 bg-rose-50/50 p-5 sm:p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 rounded bg-rose-200" />
          <div className="h-5 w-24 rounded-full bg-rose-100" />
        </div>
        <div className="h-6 w-3/4 rounded bg-rose-200/80" />
      </div>

      {/* 3. Three Fix Option Cards Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-5 w-52 rounded bg-slate-200" />
              <div className="h-6 w-24 rounded-full bg-slate-100" />
            </div>
            <div className="h-4 w-3/4 rounded bg-slate-100" />
            <div className="pt-2 flex items-center justify-between">
              <div className="h-4 w-40 rounded bg-slate-200" />
              <div className="h-9 w-32 rounded-xl bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
