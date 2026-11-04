"use client";

import { useEffect, useRef, useState } from "react";
import type { FixStep, StoryDay } from "@/lib/landing";
import { DECISION_FILL, DECISION_WORD } from "@/components/ui/meaning";
import { formatDollars, formatShortfall } from "@/lib/shared/money";
import { MiniTicket } from "./MiniTicket";
import { useWeather } from "./Weather";

const REPLAY_MS = 170;
/** The demo: after the tickets are dealt, the slider walks itself up to the best fix, one dollar at a time. */
const DEAL_MS = 1500;
const DEMO_STEP_MS = 90;

/**
 * One day on the board. Dealt in with the others; a day created after the deal (its state changed, so it remounted)
 * flips over, so the visitor sees exactly which days their choice moved.
 */
function BoardDay({ phase, dealt, index, children }: { phase: string; dealt: boolean; index: number; children: React.ReactNode }) {
  const [flip] = useState(dealt);
  const cls = phase === "waiting" ? "opacity-0" : phase === "dealing" ? "deal" : flip ? "fix-flip" : "";
  return (
    <li className={`min-w-0 ${cls}`} style={phase === "dealing" ? { animationDelay: `${index * 60}ms` } : undefined}>
      {children}
    </li>
  );
}

/**
 * "Now you fix it": the visitor picks how much to keep aside each day. Every slider step was worked out on the server
 * by the real forecast and judged by the real Margin Guard (lib/landing), so the tickets, the bank transfer and the
 * referee card are the app's own answers, not animation. Replay runs the two weeks again with the fix in place.
 */
