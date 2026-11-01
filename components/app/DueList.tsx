import type { Due } from "@/types";
import { formatDay } from "@/lib/shared/dates";
import { formatDollars, formatShortfall } from "@/lib/shared/money";
import { ReadyMeter, SimulatedTag } from "@/components/ui/Card";

const KIND_WORD: Record<Due["kind"], string> = {
  SUPPLIER: "Supplier order",
  BILL: "Bill",
  OWNER_TRANSFER: "Your pay",
  LOAN: "Loan repayment",
};

/** Upcoming payments with how much is ready for each. */
export function DueList({ dues }: { dues: Due[] }) {
  return (
    <ul className="divide-y divide-line">
      {dues.map((due) => {
        const short = due.amountCents - due.readyCents;
        return (
          <li key={due.id} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 py-4">
            <div className="min-w-0">
              <p className="text-[16px] leading-6 font-semibold text-ink">
                {due.payeeName} {due.simulated ? <SimulatedTag className="ml-1 align-middle" /> : null}
              </p>
              <p className="text-[14px] text-ink-muted">
                {KIND_WORD[due.kind]}, {formatDay(due.dueOn)}
                {due.movedFromOn ? `, moved from ${formatDay(due.movedFromOn)}` : ""}
              </p>
            </div>
            <p className="text-right font-serif text-[26px] leading-none text-ink">{formatDollars(due.amountCents)}</p>
            <div className="col-span-2 flex items-center gap-3">
              <div className="w-28 shrink-0">
                <ReadyMeter readyCents={due.readyCents} amountCents={due.amountCents} />
              </div>
              <p className={`text-[14px] ${short > 0 ? "font-semibold text-ink" : "text-ink-muted"}`}>
                {short > 0 ? `${formatDollars(due.readyCents)} ready, ${formatShortfall(short)} short` : "Ready"}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
