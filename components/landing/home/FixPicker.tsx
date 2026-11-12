"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Cents, DayState, Decision } from "@/types";
import type { LandingFix } from "@/lib/landing";
import { formatDollars, formatShortfall } from "@/lib/shared/money";
import { MiniTicket } from "../MiniTicket";

export interface PickerDay {
  date: string;
  label: string;
  weekday: string;
  day: string;
}

interface Run {
  closings: Cents[];
  states: DayState[];
  shortBy: Cents[];
}

const DECISION_WORD: Record<Decision, string> = { APPROVE: "Approved", ESCALATE: "Needs your OK", BLOCK: "Blocked" };
const STATE_WORD: Record<DayState, string> = { covered: "Covered", tight: "Tight", short: "Short" };

/** Untouched this long after coming into view, the first fix picks itself once, to show how it works. */
const DEMO_START_MS = 4200;

export function DayWord({ state, shortByCents }: { state: DayState; shortByCents: Cents }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden className={`h-dot h-dot-${state}`} />
      {state === "short" ? `Short ${formatShortfall(shortByCents)}` : STATE_WORD[state]}
    </span>
  );
}

/**
 * "Can you save Thursday?": pick one of the ways tmrw offers to cover the short day. Every choice was worked out on the
 * server by the real 30-day forecast and judged by the real Margin Guard (lib/landing). The tickets it changes flip
 * over, the money drops into Thursday's ticket, and the shopkeeper reacts: v2's worried scene while the day is short,
 * the relaxed one (with a COVERED stamp) once it's saved.
 */
export function FixPicker({
  days,
  base,
  fixes,
  shortIndex,
  shortWeekday,
}: {
  days: PickerDay[];
  base: Run;
  fixes: LandingFix[];
  shortIndex: number;
  /** "Thursday". */
  shortWeekday: string;
}) {
  const [choice, setChoice] = useState<string | null>(null);
  const [changed, setChanged] = useState(0);
  /** What the days showed before the last change, so only the days that moved flip over. */
  const [from, setFrom] = useState<Run>(base);
  const touched = useRef(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el || fixes.length === 0) return;
    let timer = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return window.clearTimeout(timer);
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        timer = window.setTimeout(() => {
          if (touched.current) return;
          setFrom(base);
          setChoice(fixes[0]!.id);
          setChanged((n) => n + 1);
          io.disconnect();
        }, DEMO_START_MS);
      },
      { threshold: 0.45 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, [fixes, base]);

  const fix = fixes.find((f) => f.id === choice) ?? null;
  const run: Run = fix ?? base;

  const pick = (id: string | null) => {
    touched.current = true;
    if (id === choice) return;
    setFrom(run);
    setChoice(id);
    setChanged((n) => n + 1);
  };
  const short = days[shortIndex]!;
  const sState = run.states[shortIndex]!;
  const saved = sState !== "short";
  const says =
    sState === "short"
      ? `${short.label} is ${formatShortfall(run.shortBy[shortIndex]!)} short. Help?`
      : sState === "tight"
        ? `Covered, just. Everyone still gets paid on ${short.label}.`
        : `${shortWeekday}'s covered. I can pay everyone.`;

  return (
    <div ref={box} className="grid items-start gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12">
      {/* The shopkeeper: worried while the day is short, relaxed once it's saved. */}
      <div className="lg:sticky lg:top-24">
        <div className="h-art relative">
          <Image src="/landing/scene_bills_custom.jpg" alt="" width={1376} height={768} unoptimized className="h-mood h-auto w-full" data-hidden={saved ? "" : undefined} />
          <Image
            src="/landing/scene_relaxed_custom.jpg"
            alt=""
            width={1376}
            height={768}
            unoptimized
            className="h-mood absolute inset-0 h-full w-full object-cover"
            data-hidden={saved ? undefined : ""}
          />
          <p key={says} className="h-say" aria-live="polite">
            {says}
          </p>
          {saved && changed > 0 ? (
            <span key={`stamp-${changed}`} aria-hidden className="h-covered-stamp animate-stamp-slam">
              {sState === "tight" ? `${shortWeekday} tight` : `${shortWeekday} covered`}
            </span>
          ) : null}
        </div>
      </div>

      <div className="min-w-0">
        <div role="group" aria-label={`Ways to save ${shortWeekday}`} className="h-seg">
          <button type="button" aria-pressed={choice === null} onClick={() => pick(null)}>
            Do nothing
          </button>
          {fixes.map((f) => (
            <button key={f.id} type="button" aria-pressed={choice === f.id} onClick={() => pick(f.id)}>
              {f.label}
            </button>
          ))}
        </div>

        <ol aria-label="Each day's balance at the end of the day" className="till-board mt-5 grid grid-cols-4 gap-x-2 gap-y-3 sm:grid-cols-7 lg:gap-x-2">
          {days.map((d, i) => {
            const state = run.states[i]!;
            const moved = changed > 0 && from.closings[i] !== run.closings[i];
            const isShortDay = i === shortIndex;
            return (
              <li key={moved ? `${d.date}-${changed}` : d.date} className={`relative min-w-0 ${moved ? "fix-flip" : ""} ${i > shortIndex ? "hidden sm:block" : ""}`}>
                <MiniTicket
                  label={i === 0 ? "Today" : `${d.weekday} ${d.day}`}
                  strong={i === 0}
                  closingCents={run.closings[i]!}
                  state={state}
                  shortByCents={run.shortBy[i]!}
                  stamp={isShortDay ? (state === "short" ? "short" : state === "tight" ? "tight" : "covered") : null}
                  narrow
                />
                {/* Thursday saved: the money drops into its ticket. */}
                {isShortDay && saved && changed > 0
                  ? [0, 1, 2].map((n) => <span key={`${changed}-${n}`} aria-hidden className="note-drop" style={{ animationDelay: `${n * 130}ms`, left: `${18 + n * 16}%` }} />)
                  : null}
              </li>
            );
          })}
        </ol>

        <div className="mt-5 min-h-[150px]" aria-live="polite">
          {fix ? (
            <div key={fix.id} className="h-slip-in h-card grid gap-4 p-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start sm:p-5">
              <span aria-hidden className={`h-ref h-ref-${fix.decision} mt-1 ml-1 hidden sm:block`} />
              <div>
                <p className="flex flex-wrap items-center gap-2 text-[16px] font-bold">
                  <span aria-hidden className={`h-ref h-ref-${fix.decision} inline-block !h-[24px] !w-[17px] sm:hidden`} />
                  Safety check: {DECISION_WORD[fix.decision]}
                  {fix.ruleNumber ? <span className="h-tag">Rule {fix.ruleNumber}</span> : null}
                  {fix.simulated ? <span className="h-tag">Simulated</span> : null}
                </p>
                <p className="mt-1 text-[15px] leading-6 text-[var(--h-strong)]">{fix.reason}</p>
                <p className="mt-3 text-[15px] leading-6 font-semibold">{fix.title}.</p>
                <p className="mt-3 text-[15px] font-bold">
                  <span className="h-stamp inline-block">
                    {short.label}: <DayWord state={sState} shortByCents={run.shortBy[shortIndex]!} />, {formatDollars(run.closings[shortIndex]!)} at the end of the day.
                  </span>
                </p>
              </div>
            </div>
          ) : (
            <p className="pt-1 text-[15.5px] leading-6 text-[var(--h-muted)]">
              Pick a fix above. Nothing moves until Penny taps.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
