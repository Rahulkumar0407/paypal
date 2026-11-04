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
  const justFixed = useJustFixed(days);
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
              <StripTileFace day={d} inverse selected={d.date === selected} justFixed={justFixed.has(d.date)} />
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

const SEEN_KEY = "nevershort:strip-seen";

/**
 * Days that were short the last time this tab showed the strip and aren't any more: the gap was just fixed, so
 * their COVERED stamp lands. Remembered for the tab only (sessionStorage); without it, nothing is stamped.
 */
function useJustFixed(days: ForecastDay[]): Set<string> {
  const [fixed, setFixed] = useState<Set<string>>(() => new Set());
  const signature = days.map((d) => `${d.date}:${d.state}`).join(",");
  useEffect(() => {
    let seen: Record<string, string> = {};
    try {
      seen = JSON.parse(sessionStorage.getItem(SEEN_KEY) ?? "{}") as Record<string, string>;
    } catch {
      seen = {};
    }
    const newly = signature
      .split(",")
      .map((pair) => pair.split(":") as [string, string])
      .filter(([date, state]) => seen[date] === "short" && state !== "short")
      .map(([date]) => date);
    // Next frame: the strip paints first, then the stamp lands on it. What was seen is saved in the same frame, so an
    // effect that is cancelled and run again (React does this in development) still finds the old states.
    const frame = requestAnimationFrame(() => {
      try {
        sessionStorage.setItem(SEEN_KEY, JSON.stringify(Object.fromEntries(signature.split(",").map((pair) => pair.split(":")))));
      } catch {
        // Private mode: nothing is remembered and nothing is stamped.
      }
      if (newly.length > 0) setFixed((current) => new Set([...current, ...newly]));
    });
    return () => cancelAnimationFrame(frame);
  }, [signature]);
  return fixed;
}
