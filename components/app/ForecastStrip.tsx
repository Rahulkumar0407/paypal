"use client";

import { useEffect, useState } from "react";
import type { ForecastDay } from "@/types";
import { StripTileFace } from "@/components/ui/MoneyStrip";
import { DayDetail } from "./DayDetail";

/**
 * The 30-day interactive strip. Tapping a day displays that day's financial breakdown.
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
  const day = days.find((d) => d.date === selected) ?? days[0]!;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            30-Day Daily Balance Trajectory
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Select any day to inspect opening balance, expected sales, and scheduled payments.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Covered
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Tight
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Short
          </span>
        </div>
      </div>

      <p id="strip-hint" className="sr-only">
        Choose a day to see its money in and out.
      </p>
      <ol
        aria-label="Your balance at the end of each of the next 30 days"
        aria-describedby="strip-hint"
        className="grid grid-cols-4 gap-2 sm:grid-cols-7 lg:gap-3"
      >
        {days.map((d) => (
          <li key={d.date} className="min-w-0">
            <button
              type="button"
              data-date={d.date}
              aria-pressed={d.date === selected}
              onClick={() => setSelected(d.date)}
              className={`block w-full rounded-2xl p-2.5 text-left transition-all border ${
                d.date === selected
                  ? "border-blue-600 ring-2 ring-blue-600/20 bg-blue-50/30 shadow-sm"
                  : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/60"
              }`}
            >
              <StripTileFace day={d} inverse={false} compact selected={d.date === selected} justFixed={justFixed.has(d.date)} />
            </button>
          </li>
        ))}
      </ol>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm" aria-live="polite">
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
