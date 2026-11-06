/**
 * Clean, minimal loading skeleton for the Demo Guide page.
 * Matches 1:1 with app/(owner)/demo/page.tsx:
 * 1. Page Header (Badge, Title, Subtitle)
 * 2. 2-column layout: 6-step guided walkthrough wizard skeleton on left, sandbox sidebar on right
 */
export default function DemoLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading demo guide"
      className="space-y-6 max-w-[960px] mx-auto motion-safe:animate-pulse"
    >
      {/* 1. Page Header Skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-32 rounded-full bg-slate-200" />
        <div className="h-8 w-64 rounded-lg bg-slate-200" />
        <div className="h-4 w-96 max-w-full rounded bg-slate-100" />
      </div>

      {/* 2. Content Skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: 6-step wizard card skeleton */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="h-5 w-40 rounded bg-slate-200" />
            <div className="h-4 w-20 rounded bg-slate-100" />
          </div>
          <div className="space-y-3 pt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-44 rounded bg-slate-200" />
                  <div className="h-5 w-16 rounded-full bg-slate-100" />
                </div>
                <div className="h-3 w-5/6 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Sandbox credentials & Reset card skeleton */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="h-5 w-36 rounded bg-slate-200" />
            <div className="h-16 rounded-xl bg-slate-50 border border-slate-100" />
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="h-5 w-28 rounded bg-slate-200" />
            <div className="h-9 w-full rounded-xl bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
