"use client";

import { useEffect, useRef, useState } from "react";
import { formatCents, formatDollars, formatShortfall } from "@/lib/shared/money";
import { Maya } from "./Maya";

type Phase = "idle" | "paying" | "paid";

/** Untouched this long after coming into view, Maya pays by herself (for visitors who only scroll). */
const AUTOPAY_MS = 4500;
const PAYING_MS = 1000;

export interface ShortDue {
  name: string;
  dateLabel: string;
  amountCents: number;
  readyBeforeCents: number;
  readyAfterCents: number;
}

/**
 * "Money comes back": Maya left $72 in Loop Audio's cart; NeverShort's reminder pops up on her laptop. Tap "Pay"
 * (or wait) and she pays: notes fly across, the amount that actually arrived after PayPal's fee counts up, and it fills
 * part of Thursday's gap. SIMULATED here; the live demo uses a real PayPal sandbox payment. Every amount comes from the
 * forecast engine (lib/landing).
 */
export function ComesBack({
  label,
  grossCents,
  netCents,
  feeCents,
  shortBeforeCents,
  shortAfterCents,
  due,
}: {
  label: string;
  grossCents: number;
  netCents: number;
  feeCents: number;
  shortBeforeCents: number;
  shortAfterCents: number;
  due: ShortDue;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [arrived, setArrived] = useState(0);
  const [seen, setSeen] = useState(false);
  const ref = useRef<HTMLElement>(null);

  const pay = () => setPhase((p) => (p === "idle" ? "paying" : p));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setSeen(true);
          timer = window.setTimeout(() => setPhase((p) => (p === "idle" ? "paying" : p)), AUTOPAY_MS);
        } else window.clearTimeout(timer);
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (phase !== "paying") return;
    const t = window.setTimeout(() => setPhase("paid"), PAYING_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  // The arrived amount counts up once the notes have landed.
  useEffect(() => {
    if (phase !== "paid") return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start - 800) / 900);
      setArrived(t <= 0 ? 0 : Math.round(netCents * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase, netCents]);

  const paid = phase === "paid";
  const ready = paid ? due.readyAfterCents : due.readyBeforeCents;
  const shortBy = paid ? shortAfterCents : shortBeforeCents;
  const pct = (c: number) => `${(100 * c) / due.amountCents}%`;
  // The gap counts down as the money arrives, in step with the +$ amount.
  const shortShown = paid ? shortBeforeCents - Math.round(((shortBeforeCents - shortAfterCents) * arrived) / Math.max(1, netCents)) : shortBeforeCents;
  const readyShown = paid ? due.readyBeforeCents + Math.round(((due.readyAfterCents - due.readyBeforeCents) * arrived) / Math.max(1, netCents)) : due.readyBeforeCents;

  return (
    <section ref={ref} id="back" aria-labelledby="back-title" data-inview={seen ? "" : undefined} className="mx-auto w-full max-w-[1240px] px-5 py-20 lg:px-10 lg:py-20">
      {/* Laptop: words and where the money goes on the left, Maya on the right, all in one screen. Phone: one column. */}
      <div className="grid items-center gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="reveal max-w-[620px] lg:col-start-1 lg:row-start-1">
        <p className="pill">Money comes back</p>
        <h2 id="back-title" className="display mt-5 text-[2.6rem] leading-[0.98] text-ink lg:text-[3.3rem]">
          It chases the orders people didn&apos;t finish.
        </h2>
        <p className="mt-4 max-w-[54ch] text-[18px] leading-8 text-ink">
          Maya left {formatDollars(grossCents)} of headphones in her cart. NeverShort sent her a reminder with a fresh
          PayPal link. Pay it for her and watch where the money goes.
        </p>
      </div>

        {/* Maya with her coffee, the reminder popping up beside her. */}
        <div className="back-scene relative mx-auto w-full max-w-[520px] lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <div aria-hidden className="scene-sun scene-sun-small" />
          <div className={`reminder on-paper ${phase !== "idle" ? "reminder-tapped" : ""} ${paid ? "reminder-paid" : ""}`}>
            <p className="text-[11px] font-semibold tracking-[0.14em] text-ink-muted uppercase">Loop Audio · to Maya · now</p>
            <p className="mt-1.5 text-[16px] leading-6 font-semibold text-ink">Your order #1258 is waiting</p>
            <p className="mt-1 text-[14px] leading-5 text-ink">Your headphones and ear cushions are still in your cart.</p>
            {paid ? (
              <p className="paid-tag mt-3 rounded-[10px] bg-green px-3 py-2.5 text-[15px] font-semibold text-ink">
                Paid {formatCents(grossCents)}. Thank you.
              </p>
            ) : (
              <div className="relative mt-3">
                {phase === "idle" ? (
                  <span aria-hidden className="tap-tag">
                    Tap to pay
                  </span>
                ) : null}
                <button type="button" onClick={pay} className="w-full rounded-[10px] bg-ink px-4 py-3 text-[15px] font-semibold text-white">
                  {phase === "paying" ? "Paying with PayPal…" : `Pay ${formatCents(grossCents)} with PayPal`}
                </button>
              </div>
            )}
            <p className="mt-2 text-center text-[11px] text-ink-muted">{label}</p>
          </div>
          <div className="scene-window pop-figure relative">
            <Maya mood={paid ? "happy" : "reading"} className="relative z-[1] mx-auto w-[74%] lg:mx-0 lg:w-[64%]" />
          </div>
          <div aria-hidden className="counter" />
          {paid ? [0, 1, 2].map((i) => <span key={i} aria-hidden className="fly-note" style={{ animationDelay: `${i * 150}ms` }} />) : null}
        </div>

        {/* Where the money goes. */}
        <div aria-live="polite" className="back-side lg:col-start-1 lg:row-start-2 lg:self-start">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <p className={`display text-[4rem] leading-none text-ink tabular lg:text-[4.4rem] ${arrived === netCents && paid ? "amount-land" : ""}`}>+{formatDollars(arrived)}</p>
            <p className="text-[17px] text-ink-muted">arrived in Loop Audio&apos;s PayPal</p>
          </div>
          <p className={`mt-3 text-[16px] leading-7 text-ink transition-opacity duration-500 ${paid ? "opacity-100" : "opacity-0"}`}>
            {formatCents(grossCents)} paid, minus {formatCents(feeCents)} PayPal fee. NeverShort counts what arrives, never the
            price on the order.
          </p>

          <div className={`gap-card mt-6 ${paid ? "gap-hit" : ""}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <p className="text-[17px] font-semibold text-white">{due.name}</p>
              <p className="text-[14px] text-white/65">{due.dateLabel}</p>
            </div>
            <div className="gap-bar mt-4" role="img" aria-label={`${formatDollars(ready)} of ${formatDollars(due.amountCents)} ready`}>
              <span className="gap-ready" style={{ width: pct(due.readyBeforeCents) }} />
              <span className="gap-new" style={{ left: pct(due.readyBeforeCents), width: paid ? pct(due.readyAfterCents - due.readyBeforeCents) : "0%" }} />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[15px] text-white/85 tabular">
                {formatDollars(readyShown)} of {formatDollars(due.amountCents)} ready
              </p>
              <p key={String(paid)} className="gap-short flex items-center gap-2 text-[17px] font-semibold text-white">
                <span aria-hidden className={`size-3 rounded-[3px] ${shortBy > 0 ? "bg-red" : "bg-green"}`} />
                {shortBy > 0 ? `${formatShortfall(shortShown)} short` : "Covered"}
                {paid ? <s className="font-normal text-white/55">was {formatShortfall(shortBeforeCents)}</s> : null}
              </p>
            </div>
          </div>
          {paid ? (
            <button
              type="button"
              onClick={() => {
                setPhase("idle");
                setArrived(0);
              }}
              className="mt-5 text-[15px] text-ink-muted underline decoration-ink/30 underline-offset-4 hover:text-ink"
            >
              Play it again
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
