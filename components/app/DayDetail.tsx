import type { ForecastDay } from "@/types";
import { formatDay } from "@/lib/shared/dates";
import { formatDollars, formatShortfall } from "@/lib/shared/money";
import { DAY_WORD } from "@/components/ui/meaning";

const MINUS = "−";

/** One day's money in and money out, rendered in clean fintech design. */
export function DayDetail({
  day,
  minimumBalanceCents,
}: {
  day: ForecastDay;
  minimumBalanceCents: number;
}) {
  const isShort = day.state === "short";
  const isTight = day.state === "tight";
  const condition = isShort ? `${formatShortfall(day.shortByCents)} short` : DAY_WORD[day.state];

  return (
    <div className="grid gap-6 text-slate-900 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-10">
      <div className="flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isShort
                  ? "bg-rose-100 text-rose-700"
                  : isTight
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                  isShort ? "bg-rose-600" : isTight ? "bg-amber-500" : "bg-emerald-600"
                }`}
              />
              {condition}
            </span>
          </div>
          <h3 className="font-serif text-2xl font-bold tracking-tight text-slate-900">
            {day.isToday ? `Today, ${formatDay(day.date)}` : formatDay(day.date)}
          </h3>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            {isShort
              ? `Projected to end ${formatShortfall(day.shortByCents)} below your ${formatDollars(minimumBalanceCents)} target minimum balance.`
              : isTight
                ? `Projected to end tightly above your ${formatDollars(minimumBalanceCents)} minimum threshold.`
                : `Projected to end safely with a comfortable buffer above your ${formatDollars(minimumBalanceCents)} minimum.`}
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>Target Minimum</span>
          <span className="font-semibold text-slate-700">{formatDollars(minimumBalanceCents)}</span>
        </div>
      </div>

      <dl className="divide-y divide-slate-100 text-sm bg-slate-50/70 rounded-xl p-4 border border-slate-200/60">
        <Row label="Opening balance" value={formatDollars(day.openingCents)} muted />
        <Row label="Expected incoming sales" value={`+${formatDollars(day.expectedInCents)}`} positive />
        {day.heldInCents > 0 && (
          <Row label="Held under risk check (excluded)" value={formatDollars(day.heldInCents)} muted />
        )}
        {day.dues.map((due) => (
          <Row
            key={due.id}
            label={`Out: ${due.payeeName}`}
            note={
              due.readyCents < due.amountCents
                ? `${formatDollars(due.readyCents)} of ${formatDollars(due.amountCents)} ready`
                : "Fully funded"
            }
            value={`${MINUS}${formatDollars(due.amountCents)}`}
            negative
          />
        ))}
        {day.dues.length === 0 && <Row label="Scheduled payments" value={`${MINUS}$0`} muted />}
        <Row label="Projected closing balance" value={formatDollars(day.closingCents)} strong isNegative={day.closingCents < 0} />
      </dl>
    </div>
  );
}

function Row({
  label,
  value,
  note,
  muted = false,
  strong = false,
  positive = false,
  negative = false,
  isNegative = false,
}: {
  label: string;
  value: string;
  note?: string;
  muted?: boolean;
  strong?: boolean;
  positive?: boolean;
  negative?: boolean;
  isNegative?: boolean;
}) {
  return (
    <div className={`flex items-baseline justify-between gap-4 py-2 ${strong ? "pt-3 font-semibold" : ""}`}>
      <dt className={muted ? "text-slate-500" : "text-slate-700"}>
        {label}
        {note && <span className="block text-xs font-mono text-slate-500 mt-0.5">{note}</span>}
      </dt>
      <dd
        className={`tabular-nums whitespace-nowrap ${
          strong
            ? `font-serif text-lg ${isNegative ? "text-rose-600" : "text-slate-900 font-bold"}`
            : positive
              ? "text-emerald-700 font-medium font-mono"
              : negative
                ? "text-slate-900 font-mono"
                : muted
                  ? "text-slate-500 font-mono"
                  : "text-slate-800 font-mono"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
