import type { ForecastDay } from "@/types";
import { dayOfMonth, weekdayShort } from "@/lib/shared/dates";
import { formatDollars, formatShortfall } from "@/lib/shared/money";
import { DAY_FILL, DAY_WORD } from "./meaning";

/**
 * Signature element 2: the 14-day money strip. Read like a weather forecast row:
 * the day above, a coloured block with the day's closing balance, the condition below.
 * Phone: one scrolling row. Laptop: two weeks, seven columns each.
 * Text inside a coloured block is large and bold (21px bold / 27px semibold), so it stays readable on red.
 */
export function MoneyStrip({ days, caption = true, inverse = false }: { days: ForecastDay[]; caption?: boolean; inverse?: boolean }) {
  return (
    <figure className="min-w-0">
      <ol
        aria-label="Your balance at the end of each of the next 14 days"
        className="-mx-5 flex snap-x scroll-px-5 gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 lg:grid lg:grid-cols-7 lg:gap-x-3 lg:gap-y-5 lg:overflow-visible"
      >
        {days.map((day) => (
          <StripTile key={day.date} day={day} inverse={inverse} />
        ))}
      </ol>
      {caption ? (
        <figcaption className={`mt-3 text-[13px] leading-5 ${inverse ? "text-white/75" : "text-ink-muted"}`}>
          Balance at the end of each day, after expected sales and known payments.
        </figcaption>
      ) : null}
    </figure>
  );
}

export function StripTile({ day, inverse = false }: { day: ForecastDay; inverse?: boolean }) {
  return (
    <li className="w-[88px] shrink-0 snap-start lg:w-auto">
      <StripTileFace day={day} inverse={inverse} />
    </li>
  );
}

/**
 * The inside of a tile: the day, a ticket stub coloured by how the day looks with its closing balance, and the
 * condition word. A short day carries a SHORT ink stamp; `justFixed` lands a COVERED stamp (the gap was just fixed).
 * Reused by tappable strips.
 */
export function StripTileFace({
  day,
  inverse = false,
  selected = false,
  justFixed = false,
}: {
  day: ForecastDay;
  inverse?: boolean;
  selected?: boolean;
  justFixed?: boolean;
}) {
  const condition = day.state === "short" ? `${formatShortfall(day.shortByCents)} short` : DAY_WORD[day.state];
  const label = day.isToday ? "Today" : (
    <>
      {weekdayShort(day.date)} <span className="tabular">{dayOfMonth(day.date)}</span>
    </>
  );
  return (
    <>
      <p className="text-[13px] leading-5 whitespace-nowrap">
        <span
          className={`inline-block rounded-full px-1.5 -mx-1.5 ${
            selected ? (inverse ? "bg-white font-semibold text-ink on-paper" : "bg-ink font-semibold text-white") : day.isToday ? `font-semibold ${inverse ? "text-white" : "text-ink"}` : inverse ? "text-white/80" : "text-ink-muted"
          }`}
        >
          {label}
        </span>
      </p>
      <div className="ticket-wrap mt-1" data-selected={selected}>
        <div className={`strip-block ticket flex h-[76px] items-end rounded-tile px-2.5 pb-2 lg:h-[92px] lg:px-3 lg:pb-2.5 ${DAY_FILL[day.state]}`}>
          <span className="font-serif text-[21px] leading-none font-bold tracking-[-0.02em] whitespace-nowrap text-ink tabular lg:text-[27px] lg:font-semibold">
            {formatDollars(day.closingCents)}
          </span>
          {day.state === "short" ? (
            <span aria-hidden className="ticket-stamp ticket-stamp-short">
              Short
            </span>
          ) : justFixed ? (
            <span aria-hidden className="ticket-stamp ticket-stamp-covered ticket-stamp-land">
              Covered
            </span>
          ) : null}
        </div>
      </div>
      <p
        className={`mt-1.5 text-[13px] leading-4 whitespace-nowrap ${
          inverse ? (day.state === "covered" ? "text-white/80" : "font-semibold text-white") : day.state === "covered" ? "text-ink-muted" : "font-semibold text-ink"
        }`}
      >
        {condition}
      </p>
    </>
  );
}
