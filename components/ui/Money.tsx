import type { Cents } from "@/types";
import { formatCents, formatDollars, formatShortfall } from "@/lib/shared/money";

type MoneyMode = "whole" | "exact" | "shortfall";

const FORMAT: Record<MoneyMode, (c: Cents) => string> = {
  whole: formatDollars,
  exact: formatCents,
  shortfall: formatShortfall,
};

/** An amount in running text or tables. Tabular figures so columns line up. */
export function Money({ cents, mode = "whole", className = "" }: { cents: Cents; mode?: MoneyMode; className?: string }) {
  return <span className={`tabular whitespace-nowrap ${className}`}>{FORMAT[mode](cents)}</span>;
}

/** A single big amount in the serif, e.g. a balance or a gap. */
export function BigAmount({ cents, mode = "whole", className = "" }: { cents: Cents; mode?: MoneyMode; className?: string }) {
  return (
    <span className={`font-serif text-[2.5rem] leading-none tracking-[-0.01em] whitespace-nowrap lg:text-[3rem] ${className}`}>
      {FORMAT[mode](cents)}
    </span>
  );
}
