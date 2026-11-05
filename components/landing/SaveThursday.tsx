"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { FixStep } from "@/lib/landing";
import { DECISION_FILL, DECISION_WORD } from "@/components/ui/meaning";
import { weekdayLong } from "@/lib/shared/dates";
import { formatDollars, formatShortfall } from "@/lib/shared/money";
import { MiniTicket } from "./MiniTicket";
import { Owner, type OwnerMood } from "./Owner";

/** Untouched this long after coming into view, the handle glides to the best fix once, to show how it works. */
const DEMO_START_MS = 3600;
/** How long the owner's entrance and the deal of the 14 tickets take. */
const DEAL_MS = 2000;

/**
 * One ticket on the board. Dealt in with the others; a ticket that mounts after the deal (its day changed, so it
 * remounted) flips over instead, so the visitor sees exactly which days their choice moved.
 */
function BoardDay({ seen, dealt, index, hidePhone, children }: { seen: boolean; dealt: boolean; index: number; hidePhone: boolean; children: React.ReactNode }) {
  const [flip] = useState(dealt);
  const cls = !seen ? "opacity-0" : flip ? "fix-flip" : "deal";
  return (
    <li className={`relative min-w-0 ${cls} ${hidePhone ? "hidden sm:block" : ""}`} style={!flip ? { animationDelay: `${700 + index * 60}ms` } : undefined}>
      {children}
    </li>
  );
}
const GLIDE_MS = 1100;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

interface DayLabel {
  date: string;
  label: string;
  longLabel: string;
}

/**
 * "Can you save Thursday?": the visitor keeps a little aside each day with a slider. Every step was worked out on
 * the server by the real forecast and judged by the real Margin Guard (lib/landing). The owner reacts: worried while a
 * day is short, arms crossed and grinning when it's covered, alarmed when the safety check blocks the move.
 */
