import type { ForecastDay } from "@/types";
import { formatDay } from "@/lib/shared/dates";
import { formatDollars, formatShortfall } from "@/lib/shared/money";
import { DAY_FILL, DAY_WORD } from "@/components/ui/meaning";

const MINUS = "−";

/** One day's money in and money out, read top to bottom like a till roll. Sits on the deep green note. */
export function DayDetail({ day, minimumBalanceCents }: { day: ForecastDay; minimumBalanceCents: number }) {
  const condition = day.state === "short" ? `${formatShortfall(day.shortByCents)} short` : DAY_WORD[day.state];
  return (
    <div className="grid gap-5 text-white lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-10">
      <div>
        <p className="font-serif text-[1.6rem] leading-tight">{day.isToday ? `Today, ${formatDay(day.date)}` : formatDay(day.date)}</p>
        <p className="mt-2 flex items-center gap-2 text-[15px] font-semibold">
          <span aria-hidden className={`inline-block size-2.5 rounded-[3px] ${DAY_FILL[day.state]}`} />
          {condition}
        </p>
        <p className="mt-1 text-[14px] leading-5 text-white/80">
          {day.state === "short"
            ? `Ends ${formatShortfall(day.shortByCents)} below your ${formatDollars(minimumBalanceCents)} minimum.`
            : day.state === "tight"
              ? `Ends just above your ${formatDollars(minimumBalanceCents)} minimum.`
              : `Ends comfortably above your ${formatDollars(minimumBalanceCents)} minimum.`}
        </p>
      </div>

      <dl className="divide-y divide-white/15 text-[15px]">
        <Row label="Starts the day with" value={formatDollars(day.openingCents)} muted />
        <Row label="In: expected sales" value={`+${formatDollars(day.expectedInCents)}`} />
        {day.heldInCents > 0 ? <Row label="Held for a risk check: not counted" value={formatDollars(day.heldInCents)} muted /> : null}
        {day.dues.map((due) => (
          <Row
            key={due.id}
            label={`Out: ${due.payeeName}`}
            note={due.readyCents < due.amountCents ? `${formatDollars(due.readyCents)} of ${formatDollars(due.amountCents)} ready` : "Ready"}
            value={`${MINUS}${formatDollars(due.amountCents)}`}
          />
        ))}
        {day.dues.length === 0 ? <Row label="Out: nothing due" value={`${MINUS}$0`} muted /> : null}
        <Row label="Ends the day with" value={formatDollars(day.closingCents)} strong />
      </dl>
    </div>
  );
}

function Row({ label, value, note, muted = false, strong = false }: { label: string; value: string; note?: string; muted?: boolean; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className={muted ? "text-white/80" : "text-white"}>
        {label}
        {note ? <span className="block text-[13px] text-white/80">{note}</span> : null}
      </dt>
      <dd className={`tabular whitespace-nowrap ${strong ? "font-serif text-[1.35rem] leading-none" : ""}`}>{value}</dd>
    </div>
  );
}
