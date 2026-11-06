/**
 * Clean, minimal loading skeleton for the Settings page.
 * Matches 1:1 with app/(owner)/settings/page.tsx:
 * 1. Page Header (PageSentence)
 * 2. 2-column layout: Form inputs skeleton on left, SafetyLine card on right
 */
export default function SettingsLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading settings"
      className="space-y-8 max-w-[960px] mx-auto motion-safe:animate-pulse"
    >
      {/* 1. Header Sentence Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-80 rounded-lg bg-slate-200" />
        <div className="h-4 w-96 max-w-full rounded bg-slate-100" />
      </div>

      {/* 2. 2-Column Layout */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:items-start lg:gap-12">
        {/* Left: Form skeleton */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="space-y-2">
            <div className="h-5 w-32 rounded bg-slate-200" />
            <div className="h-10 w-full rounded-xl bg-slate-50 border border-slate-200" />
          </div>
          <div className="space-y-2">
            <div className="h-5 w-48 rounded bg-slate-200" />
            <div className="h-10 w-full rounded-xl bg-slate-50 border border-slate-200" />
          </div>
          <div className="space-y-2">
            <div className="h-5 w-40 rounded bg-slate-200" />
            <div className="h-10 w-full rounded-xl bg-slate-50 border border-slate-200" />
          </div>
          <div className="pt-2">
            <div className="h-10 w-36 rounded-xl bg-slate-200" />
          </div>
        </div>

        {/* Right: SafetyLine card skeleton */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="space-y-1">
            <div className="h-5 w-36 rounded bg-slate-200" />
            <div className="h-3.5 w-48 rounded bg-slate-100" />
          </div>
          <div className="h-12 rounded-xl bg-slate-50 border border-slate-100" />
          <div className="space-y-1.5 pt-2">
            <div className="h-3 w-full rounded bg-slate-100" />
            <div className="h-3 w-5/6 rounded bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
