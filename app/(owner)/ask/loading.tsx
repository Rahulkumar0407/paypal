/**
 * Clean, minimal loading skeleton for Ask Co-pilot.
 * Matches app/(owner)/ask/page.tsx:
 * 1. Page Header (Badge, Title, Subtitle)
 * 2. Chat panel container skeleton
 */
export default function AskLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading AI co-pilot"
      className="max-w-[800px] mx-auto space-y-6 motion-safe:animate-pulse"
    >
      <div className="space-y-3">
        <div className="h-4 w-36 rounded-full bg-slate-200" />
        <div className="h-9 w-3/4 rounded-lg bg-slate-200" />
        <div className="h-4 w-full max-w-lg rounded bg-slate-100" />
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-7 shadow-xs space-y-4">
        <div className="h-24 rounded-xl bg-slate-50 border border-slate-100" />
        <div className="flex gap-2">
          <div className="h-8 w-44 rounded-full bg-slate-100" />
          <div className="h-8 w-56 rounded-full bg-slate-100" />
        </div>
        <div className="h-12 rounded-xl bg-slate-50 border border-slate-200" />
      </div>
    </div>
  );
}

