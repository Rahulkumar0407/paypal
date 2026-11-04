/**
 * The counting mat: green felt lying on the desk, behind every owner page, with a stitched edge and the maker's
 * mark sewn into a corner. The felt itself (colour and grain) is `.mat-surface` in globals.css. Fixed, so pages
 * slide over it like paper. Decorative only. Owner: Person 1.
 */
export function MatBackdrop() {
  return (
    <div
      aria-hidden
      className="mat-surface pointer-events-none fixed inset-0 -z-10 overflow-hidden lg:top-2.5 lg:right-2.5 lg:bottom-2.5 lg:left-[274px] lg:rounded-[22px]"
    >
      <div className="absolute inset-1.5 rounded-[19px] shadow-[inset_0_0_0_1px_rgb(0_0_0_/_0.35)] max-lg:hidden" />
      <div className="absolute inset-2 rounded-[10px] border-2 border-dashed border-white/[0.2] lg:inset-3 lg:rounded-[16px]" />
      <p className="absolute right-8 bottom-6 hidden text-[11px] font-bold tracking-[0.32em] text-white/30 uppercase lg:block">
        NeverShort · counting mat
      </p>
    </div>
  );
}

/** A short engraved rope rule, like the note's border, used under each page's opening sentence. */
export function RopeRule({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden className={`block h-[14px] w-[180px] ${className}`}>
      <defs>
        <pattern id="rope-rule" width={14} height={14} patternUnits="userSpaceOnUse">
          <path
            d="M0 7 Q3.5 1.5 7 7 T14 7"
            fill="none"
            style={{ stroke: "var(--color-ink)" }}
            strokeOpacity={0.5}
            strokeWidth={0.8}
          />
          <path
            d="M0 7 Q3.5 12.5 7 7 T14 7"
            fill="none"
            style={{ stroke: "var(--color-ink)" }}
            strokeOpacity={0.5}
            strokeWidth={0.8}
          />
          <circle cx={3.5} cy={7} r={1} fill="#1e9e5e" />
          <circle cx={10.5} cy={7} r={1} fill="#1e9e5e" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#rope-rule)" />
    </svg>
  );
}
