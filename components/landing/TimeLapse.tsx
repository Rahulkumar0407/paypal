"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { StoryDay } from "@/lib/landing";
import { DAY_FILL, DAY_WORD } from "@/components/ui/meaning";
import { formatDollars, formatShortfall } from "@/lib/shared/money";
import { SplitFlap } from "./SplitFlap";
import { useWeather } from "./Weather";

/** One note in the drawer stands for this much money. Drawing only; every amount shown is from the forecast. */
const NOTE_CENTS = 25_000;
const MAX_NOTES = 14;
/** Scroll height per day, in viewport heights, plus a hold on the last (short) day. */
const DAY_VH = 55;
const HOLD_VH = 80;

interface Flight {
  key: string;
  kind: "in" | "out";
  label: string;
  delay: number;
}

const notesFor = (cents: number) => Math.max(0, Math.min(MAX_NOTES, Math.round(cents / NOTE_CENTS)));

/** Where each note sits in the drawer's pile: a loose, fixed fan, so the pile looks handled, not random. */
const PILE = Array.from({ length: MAX_NOTES }, (_, i) => ({
  x: ((i * 37) % 9) - 4 + (i % 2 ? 6 : -6),
  y: -i * 3.2,
  r: (((i * 53) % 11) - 5) * 0.9,
}));

/** The narrator types its line out, so the eye follows it; screen readers get the whole sentence at once. */
function Narrator({ text }: { text: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let n = 0;
    const step = prefersReducedMotion() ? text.length : 2;
    const timer = window.setInterval(() => {
      n = Math.min(text.length, n + step);
      setCount(n);
      if (n >= text.length) window.clearInterval(timer);
    }, 22);
    return () => window.clearInterval(timer);
  }, [text]);
  return (
    <>
      <span className="sr-only" aria-live="polite">
        {text}
      </span>
      <span aria-hidden className="lapse-typed">
        {text.slice(0, count)}
        <span className="lapse-caret" />
        <span className="opacity-0">{text.slice(count)}</span>
      </span>
    </>
  );
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * The time-lapse: Loop Audio's days from today to the first short day, played by scrolling. The stage stays put
 * (CSS sticky) while the date flips, sales slide into the till drawer, payments fly out, the balance counts, and a
 * narrator line says what happened. On the short day the drawer is nearly empty and a SHORT stamp lands.
 */
