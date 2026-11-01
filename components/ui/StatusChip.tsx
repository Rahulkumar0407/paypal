import type { DayState } from "@/types";
import { DAY_FILL } from "./meaning";

/**
 * A state shown as a coloured mark plus words, e.g. "Short on Thu 12 Nov". The words always carry the meaning.
 * `inverse` sits on the deep green note: a solid pill so it stays readable over the engraving.
 */
export function StatusChip({ state, children, inverse = false }: { state: DayState; children: React.ReactNode; inverse?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[14px] leading-5 font-semibold ${
        inverse ? "bg-brand text-white ring-1 ring-white/30" : "bg-surface text-ink"
      }`}
    >
      <span aria-hidden className={`inline-block size-2.5 shrink-0 rounded-[3px] ${DAY_FILL[state]}`} />
      {children}
    </span>
  );
}
