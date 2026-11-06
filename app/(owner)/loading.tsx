/**
 * Global fallback loading skeleton for owner pages.
 * Clean, minimal slate card matching the app design system.
 */
export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading page"
      className="max-w-[960px] mx-auto space-y-6 motion-safe:animate-pulse"
    >
      <div className="space-y-2">
        <div className="h-8 w-56 rounded-lg bg-slate-200" />
        <div className="h-4 w-80 max-w-full rounded bg-slate-100" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="h-5 w-48 rounded bg-slate-200" />
        <div className="space-y-2.5 pt-2">
          <div className="h-3.5 w-full rounded bg-slate-100" />
          <div className="h-3.5 w-4/5 rounded bg-slate-100" />
          <div className="h-3.5 w-2/3 rounded bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
