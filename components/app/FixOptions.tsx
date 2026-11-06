import Link from "next/link";
import type { FixOption } from "@/types";
import { formatDay } from "@/lib/shared/dates";
import { formatDollars } from "@/lib/shared/money";
import { SimulatedTag } from "@/components/ui/Card";
import { DAY_WORD } from "@/components/ui/meaning";

/**
 * The short version of the fixes for the home page: one line each, with its effect.
 * Each opens the full option on /fix, where choosing it sends it to the Margin Guard.
 */
export function FixOptions({ fixes }: { fixes: FixOption[] }) {
  return (
    <ol className="space-y-2.5">
      {fixes.map((fix) => {
        const isCovered = fix.resultingState === "covered";
        const isTight = fix.resultingState === "tight";

        return (
          <li key={fix.id}>
            <Link
              href={`/fix#${fix.id}`}
              className="group block rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 transition-all hover:border-blue-300 hover:bg-blue-50/40 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                  {fix.title}
                </span>
                {fix.simulated && <SimulatedTag />}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isCovered ? "bg-emerald-500" : isTight ? "bg-amber-500" : "bg-rose-500"
                    }`}
                  />
                  <span>
                    {formatDay(fix.forDate)} becomes{" "}
                    <strong className="text-slate-900 capitalize font-medium">
                      {DAY_WORD[fix.resultingState]}
                    </strong>
                  </span>
                </span>
                <span className="font-mono text-slate-700 font-semibold">
                  Closes at {formatDollars(fix.resultingClosingCents)}
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
