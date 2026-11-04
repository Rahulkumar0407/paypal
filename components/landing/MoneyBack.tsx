"use client";

import { useEffect, useRef, useState } from "react";
import { formatCents, formatDollars, formatShortfall } from "@/lib/shared/money";
import { useWeather } from "./Weather";

type Phase = "idle" | "paying" | "paid";

const FULL = 6;
const notesFor = (ready: number, amount: number) => (ready >= amount ? FULL : Math.min(FULL - 1, Math.max(1, Math.round((FULL * ready) / amount))));

export interface ShortDue {
  name: string;
  dateLabel: string;
  amountCents: number;
  readyBeforeCents: number;
  readyAfterCents: number;
}

/**
 * Money comes back: the reminder NeverShort sent for an abandoned $72 order, on the customer's phone, next to the till
 * slot of the payment that's short. Tap "Pay with PayPal" (or wait: it plays by itself) and the notes fly from the phone
 * into the slot; the stack grows by what actually arrived after PayPal's fee. SIMULATED here; the live demo uses a
 * real PayPal sandbox payment. Every amount comes from the forecast engine (lib/landing).
 */
export function MoneyBack({
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
  const report = useWeather();

  const pay = () => setPhase((p) => (p === "idle" ? "paying" : p));

  // Plays by itself a few seconds after the section comes into view, for visitors who only scroll.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          report("clear");
          setSeen(true);
          timer = window.setTimeout(() => setPhase((p) => (p === "idle" ? "paying" : p)), 4000);
        } else window.clearTimeout(timer);
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, [report]);

  useEffect(() => {
    if (phase !== "paying") return;
    const t = window.setTimeout(() => setPhase("paid"), 900);
    return () => window.clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "paid") return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start - 700) / 900);
      setArrived(t <= 0 ? 0 : Math.round(netCents * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase, netCents]);

  const paid = phase === "paid";
  const ready = paid ? due.readyAfterCents : due.readyBeforeCents;
  const shortBy = paid ? shortAfterCents : shortBeforeCents;
  const layers = notesFor(ready, due.amountCents);
  const before = notesFor(due.readyBeforeCents, due.amountCents);

  return (
    <section
      ref={ref}
      aria-labelledby="back-title"
      data-inview={seen ? "" : undefined}
      className="back-stage relative mx-auto w-full max-w-[1240px] px-5 py-24 lg:px-10 lg:py-32"
    >
      <div className="reveal max-w-[640px]">
        <p className="text-[12px] font-semibold tracking-[0.2em] text-ink-muted uppercase">Money comes back</p>
        <h2 id="back-title" className="mt-3 font-serif text-[2.4rem] leading-[1.04] tracking-[-0.02em] text-ink lg:text-[3.2rem]">
          It chases the orders people didn&apos;t finish.
        </h2>
        <p className="mt-5 text-[18px] leading-8 text-ink">
          Maya left $72 of headphones in her cart. NeverShort sent her a reminder with a fresh PayPal link. Pay it for her
          and watch where the money goes.
        </p>
      </div>

      <div className="mt-14 grid items-center gap-12 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-20">
        <div className={`phone ${phase !== "idle" ? "phone-tapped" : ""}`}>
          <div className="phone-screen on-paper relative">
            <div aria-hidden className="phone-banner">
              <span className="phone-banner-app">NS</span>
              <span className="min-w-0">
                <span className="block text-[11px] text-ink-muted">Loop Audio · now</span>
                <span className="block truncate text-[13px] font-semibold text-ink">Your order #1258 is waiting</span>
              </span>
            </div>
            <p className="text-[11px] font-semibold tracking-[0.14em] text-ink-muted uppercase">Loop Audio · to Maya</p>
            <p className="mt-2 text-[17px] leading-6 font-semibold text-ink">Your order #1258 is waiting</p>
            <p className="mt-2 text-[14px] leading-6 text-ink">
              Hi Maya, your Loop Kids volume-safe headphones and replacement ear cushions are still in your cart. You can
              finish whenever you&apos;re ready.
            </p>
            <p className="mt-1 text-[14px] leading-6 text-ink">Thanks, Loop Audio</p>
            {paid ? (
              <div className="phone-paid mt-5 rounded-[12px] bg-green px-4 py-3">
                <p className="text-[15px] font-semibold text-ink">Paid {formatCents(grossCents)}</p>
                <p className="text-[13px] text-ink">Thank you. Your order is on its way.</p>
              </div>
            ) : (
              <div className="relative mt-12">
                {phase === "idle" ? (
                  <span aria-hidden className="tap-cue">
                    Tap to pay
                  </span>
                ) : null}
                <button type="button" onClick={pay} className="phone-pay w-full rounded-[12px] bg-brand px-4 py-3.5 text-[15px] font-semibold text-white">
                  {phase === "paying" ? "Paying with PayPal…" : `Pay ${formatCents(grossCents)} with PayPal`}
                </button>
              </div>
            )}
            <p className="mt-3 text-center text-[11px] text-ink-muted">{label}</p>
          </div>
          {paid ? [0, 1, 2].map((i) => <span key={i} aria-hidden className="phone-note" style={{ animationDelay: `${i * 160}ms` }} />) : null}
        </div>

        <div aria-live="polite" className="back-side">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <p className="font-serif text-[3.4rem] leading-none tracking-[-0.02em] text-ink tabular lg:text-[4.4rem]">+{formatDollars(arrived)}</p>
            <p className="text-[16px] text-ink-muted">arrived in Loop Audio&apos;s PayPal</p>
          </div>
          <p className={`mt-2 text-[15px] text-ink transition-opacity duration-500 ${paid ? "opacity-100" : "opacity-0"}`}>
            {formatCents(grossCents)} paid, minus {formatCents(feeCents)} PayPal fee. NeverShort counts what arrives, never the price
            on the order.
          </p>

          <div className="till-tray back-till mt-7 max-w-[560px]">
            <div className="till-slot back-slot">
              <div className="grid items-center gap-6 sm:grid-cols-[220px_minmax(0,1fr)]">
                <div aria-hidden className="cash-stack">
                  {Array.from({ length: FULL }, (_, i) => {
                    const top = (FULL - 1 - i) * 7;
                    if (i >= layers) return <span key={i} className={`cash-ghost ${shortBy > 0 ? "cash-ghost-short" : ""}`} style={{ top, zIndex: 0 }} />;
                    const isTop = i === layers - 1;
                    const fresh = paid && i >= before;
                    return (
                      <span
                        key={`${i}-${fresh}`}
                        className={`cash-note ${isTop ? "cash-note-top" : ""} ${fresh ? "note-in" : ""}`}
                        style={{ top, zIndex: 1 + i, animationDelay: fresh ? `${900 + (i - before) * 150}ms` : undefined }}
                      >
                        {isTop ? (
                          <>
                            <span className="cash-medallion" />
                            <span className="cash-maker">NeverShort</span>
                            <span className="cash-figure">{formatDollars(ready)}</span>
                          </>
                        ) : null}
                      </span>
                    );
                  })}
                  <span className="till-clip" style={{ top: `calc(${(FULL - layers) * 7}px + (100% - ${(FULL - 1) * 7}px) * 0.34)` }} />
                </div>
                <div>
                  <p className="text-[16px] leading-6 font-semibold text-ink">{due.name}</p>
                  <p className="text-[14px] leading-5 text-ink-muted">{due.dateLabel}</p>
                  <p className="mt-3 text-[15px] leading-6 text-ink tabular">
                    {formatDollars(ready)} of {formatDollars(due.amountCents)} ready
                  </p>
                  <p key={shortBy} className="back-short mt-1 flex items-center gap-2 text-[15px] leading-6 font-semibold text-ink">
                    <span aria-hidden className={`size-2.5 rounded-[3px] ${shortBy > 0 ? "bg-red" : "bg-green"}`} />
                    {shortBy > 0 ? `${formatShortfall(shortBy)} short` : "Covered"}
                    {paid ? <s className="font-normal text-ink-muted">was {formatShortfall(shortBeforeCents)}</s> : null}
                  </p>
                </div>
              </div>
            </div>
          </div>
          {paid ? (
            <button type="button" onClick={() => { setPhase("idle"); setArrived(0); }} className="mt-5 text-[14px] text-ink-muted underline decoration-white/30 underline-offset-4 hover:text-ink">
              Play it again
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