export function TimeLapse({ days, allDays, minimumCents, sawIt }: { days: StoryDay[]; allDays: StoryDay[]; minimumCents: number; sawIt: string }) {
  const section = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  const [held, setHeld] = useState(false);
  const [balance, setBalance] = useState(days[0]!.closingCents);
  const [pileCents, setPileCents] = useState(days[0]!.closingCents);
  const [flights, setFlights] = useState<Flight[]>([]);
  const shown = useRef(0);
  const last = days.length - 1;
  const day = days[index]!;
  const short = day.state === "short";
  const report = useWeather();

  // The room dims when the story holds on the short day, and clears if the visitor scrolls back.
  useEffect(() => {
    report(held && short ? "dim" : "clear");
  }, [held, short, report]);

  // Scroll position → which day is showing. GSAP's ScrollTrigger tracks the section; loaded only on this page.
  useEffect(() => {
    let kill: (() => void) | undefined;
    let cancelled = false;
    void (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (cancelled || !section.current) return;
      gsap.registerPlugin(ScrollTrigger);
      const total = days.length * DAY_VH + HOLD_VH;
      const trigger = ScrollTrigger.create({
        trigger: section.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          const vh = self.progress * total;
          setIndex(Math.min(last, Math.floor(vh / DAY_VH)));
          setHeld(vh >= days.length * DAY_VH - DAY_VH * 0.4);
        },
      });
      kill = () => trigger.kill();
    })();
    return () => {
      cancelled = true;
      kill?.();
    };
  }, [days.length, last]);

  // A new day: its money moves (forward only), then the balance counts to the day's closing.
  useEffect(() => {
    const from = shown.current;
    shown.current = index;
    const target = days[index]!;
    const reduced = prefersReducedMotion();
    const timers: number[] = [];
    let frame = 0;
    const later = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));

    if (index > from && !reduced) {
      const moves = target.moves.map((m, i) => ({ key: `${target.date}-${i}`, kind: m.kind, label: `${m.label} ${m.kind === "in" ? "+" : "−"}${formatDollars(m.amountCents)}`, delay: i * 260 }));
      later(0, () => setFlights(moves));
      later(1700 + moves.length * 260, () => setFlights([]));
    } else {
      later(0, () => setFlights([]));
    }

    const start = performance.now();
    const fromCents = index > from ? target.openingCents : target.closingCents;
    const duration = reduced || index <= from ? 0 : 900;
    const tick = (now: number) => {
      const t = duration === 0 ? 1 : Math.min(1, (now - start - 250) / duration);
      const eased = t <= 0 ? 0 : 1 - Math.pow(1 - t, 3);
      setBalance(Math.round(fromCents + (target.closingCents - fromCents) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    later(reduced ? 0 : 650, () => setPileCents(target.closingCents));
    return () => {
      cancelAnimationFrame(frame);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [index, days]);

  const notes = notesFor(pileCents);
  const progress = useMemo(() => allDays.map((d, i) => ({ d, i })), [allDays]);

  return (
    <section ref={section} id="time-lapse" aria-labelledby="lapse-title" className="relative" style={{ height: `${days.length * DAY_VH + HOLD_VH + 100}vh` }}>
      <div className="sticky top-0 flex h-dvh flex-col justify-center overflow-hidden">
        <div className="mx-auto w-full max-w-[1240px] px-5 lg:px-10">
          <h2 id="lapse-title" className="text-[12px] font-semibold tracking-[0.2em] text-ink-muted uppercase">
            Loop Audio · the next two weeks
          </h2>
          <ol aria-hidden className="mt-3 grid grid-cols-14 gap-1 lg:gap-1.5">
            {progress.map(({ d, i }) => {
              const passed = i <= index;
              const ahead = i >= days.length;
              return (
                <li key={d.date} className="min-w-0">
                  <span className={`lapse-tick ${passed ? DAY_FILL[d.state] : ""} ${ahead ? "opacity-35" : ""} ${i === index ? "lapse-tick-now" : ""}`} />
                  <span className={`mt-1 block text-center text-[10px] tabular lg:text-[11px] ${i === index ? "font-semibold text-ink" : "text-ink-muted"}`}>
                    {d.flap.day}
                  </span>
                </li>
              );
            })}
          </ol>

          <div className="mt-8 grid items-center gap-8 lg:mt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14">
            <div>
              <SplitFlap words={[day.flap.weekday, day.flap.day.padStart(2, " "), day.flap.month]} label={day.label} />
              <p className="mt-6 text-[12px] font-semibold tracking-[0.18em] text-ink-muted uppercase">Loop Audio&apos;s money</p>
              <p className={`mt-1 font-serif text-[3.4rem] leading-none tracking-[-0.02em] tabular lg:text-[5rem] ${short ? "lapse-short-figure" : "text-ink"}`}>
                {formatDollars(balance)}
              </p>
              <p className="mt-3 flex items-center gap-2 text-[16px] font-semibold text-ink">
                <span aria-hidden className={`size-3 rounded-[3px] ${DAY_FILL[day.state]}`} />
                {short ? `${formatShortfall(day.shortByCents)} short of the ${formatDollars(minimumCents)} the shop needs` : DAY_WORD[day.state]}
              </p>
            </div>

            <div className={`lapse-drawer ${short ? "lapse-drawer-short" : ""}`} aria-hidden>
              <div className="lapse-tray">
                <div className="lapse-pile">
                  {PILE.slice(0, notes).map((p, i) => (
                    <span key={i} className="lapse-note" style={{ transform: `translate(${p.x}px, ${p.y}px) rotate(${p.r}deg)` }}>
                      <span className="cash-medallion" />
                      <span className="cash-maker">NeverShort</span>
                    </span>
                  ))}
                  {notes === 0 ? <span className="lapse-empty">Nearly empty</span> : null}
                </div>
              </div>
              {flights.map((f) => (
                <span key={f.key} className={`lapse-flight lapse-flight-${f.kind}`} style={{ animationDelay: `${f.delay}ms` }}>
                  <span className="lapse-flight-label">{f.label}</span>
                </span>
              ))}
              {short ? (
                <span key={day.date} className="lapse-stamp">
                  Short {formatShortfall(day.shortByCents)}
                </span>
              ) : null}
            </div>
          </div>

          <p className="lapse-narrator mt-8 min-h-[4rem] max-w-[52ch] text-[19px] leading-8 text-ink lg:mt-12 lg:text-[22px] lg:leading-9">
            <Narrator key={day.date} text={day.narrator} />
          </p>
          <p className={`lapse-saw mt-3 font-serif text-[1.5rem] leading-tight text-ink lg:text-[2rem] ${held && short ? "lapse-saw-on" : ""}`}>{sawIt}</p>
        </div>
      </div>
    </section>
  );
}
