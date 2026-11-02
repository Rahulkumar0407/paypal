import Link from "next/link";
import type { FixOption } from "@/types";
import { formatDay } from "@/lib/shared/dates";
import { formatDollars } from "@/lib/shared/money";
import { SimulatedTag } from "@/components/ui/Card";
import { DAY_FILL, DAY_WORD } from "@/components/ui/meaning";

/**
 * The short version of the fixes for the home page: one line each, with its effect.
 * Each opens the full option on /fix, where choosing it sends it to the Margin Guard.
 */
export function FixOptions({ fixes }: { fixes: FixOption[] }) {
  return (
    <ol className="space-y-2">
      {fixes.map((fix) => (
        <li key={fix.id}>
          <Link href={`/fix#${fix.id}`} className="block rounded-tile bg-surface p-4 transition-colors hover:bg-line/60">
            <span className="flex items-start justify-between gap-3">
              <span className="text-[16px] leading-6 font-semibold text-ink">{fix.title}</span>
              {fix.simulated ? <SimulatedTag className="mt-1 shrink-0" /> : null}
            </span>
            <span className="mt-1 flex items-center gap-2 text-[14px] leading-5 text-ink">
              <span aria-hidden className={`inline-block size-2.5 shrink-0 rounded-[3px] ${DAY_FILL[fix.resultingState]}`} />
              {formatDay(fix.forDate)} becomes {DAY_WORD[fix.resultingState].toLowerCase()}, closing at{" "}
              <span className="tabular font-semibold">{formatDollars(fix.resultingClosingCents)}</span>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
