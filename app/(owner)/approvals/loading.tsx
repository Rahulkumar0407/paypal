/**
 * Clean, minimal loading skeleton for the Decisions & Approvals page.
 * Matches 1:1 with app/(owner)/approvals/page.tsx:
 * 1. Page Header (Title + Subtitle)
 * 2. Tab Segment Bar skeleton (Needs sign-off | History | Sent reminders)
 * 3. Decision Card list skeleton with action cards & referee chips
 */
export default function ApprovalsLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading decisions inbox"
      className="space-y-6 max-w-[960px] mx-auto motion-safe:animate-pulse"
    >
      {/* 1. Page Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-60 rounded-lg bg-slate-200" />
        <div className="h-4 w-96 max-w-full rounded bg-slate-100" />
      </div>

      {/* 2. Tab Segment Bar Skeleton */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <div className="h-8 w-36 rounded-lg bg-slate-200" />
        <div className="h-8 w-24 rounded-lg bg-slate-100" />
        <div className="h-8 w-32 rounded-lg bg-slate-100" />
      </div>

      {/* 3. Decision Cards Skeleton */}
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4"
          >
            {/* Decision Card Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-6 w-28 rounded-full bg-amber-100 border border-amber-200" />
                <div className="h-4 w-32 rounded bg-slate-200" />
              </div>
              <div className="h-7 w-20 rounded bg-slate-200" />
            </div>

            {/* Description & Detail */}
            <div className="space-y-1.5">
              <div className="h-5 w-3/4 rounded bg-slate-200" />
              <div className="h-3.5 w-1/2 rounded bg-slate-100" />
            </div>

            {/* Rule Checklist Placeholder */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-2">
              <div className="h-3.5 w-40 rounded bg-slate-200" />
              <div className="h-3 w-56 rounded bg-slate-100" />
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <div className="h-9 w-24 rounded-xl bg-slate-100" />
              <div className="h-9 w-28 rounded-xl bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
