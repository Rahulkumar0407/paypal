"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { StoryDay } from "@/lib/landing";
import { formatCents, formatDollars, formatShortfall } from "@/lib/shared/money";

const word = (d: StoryDay) => (d.state === "short" ? `Short by ${formatShortfall(d.shortByCents)}` : d.state === "tight" ? "Tight" : "Covered");

/**
 * v2's magnifier: the shopkeeper studies the calendar, and the visitor picks any of the next 14 days to read it, its
 * balance, the cushion, and what comes in and goes out. Every number is the real forecast's (lib/landing).
 */
export function DayLens({ days, start, minimumCents }: { days: StoryDay[]; start: number; minimumCents: number }) {
  const [picked, setPicked] = useState(start);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const day = days[picked] ?? days[0]!;

  const onKey = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    const next =
      e.key === "ArrowRight" ? Math.min(i + 1, days.length - 1) : e.key === "ArrowLeft" ? Math.max(i - 1, 0) : e.key === "Home" ? 0 : e.key === "End" ? days.length - 1 : null;
    if (next === null) return;
    e.preventDefault();
    setPicked(next);
    buttons.current[next]?.focus();
  };

  return (
    <div className="v2-lens-scene">
      <div className="v2-lens-art">
        <div className="h-art relative w-full">
          <div className="h-parallax">
            <Image src="/landing/scene_forecast_custom.jpg" alt="The shopkeeper studies the shop calendar through a magnifying glass" width={1376} height={768} unoptimized className="v2-lens-image" />
          </div>
          <div key={day.date} className={`v2-lens-marker v2-lens-marker-${day.state} h-stamp`} aria-hidden="true">
            <span className="v2-lens-marker-dot" />
            <span>
              {day.weekday} {day.day}
            </span>
            <span>{word(day)}</span>
          </div>
        </div>
      </div>

      <div className="v2-lens-reading">
        <div className="v2-lens-date">
          <span className="v2-kicker">Pick a day</span>
          <span className="v2-lens-date-label" aria-live="polite">
            {day.label}
          </span>
        </div>

        <div className="v2-day-rail" role="group" aria-label="Choose one of the next 14 days. Arrow keys move between days.">
          <div className="v2-day-rail-line" aria-hidden="true" />
          {days.map((d, i) => (
            <button
              key={d.date}
              ref={(el) => {
                buttons.current[i] = el;
              }}
              type="button"
              aria-pressed={picked === i}
              aria-label={`${d.label}: ${word(d)}; ${formatCents(d.closingCents)} at the end of the day`}
              onClick={() => setPicked(i)}
              onKeyDown={(e) => onKey(e, i)}
              className={`v2-day-stop v2-day-stop-${d.state}${picked === i ? " is-selected" : ""}`}
            >
              <span className="v2-day-stop-pin" aria-hidden="true" />
              <span className="v2-day-stop-weekday">{d.flap.weekday}</span>
              <span className="v2-day-stop-date">{d.day}</span>
              <span className="v2-day-stop-status">{d.state === "short" ? "Short" : d.state === "tight" ? "Tight" : "OK"}</span>
            </button>
          ))}
        </div>

        <div key={day.date} className={`v2-lens-details v2-lens-details-${day.state} h-slip-in`} aria-live="polite" aria-atomic="true">
          <p className="v2-lens-narrator">{day.narrator}</p>
          <div className="v2-lens-metrics">
            <div className="v2-lens-metric">
              <span>Balance at the end of the day</span>
              <strong>{formatCents(day.closingCents)}</strong>
            </div>
            <div className="v2-lens-metric">
              <span>Safety cushion</span>
              <strong>{formatCents(minimumCents)}</strong>
            </div>
            <div className="v2-lens-metric v2-lens-gap">
              <span>{day.state === "short" ? "Short by" : "Gap"}</span>
              <strong>{day.state === "short" ? formatShortfall(day.shortByCents) : "$0"}</strong>
            </div>
          </div>
          <div className="v2-lens-obligations">
            <span className="v2-kicker">That day</span>
            <ul>
              {day.moves.map((m, i) => (
                <li key={`${day.date}-${i}`} className={m.kind === "out" ? "is-outflow" : "is-inflow"}>
                  <span>{m.kind === "in" ? "Expected sales, after PayPal's fee" : m.label}</span>
                  <strong>
                    {m.kind === "out" ? "−" : "+"}
                    {formatDollars(m.amountCents)}
                  </strong>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