export function SaveThursday({ days, steps, bestStep, shortIndex }: { days: DayLabel[]; steps: FixStep[]; bestStep: number; shortIndex: number }) {
  /** The choice the days, the owner and the safety check show. */
  const [dollars, setDollars] = useState(0);
  /** Where the handle and the big amount are: the same as `dollars`, except while the demo glides. */
  const [handle, setHandle] = useState(0);
  const [touched, setTouched] = useState(false);
  const touchedRef = useRef(false);
  const glide = useRef(0);
  const section = useRef<HTMLElement>(null);
  /** On screen once: the heading rises, the owner pops up behind the counter and the tickets are dealt. */
  const [seen, setSeen] = useState(false);
  /** The deal is over: from now on a ticket whose day changes flips over instead. */
  const [dealt, setDealt] = useState(false);

  // Seen for the first time and left alone: the handle glides to the best fix in one smooth move, and the result lands
  // once at the end (not a flicker of every dollar on the way).
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    let timer = 0;
    let dealTimer = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return;
        io.disconnect();
        setSeen(true);
        dealTimer = window.setTimeout(() => setDealt(true), DEAL_MS);
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        timer = window.setTimeout(() => {
          if (touchedRef.current) return;
          const start = performance.now();
          const tick = (now: number) => {
            if (touchedRef.current) return;
            const t = Math.min(1, (now - start) / GLIDE_MS);
            setHandle(Math.round(bestStep * easeInOut(t)));
            if (t < 1) glide.current = requestAnimationFrame(tick);
            else setDollars(bestStep);
          };
          glide.current = requestAnimationFrame(tick);
        }, DEMO_START_MS);
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
      window.clearTimeout(dealTimer);
      cancelAnimationFrame(glide.current);
    };
  }, [bestStep]);

  const choose = (d: number) => {
    touchedRef.current = true;
    cancelAnimationFrame(glide.current);
    setTouched(true);
    setHandle(d);
    setDollars(d);
  };

  const base = steps[0]!;
  const step = steps[dollars]!;
  const blocked = step.decision === "BLOCK";
  const shown = blocked ? base : step;
  const firstShort = shown.states.indexOf("short");
  const mood: OwnerMood = blocked ? "alarmed" : firstShort >= 0 ? "worried" : "happy";
  const thursday = days[shortIndex]!;
  const firstBlock = steps.findIndex((s) => s.decision === "BLOCK");

  const says =
    mood === "alarmed"
      ? "That's too much to keep back from sales."
      : mood === "happy"
        ? `${weekdayLong(thursday.date)}'s covered. I can pay everyone.`
        : dollars === 0
          ? `${thursday.longLabel} is ${formatShortfall(shown.shortBy[firstShort] ?? 0)} short. Help?`
          : `Better. Still ${formatShortfall(shown.shortBy[firstShort] ?? 0)} short on ${days[firstShort]!.longLabel}.`;

  return (
    <section ref={section} id="save" aria-labelledby="save-title" data-inview={seen ? "" : undefined} className="save-stage">
      <div className="mx-auto w-full max-w-[1240px] px-5 py-20 lg:px-10 lg:py-28">
        <div className="reveal">
          <p className="pill pill-dark">Your turn</p>
          <h2 id="save-title" className="display mt-5 text-[2.8rem] leading-[0.95] text-white lg:text-[4.4rem]">
            Can you save Thursday?
          </h2>
          <p className="mt-5 max-w-[52ch] text-[18px] leading-8 text-white/85">
            Keep a little of each day&apos;s sales in PayPal instead of sending it all to the owner&apos;s bank. Too
            little and Thursday is still short. Too much and the safety check stops you.
          </p>
        </div>

        <div className="save-play mt-10 grid gap-x-14 gap-y-6 lg:mt-12 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
          <div className="lg:col-start-2 lg:row-start-1">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <p className="leading-none text-white">
                <output htmlFor="save-range" className="display text-[4rem] tabular lg:text-[5rem]">
                  {formatDollars(handle * 100)}
                </output>
                <span className="ml-2 text-[1.3rem] text-white/70">a day kept aside</span>
              </p>
              <div className="flex gap-2">
                {[5, bestStep, firstBlock].filter((d, i, a) => d > 0 && a.indexOf(d) === i).map((d) => (
                  <button key={d} type="button" onClick={() => choose(d)} className={`chip ${dollars === d ? "chip-on" : ""}`}>
                    {formatDollars(d * 100)}
                  </button>
                ))}
              </div>
            </div>
            <label htmlFor="save-range" className="sr-only">
              Keep aside each day, in dollars
            </label>
            <div className="relative mt-5">
              {!touched && handle === 0 ? (
                <span aria-hidden className="drag-hint save-hint" style={{ left: 0 }}>
                  Drag me
                </span>
              ) : null}
              <input
                id="save-range"
                type="range"
                min={0}
                max={steps.length - 1}
                step={1}
                value={handle}
                onChange={(e) => choose(Number(e.target.value))}
                className="fix-range w-full"
              />
            </div>
          </div>

          {/* The owner: beside her words on a phone (so the tickets stay in view while you drag), behind the counter on a laptop. */}
          <div className="save-owner lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:self-end">
            {seen ? (
              <p className={`bubble bubble-in ${dealt ? "" : "bubble-late"}`} key={mood} aria-live="polite">
                {says}
              </p>
            ) : null}
            <div className="save-owner-figure">
              <Owner mood={mood} className="relative z-[1] mx-auto w-[86%]" />
              <div aria-hidden className="counter counter-dark" />
            </div>
          </div>

          <div className="lg:col-start-2 lg:row-start-2">
            <ol aria-label="Each day's closing balance with this choice" className="till-board grid grid-cols-4 gap-x-2 gap-y-3 sm:grid-cols-7 lg:gap-x-2.5">
              {days.map((d, i) => {
                const state = shown.states[i]!;
                return (
                  <BoardDay key={`${d.date}-${state}`} seen={seen} dealt={dealt} index={i} hidePhone={i > shortIndex}>
                    <MiniTicket
                      label={d.label}
                      strong={i === 0}
                      closingCents={shown.closings[i]!}
                      state={state}
                      shortByCents={shown.shortBy[i]!}
                      stamp={i === shortIndex ? (state === "short" ? "short" : state === "tight" ? "tight" : "covered") : null}
                      narrow
                    />
                    {/* Thursday saved: the money kept aside drops into its ticket. */}
                    {i === shortIndex && state !== "short" && dealt
                      ? [0, 1, 2].map((n) => <span key={n} aria-hidden className="note-drop" style={{ animationDelay: `${n * 130}ms`, left: `${18 + n * 16}%` }} />)
                      : null}
                  </BoardDay>
                );
              })}
            </ol>

            {step.decision ? (
              <div key={step.decision} className={`guard-slip mt-5 flex items-start gap-4 ${step.decision === "BLOCK" ? "slip-shake" : "slip-in"}`} aria-live="polite">
                <span aria-hidden className={`ref-card shrink-0 ${DECISION_FILL[step.decision]}`} />
                <div>
                  <p className="text-[13px] font-semibold tracking-[0.12em] text-ink-muted uppercase">Safety check</p>
                  <p className="text-[20px] leading-7 font-semibold text-ink">{DECISION_WORD[step.decision]}</p>
                  <p className="text-[15px] leading-6 text-ink">{step.reason}</p>
                </div>
              </div>
            ) : (
              <p className="mt-5 text-[15px] text-white/70">Drag the slider, or tap an amount.</p>
            )}
          </div>
        </div>
        <p className="mt-10 text-[17px] text-white/85">
          That was Loop Audio.{" "}
          <Link href="/try" className="font-semibold text-white underline decoration-white/40 underline-offset-[5px] hover:decoration-white">
            Now find your own shop&apos;s short day
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
