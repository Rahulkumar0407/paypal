import type { ForecastDay } from "@/types";
import { formatDay } from "@/lib/shared/dates";
import { formatDollars, formatShortfall } from "@/lib/shared/money";
import { DAY_FILL, DAY_WORD } from "@/components/ui/meaning";
import { ReadyMeter } from "@/components/ui/Card";

const MINUS = "−";

/**
 * The money calendar as a day-by-day agenda: money in and money out on one screen,
 * each due showing how much is ready.
 */
export function MoneyCalendar({ days }: { days: ForecastDay[] }) {
  return (
    <ol className="divide-y divide-line">
      {days.map((day) => (
        <li key={day.date} className="py-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="text-[15px] font-semibold whitespace-nowrap text-ink">
              {day.isToday ? `Today, ${formatDay(day.date)}` : formatDay(day.date)}
            </p>
            <p className="flex items-center gap-2 text-[14px] text-ink-muted">
              <span aria-hidden className={`inline-block size-2.5 shrink-0 rounded-[3px] ${DAY_FILL[day.state]}`} />
              <span>
                {day.state === "short" ? `${formatShortfall(day.shortByCents)} short` : DAY_WORD[day.state]}, closes at{" "}
                <span className="tabular whitespace-nowrap text-ink">{formatDollars(day.closingCents)}</span>
              </span>
            </p>
          </div>
          <ul className="mt-2 space-y-2 text-[14px]">
            <li className="flex items-baseline justify-between gap-4">
              <span className="text-ink-muted">In: expected sales</span>
              <span className="tabular whitespace-nowrap text-ink">+{formatDollars(day.expectedInCents)}</span>
            </li>
            {day.dues.map((due) => {
              const shortBy = due.amountCents - due.readyCents;
              const readiness = shortBy > 0 ? `${formatDollars(due.readyCents)} of ${formatDollars(due.amountCents)} ready` : "ready";
              return (
                <li key={due.id}>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="min-w-0 text-ink">
                      Out: {due.payeeName}
                      <span className="text-ink-muted">, {readiness}</span>
                    </span>
                    <span className="tabular whitespace-nowrap text-ink">
                      {MINUS}
                      {formatDollars(due.amountCents)}
                    </span>
                  </div>
                  <div className="mt-1.5 max-w-[240px]">
                    <ReadyMeter readyCents={due.readyCents} amountCents={due.amountCents} />
                  </div>
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ol>
  );
}
