import { formatDay } from "@/lib/shared/dates";
import { formatDollars } from "@/lib/shared/money";
import { ReadyMeter, SimulatedTag } from "@/components/ui/Card";
import { DAY_WORD } from "@/components/ui/meaning";
import type { DueWithState } from "./due-state";

const KIND_WORD = {
  SUPPLIER: "Supplier order",
  BILL: "Recurring bill",
  OWNER_TRANSFER: "Bank transfer",
  LOAN: "Loan repayment",
} as const;

/** Upcoming dues in date order: name, date, how much is ready, and a clear state word. */
export function UpcomingDues({ items }: { items: DueWithState[] }) {
  return (
    <ul className="divide-y divide-slate-100">
      {items.map(({ due, state }) => {
        const fully = due.readyCents >= due.amountCents;
        const isShort = state === "short";
        const isTight = state === "tight";

        return (
          <li key={due.id} className="py-4 first:pt-0 last:pb-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {due.payeeName}
                  </p>
                  {due.simulated && <SimulatedTag />}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Due {formatDay(due.dueOn)} • {KIND_WORD[due.kind]}
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm font-mono font-bold text-slate-900">
                  {formatDollars(due.amountCents)}
                </p>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold mt-0.5 ${
                    isShort
                      ? "bg-rose-100 text-rose-700"
                      : isTight
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full mr-1 ${
                      isShort ? "bg-rose-600" : isTight ? "bg-amber-500" : "bg-emerald-600"
                    }`}
                  />
                  {DAY_WORD[state]}
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 text-xs">
              <div className="w-full max-w-[200px]">
                <ReadyMeter readyCents={due.readyCents} amountCents={due.amountCents} />
              </div>
              <p
                className={`text-xs tabular-nums font-mono ${
                  fully ? "text-slate-500" : "font-semibold text-rose-600"
                }`}
              >
                {formatDollars(due.readyCents)} of {formatDollars(due.amountCents)} ready
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
