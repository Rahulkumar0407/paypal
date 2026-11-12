"use client";

import { useEffect, useRef, useState } from "react";
import type { DayState } from "@/types";
import { formatShortfall } from "@/lib/shared/money";
import { MiniTicket } from "../MiniTicket";
import { Owner } from "../Owner";

export interface BoardDay {
  date: string;
  /** "Today", "Fri 6". */
  label: string;
  closingCents: number;
  state: DayState;
  shortByCents: number;
}

/** When the red ticket lands (its deal delay + stamp), Penny sees it. */
const SEES_IT_MS = 2300;

/**
 * The problem, acted out: Penny behind her counter under the moon, calm. The next 14 days are dealt onto the till board
 * like cards; the short day lands last, its SHORT stamp thumps on, and her face drops. Numbers from the real forecast.
 */
export function ShortDayBoard({
  days,
  shortIndex,
  shortWeekday,
  headline,
  children,
}: {
  days: BoardDay[];
  shortIndex: number;
  /** "Thursday". */
  shortWeekday: string;
  headline: string;
  children: React.ReactNode;
}) {
  const [dealt, setDealt] = useState(false);
  const [sees, setSees] = useState(false);
  const board = useRef<HTMLDivElement>(null);
  const short = days[shortIndex];

  useEffect(() => {
    const el = board.current;
    if (!el) return;
    let timer = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return;
        io.disconnect();
        setDealt(true);
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        timer = window.setTimeout(() => setSees(true), reduced ? 0 : SEES_IT_MS);
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div ref={board} className="mt-16 lg:mt-24">
      <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-14">
        {/* Penny at her counter. */}
        <div className="hero-scene relative order-2 mx-auto w-full max-w-[340px] lg:order-1 lg:max-w-[420px]">
          <div aria-hidden className="scene-sun h-moon" />
          {short ? (
            <p className={`bubble ${sees ? "bubble-in" : ""}`} aria-live="polite">
              {sees ? `${shortWeekday}'s going to be ${formatShortfall(short.shortByCents)} short.` : " "}
            </p>
          ) : null}
          <div className="scene-window">
            <Owner mood={sees ? "worried" : "calm"} className="relative z-[1] w-[78%] translate-x-[8%]" />
          </div>
          <div aria-hidden className="counter" />
        </div>
        <div className="order-1 lg:order-2">{children}</div>
      </div>

      <div className="till-board h-board-night mt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <p className="text-[17px] leading-snug font-semibold text-white sm:text-[19px]">{headline}</p>
          <p className="text-[13px] text-white/60">Dunder Mifflin & Co., a sample shop - next 14 days</p>
        </div>
        <ol aria-label="The balance at the end of each of the next 14 days" className="mt-5 grid grid-cols-4 gap-x-2 gap-y-3 sm:grid-cols-7 lg:gap-x-2.5">
          {days.map((d, i) => {
            const isShort = i === shortIndex;
            return (
              <li
                key={d.date}
                className={`min-w-0 ${dealt ? `deal ${isShort ? "deal-last" : ""}` : "opacity-0"} ${i > shortIndex ? "hidden sm:block" : ""}`}
                style={dealt ? { animationDelay: `${300 + (isShort ? days.length : i) * 75}ms` } : undefined}
              >
                <MiniTicket label={d.label} strong={i === 0} closingCents={d.closingCents} state={d.state} shortByCents={d.shortByCents} stamp={isShort ? "short" : null} />
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
