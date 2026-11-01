"use client";

import { useEffect, useRef, useState } from "react";
import type { ForecastDay } from "@/types";
import { StripTileFace } from "@/components/ui/MoneyStrip";
import { DayDetail } from "./DayDetail";

/**
 * The 14-day strip you can tap. Tapping a day shows that day's money in and out underneath.
 * Starts on the first short day (or today). On a phone the strip scrolls sideways inside the note.
 */
export function ForecastStrip({
  days,
  initialDate,
  minimumBalanceCents,
}: {
  days: ForecastDay[];
  initialDate: string;
  minimumBalanceCents: number;
}) {
  const [selected, setSelected] = useState(initialDate);
  const listRef = useRef<HTMLOListElement>(null);
  const day = days.find((d) => d.date === selected) ?? days[0]!;

  // On a phone, bring the starting day into view without moving the page.
  useEffect(() => {
    const list = listRef.current;
    const button = list?.querySelector<HTMLElement>(`[data-date="${initialDate}"]`);
    if (list && button && list.scrollWidth > list.clientWidth) {
      list.scrollLeft = Math.max(0, button.offsetLeft - list.offsetLeft - 8);
    }
  }, [initialDate]);

  return (
    <div>
      <p id="strip-hint" className="sr-only">
        Choose a day to see its money in and out.
      </p>
      <ol
        ref={listRef}
        aria-label="Your balance at the end of each of the next 14 days"
        aria-describedby="strip-hint"
        className="flex snap-x gap-2 overflow-x-auto pb-1 [scrollbar-width:none] lg:grid lg:grid-cols-7 lg:gap-x-3 lg:gap-y-5 lg:overflow-visible"
      >
        {days.map((d) => (
          <li key={d.date} className="w-[88px] shrink-0 snap-start lg:w-auto">
            <button
              type="button"
              data-date={d.date}
              aria-pressed={d.date === selected}
              onClick={() => setSelected(d.date)}
              className="block w-full rounded-tile text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              <StripTileFace day={d} inverse selected={d.date === selected} />
            </button>
          </li>
        ))}
      </ol>
      <div className="mt-5 border-t border-white/20 pt-5" aria-live="polite">
        <DayDetail day={day} minimumBalanceCents={minimumBalanceCents} />
      </div>
    </div>
  );
}
