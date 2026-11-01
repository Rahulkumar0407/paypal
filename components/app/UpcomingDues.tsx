import { formatDay } from "@/lib/shared/dates";
import { formatDollars } from "@/lib/shared/money";
import { ReadyMeter, SimulatedTag } from "@/components/ui/Card";
import { DAY_FILL, DAY_WORD } from "@/components/ui/meaning";
import type { DueWithState } from "./due-state";

const KIND_WORD = { SUPPLIER: "Supplier order", BILL: "Bill", OWNER_TRANSFER: "Your pay", LOAN: "Loan repayment" } as const;

/** Upcoming dues in date order: name, date, how much is ready, and a clear state word. */
export function UpcomingDues({ items }: { items: DueWithState[] }) {
  return (
    <ul className="divide-y divide-line">
      {items.map(({ due, state }) => {
        const fully = due.readyCents >= due.amountCents;
        return (
          <li key={due.id} className="py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[16px] leading-6 font-semibold text-ink">
                  {due.payeeName} {due.simulated ? <SimulatedTag className="ml-1 align-middle" /> : null}
                </p>
                <p className="text-[14px] leading-5 text-ink-muted">
                  {formatDay(due.dueOn)}, {KIND_WORD[due.kind].toLowerCase()}
                </p>
              </div>
              <p className="flex shrink-0 items-center gap-2 text-[14px] font-semibold text-ink">
                <span aria-hidden className={`inline-block size-2.5 rounded-[3px] ${DAY_FILL[state]}`} />
                {DAY_WORD[state]}
              </p>
            </div>
            <div className="mt-2.5 flex items-center gap-3">
              <div className="w-full max-w-[220px]">
                <ReadyMeter readyCents={due.readyCents} amountCents={due.amountCents} />
              </div>
              <p className={`text-[14px] whitespace-nowrap tabular ${fully ? "text-ink-muted" : "font-semibold text-ink"}`}>
                {formatDollars(due.readyCents)} of {formatDollars(due.amountCents)} ready
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
