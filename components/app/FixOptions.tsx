import type { FixOption } from "@/types";
import { formatDay } from "@/lib/shared/dates";
import { formatDollars } from "@/lib/shared/money";
import { SimulatedTag } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { DAY_WORD } from "@/components/ui/meaning";

/**
 * Up to three ways to close a gap. Choosing one creates a proposal for the Margin Guard.
 * TODO(Person 3, P3-2): "Choose" posts the fix as a proposal; for now it opens Approvals.
 */
export function FixOptions({ fixes }: { fixes: FixOption[] }) {
  return (
    <ol className="space-y-3">
      {fixes.map((fix) => (
        <li key={fix.id} className="rounded-tile bg-paper p-4 ring-1 ring-line ring-inset">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[16px] leading-6 font-semibold text-ink">{fix.title}</p>
            {fix.simulated ? <SimulatedTag className="mt-1 shrink-0" /> : null}
          </div>
          <p className="mt-1 text-[14px] leading-[1.45] text-ink-muted">{fix.detail}</p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-[14px] text-ink">
              {formatDay(fix.forDate)} closes at <span className="tabular font-semibold">{formatDollars(fix.resultingClosingCents)}</span>:{" "}
              {DAY_WORD[fix.resultingState].toLowerCase()}.
            </p>
            <ButtonLink href="/approvals" variant="secondary" className="min-h-10 shrink-0 px-3 text-[14px]">
              Choose
            </ButtonLink>
          </div>
        </li>
      ))}
    </ol>
  );
}