export function FixIt({
  days,
  steps,
  bestStep,
  shortIndex,
  untilLabel,
}: {
  days: StoryDay[];
  steps: FixStep[];
  bestStep: number;
  shortIndex: number;
  /** The last day the money is kept aside, e.g. "Wed 11 Nov". */
  untilLabel: string;
}) {
  const [dollars, setDollars] = useState(0);
  const [replay, setReplay] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const [visible, setVisible] = useState(false);
  /** waiting (not seen yet) → dealing (tickets dealt) → demo (slider moves itself) → live (the visitor's turn). */
  const [phase, setPhase] = useState<"waiting" | "dealing" | "demo" | "live">("waiting");
  const [touched, setTouched] = useState(false);
  const section = useRef<HTMLElement>(null);
  const report = useWeather();
  const step = steps[dollars]!;
  const base = steps[0]!;
  const shortDay = days[shortIndex]!;
  // A blocked fix never runs, so the days stay as they were; anything else shows what the fix does.
  const blocked = step.decision === "BLOCK";
  const shownStep = blocked ? base : step;
  const stillShort = shownStep.states.includes("short");
  const firstBlock = steps.findIndex((s) => s.decision === "BLOCK");
  const presets = [
    { d: bestStep, label: `Try ${formatDollars(bestStep * 100)}` },
    { d: 20, label: "$20" },
    { d: firstBlock, label: formatDollars(firstBlock * 100) },
  ].filter((p) => p.d > 0 && p.d < steps.length);

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(Boolean(e?.isIntersecting)), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // First time on screen: deal the tickets, then play the demo (unless the visitor got there first or prefers no motion).
  useEffect(() => {
    if (!visible || phase !== "waiting") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = window.setTimeout(() => setPhase(reduced ? "live" : "dealing"), 0);
    return () => window.clearTimeout(start);
  }, [visible, phase]);
  useEffect(() => {
    if (phase !== "dealing") return;
    const t = window.setTimeout(() => setPhase(touched ? "live" : "demo"), DEAL_MS);
    return () => window.clearTimeout(t);
  }, [phase, touched]);
  useEffect(() => {
    if (phase !== "demo") return;
    if (touched || dollars >= bestStep) {
      const t = window.setTimeout(() => setPhase("live"), 0);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setDollars((d) => d + 1), DEMO_STEP_MS);
    return () => window.clearTimeout(t);
  }, [phase, dollars, bestStep, touched]);
  const choose = (d: number) => {
    setTouched(true);
    setDollars(d);
  };

  // While this section is on screen, the room is dim until the gap is fixed.
  useEffect(() => {
    if (visible) report(stillShort ? "dim" : "clear");
  }, [visible, stillShort, report]);

  // Replay: light each day in turn, then land the stamps again.
  useEffect(() => {
    if (replay === null) return;
    const timer = window.setTimeout(() => {
      if (replay >= days.length - 1) {
        setReplay(null);
        setRound((r) => r + 1);
      } else setReplay(replay + 1);
    }, REPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [replay, days.length]);

  const shown = replay ?? shortIndex;
  const keys = days.map((d, i) => `${d.date}-${shownStep.states[i]}-${round}`);
  const dealt = phase === "demo" || phase === "live";

  return (
    <section
      ref={section}
      id="fix"
      aria-labelledby="fix-title"
      data-inview={phase === "waiting" ? undefined : ""}
      data-phase={phase}
      className="fix-stage relative mx-auto w-full max-w-[1240px] px-5 py-24 lg:px-10 lg:py-36"
    >
      <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        <div>
          <div className="reveal">
          <p className="text-[12px] font-semibold tracking-[0.2em] text-ink-muted uppercase">Rewind</p>
          <h2 id="fix-title" className="mt-3 font-serif text-[2.4rem] leading-[1.04] tracking-[-0.02em] text-ink lg:text-[3.4rem]">
            Now you fix it.
          </h2>
          <p className="mt-5 max-w-[44ch] text-[18px] leading-8 text-ink">
            How much should Loop Audio keep aside each day until {untilLabel}? It stays in PayPal instead of going to the
            owner&apos;s bank.
          </p>
          </div>

          <div className="fix-dial mt-8">
            <p className="font-serif leading-none text-ink">
              <output htmlFor="fix-range" className="text-[3.6rem] tracking-[-0.02em] tabular lg:text-[4.6rem]">
                {formatDollars(step.dailyCents)}
              </output>
              <span className="ml-2 text-[1.4rem] text-ink-muted">a day</span>
            </p>
            <label htmlFor="fix-range" className="sr-only">
              Keep aside each day, in dollars
            </label>
            <div className="relative">
            {phase === "live" && !touched ? (
              <span aria-hidden className="drag-hint" style={{ left: `calc(${(dollars / (steps.length - 1)) * 100}% - ${(dollars / (steps.length - 1)) * 34}px + 17px)` }}>
                Your turn: drag it
              </span>
            ) : null}
            <input
              id="fix-range"
              type="range"
              min={0}
              max={steps.length - 1}
              step={1}
              value={dollars}
              onChange={(e) => choose(Number(e.target.value))}
              aria-valuetext={`${formatDollars(step.dailyCents)} a day`}
              className="fix-range mt-5 w-full"
            />
            </div>
            {/* On a phone the board is below: show the day that matters, live, right under the slider. */}
            <div aria-hidden className="fix-live mt-5 flex items-center gap-4 rounded-[14px] bg-[#1f3129] p-3 lg:hidden">
              <div className="w-[76px] shrink-0">
                <MiniTicket
                  label={days[shortIndex]!.label.split(" ").slice(0, 2).join(" ")}
                  strong
                  closingCents={shownStep.closings[shortIndex]!}
                  state={shownStep.states[shortIndex]!}
                  shortByCents={shownStep.shortBy[shortIndex]!}
                  stamp={shownStep.states[shortIndex] === "short" ? "short" : null}
                />
              </div>
              <div className="min-w-0 text-white">
                <p className="text-[15px] leading-6 font-semibold">
                  {shownStep.states[shortIndex] === "short"
                    ? `Still ${formatShortfall(shownStep.shortBy[shortIndex]!)} short`
                    : shownStep.states[shortIndex] === "tight"
                      ? "Not short any more: tight"
                      : "Not short any more: covered"}
                </p>
                {step.decision ? (
                  <p className="mt-1 flex items-center gap-2 text-[13px] leading-5 text-white/85">
                    <span className={`inline-block h-[15px] w-[11px] -rotate-[11deg] rounded-[2px] ${DECISION_FILL[step.decision]}`} />
                    Margin Guard: {DECISION_WORD[step.decision]}
                  </p>
                ) : (
                  <p className="mt-1 text-[13px] leading-5 text-white/75">Drag to keep some aside.</p>
                )}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {presets.map((p) => (
                <button key={p.d} type="button" onClick={() => choose(p.d)} className="key key-sm !min-h-10 !px-3.5 !text-[11px]">
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 min-h-[150px]" aria-live="polite">
            {step.decision ? (
              <div key={step.decision} className="guard-card on-paper rounded-card bg-paper p-5">
                <div className="flex items-start gap-4">
                  <span aria-hidden className={`ref-card ${DECISION_FILL[step.decision]}`} />
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold tracking-[0.16em] text-ink-muted uppercase">Margin Guard</p>
                    <p className="mt-0.5 text-[22px] leading-7 font-semibold text-ink">{DECISION_WORD[step.decision]}</p>
                    <p className="mt-1 text-[15px] leading-6 text-ink">{step.reason}</p>
                    <p className="mt-2 text-[13px] leading-5 text-ink-muted">
                      {formatDollars(step.totalCents)} kept aside in total{step.ruleNumber ? ` · rule ${step.ruleNumber} of 9` : " · all 9 rules checked"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="max-w-[40ch] text-[16px] leading-7 text-ink-muted">
                Drag the slider. Every fix goes to the Margin Guard, NeverShort&apos;s safety check, before any money moves.
              </p>
            )}
          </div>
        </div>

        <div>
          <div className="fix-board">
            <p className="text-[13px] leading-5 text-white/80">
              {dollars === 0
                ? "Loop Audio's next 14 days, as they stand"
                : blocked
                  ? "Blocked, so nothing moves: the next 14 days stay as they were"
                  : step.decision === "ESCALATE"
                    ? `If you approve keeping ${formatDollars(step.dailyCents)} a day aside`
                    : `Loop Audio's next 14 days, keeping ${formatDollars(step.dailyCents)} a day aside`}
            </p>
            <ol aria-label="Balance at the end of each day with this fix" className="mt-4 grid grid-cols-4 gap-x-2 gap-y-3 sm:grid-cols-7 sm:gap-y-4">
              {days.map((d, i) => {
                const state = shownStep.states[i]!;
                const fixedNow = base.states[i] === "short" && state !== "short";
                const stamp = state === "short" ? "short" : fixedNow ? (state === "tight" ? "tight" : "covered") : null;
                return (
                  <BoardDay key={keys[i]} phase={phase} dealt={dealt} index={i}>
                    <MiniTicket
                      label={i === 0 ? "Today" : `${d.flap.weekday.charAt(0)}${d.flap.weekday.slice(1).toLowerCase()} ${d.flap.day}`}
                      strong={i === 0}
                      closingCents={shownStep.closings[i]!}
                      state={state}
                      shortByCents={shownStep.shortBy[i]!}
                      stamp={stamp}
                      lit={replay === i}
                    />
                  </BoardDay>
                );
              })}
            </ol>
            <p className="mt-5 text-[15px] leading-6 text-white">
              {replay !== null ? (
                <>
                  {days[shown]!.label}: {formatDollars(shownStep.closings[shown]!)} at the end of the day.
                </>
              ) : !blocked && dollars > 0 && step.transferCents !== null && base.transferCents !== null ? (
                <>
                  The owner&apos;s bank transfer becomes {formatDollars(step.transferCents)} instead of {formatDollars(base.transferCents)}.{" "}
                  {shortDay.label} ends with {formatDollars(step.closings[shortIndex]!)}.
                </>
              ) : blocked ? (
                <>
                  {shortDay.label} stays at {formatDollars(base.closings[shortIndex]!)}, {formatShortfall(base.shortBy[shortIndex]!)} short. Try a smaller amount.
                </>
              ) : (
                <>
                  {shortDay.label} ends with {formatDollars(step.closings[shortIndex]!)}.
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReplay(0)}
            disabled={replay !== null}
            className="key key-sm mt-5 !min-h-12 !px-5 !text-[12px] disabled:opacity-60"
          >
            Replay the two weeks
          </button>
        </div>
      </div>
    </section>
  );
}
