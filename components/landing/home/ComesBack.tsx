"use client";

import { useEffect, useRef, useState } from "react";
import type { StoryRecovery } from "@/lib/landing";
import { formatCents, formatDollars, formatShortfall } from "@/lib/shared/money";
import { Maya } from "../Maya";
import { DayWord } from "./FixPicker";

type Phase = "idle" | "paying" | "paid";

/** Untouched this long after coming into view, the customer pays by themselves (for visitors who only scroll). */
const AUTOPAY_MS = 5000;
const PAYING_MS = 1000;

/**
 * "Money comes back": Ivory & Vow owes the shop for a wedding cake; tmrw's reminder pops up beside their planner with a
 * fresh PayPal link. Tap Pay (or wait), she smiles, notes fly to the short day, the amount that actually arrived after PayPal's fee counts up, and the
 * day turns covered. SIMULATED here; in the app it's a real PayPal sandbox payment. Every amount comes from lib/landing.
 */
export function ComesBack({ r, shop }: { r: StoryRecovery; shop: string }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [arrived, setArrived] = useState(0);
  const [fly, setFly] = useState<{ x: number; y: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const target = useRef<HTMLDivElement>(null);
  const touched = useRef(false);

  const pay = () => {
    const b = button.current?.getBoundingClientRect();
    const t = target.current?.getBoundingClientRect();
    const c = box.current?.getBoundingClientRect();
    if (b && t && c) {
      // Notes fly from the Pay button to the short day's card.
      setFly({ x: b.left - c.left + b.width / 2 - 17, y: b.top - c.top });
      box.current?.style.setProperty("--fx", `${t.left + t.width / 2 - (b.left + b.width / 2)}px`);
      box.current?.style.setProperty("--fy", `${t.top + 10 - b.top}px`);
    }
    setPhase((p) => (p === "idle" ? "paying" : p));
  };

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let timer = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          if (!touched.current) button.current?.click();
        }, AUTOPAY_MS);
      },
      { threshold: 0.5 },
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
    const instant = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = instant ? 1 : Math.min(1, (now - start - 700) / 900);
      setArrived(t <= 0 ? 0 : t >= 1 ? r.netCents : Math.round(r.netCents * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase, r.netCents]);

  const paid = phase === "paid";
  const due = r.due;
  const pct = (c: number) => (due ? `${(100 * c) / due.amountCents}%` : "0%");
  const done = paid && arrived === r.netCents;

  return (
    <div ref={box} className="relative grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
      {/* Where the money goes. */}
      <div aria-live="polite" className="order-2 lg:order-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="h-display h-num text-[3.4rem] tracking-[-0.04em] lg:text-[4.2rem]">+{formatCents(arrived)}</p>
          <p className="text-[16px] text-[var(--h-muted)]">arrived in PayPal</p>
        </div>
        <p className={`mt-2 text-[15.5px] leading-6 text-[var(--h-strong)] transition-opacity duration-500 ${paid ? "opacity-100" : "opacity-0"}`}>
          {formatCents(r.grossCents)} paid, minus {formatCents(r.feeCents)} PayPal fee. tmrw counts what arrives, never the price on the order.
        </p>

        {due ? (
          <div ref={target} className="h-card mt-6 p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <p className="text-[17px] font-semibold">{due.name}</p>
              <p className="text-[14px] text-[var(--h-muted)]">{due.dateLabel}</p>
            </div>
            <div className="h-bar mt-4" role="img" aria-label={`${formatDollars(paid ? due.readyAfterCents : due.readyBeforeCents)} of ${formatDollars(due.amountCents)} ready`}>
              <span className="h-bar-ready" style={{ width: pct(due.readyBeforeCents) }} />
              <span className="h-bar-new" style={{ left: pct(due.readyBeforeCents), width: paid ? pct(due.readyAfterCents - due.readyBeforeCents) : "0%" }} />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="h-num text-[15px] text-[var(--h-strong)]">
                {formatDollars(done ? due.readyAfterCents : due.readyBeforeCents)} of {formatDollars(due.amountCents)} ready
              </p>
              <p key={String(done)} className={`flex items-center gap-2 text-[16px] font-semibold ${done ? "h-stamp" : ""}`}>
                {done ? <DayWord state={r.shortAfterCents > 0 ? "short" : "covered"} shortByCents={r.shortAfterCents} /> : <DayWord state="short" shortByCents={r.shortBeforeCents} />}
                {done ? <s className="font-normal text-[var(--h-muted)]">was {formatShortfall(r.shortBeforeCents)} short</s> : null}
              </p>
            </div>
          </div>
        ) : null}

        {paid ? (
          <button
            type="button"
            onClick={() => {
              touched.current = true;
              setPhase("idle");
              setArrived(0);
              setFly(null);
            }}
            className="mt-5 text-[15px] font-medium text-[var(--h-blue)] hover:underline"
          >
            Play it again
          </button>
        ) : null}
      </div>

      {/* The customer at her counter with a coffee; the reminder pops up beside her. */}
      <div className="relative order-1 mx-auto w-full max-w-[560px] lg:order-2">
        <div className="h-message relative z-[3] p-5 sm:p-6 lg:absolute lg:top-0 lg:right-0 lg:w-[300px] lg:rotate-[1.5deg]" data-paid={paid ? "" : undefined}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[13px] font-semibold text-[var(--h-muted)]">
              To {r.customer}
            </p>
            <span className="h-tag h-tag-sim">Simulated</span>
          </div>
          <p className="mt-3 text-[18px] leading-7 font-semibold">Your {r.what} is still open</p>
          <p className="mt-1.5 text-[15.5px] leading-6 text-[var(--h-strong)]">
            Hi, a quick note: the {formatDollars(r.grossCents)} for your {r.what}
            {r.dueOnLabel ? ` is due ${r.dueOnLabel}` : " is still open"}. You can pay here with PayPal whenever it suits.
          </p>
          <p className="mt-1.5 text-[15.5px] text-[var(--h-strong)]">Penny, {shop}</p>
          <div className="mt-4">
            {paid ? (
              <p className="h-paid flex items-center gap-2 rounded-[14px] bg-[#e8f7ec] px-4 py-3 text-[15px] font-semibold text-[var(--h-in)]">
                <span aria-hidden className="h-dot h-dot-covered" />
                Paid {formatCents(r.grossCents)}. Thank you.
              </p>
            ) : (
              <button
                ref={button}
                type="button"
                onClick={(e) => {
                  if (e.isTrusted) touched.current = true;
                  pay();
                }}
                disabled={phase === "paying"}
                className="h-btn h-paypal-btn w-full"
              >
                {phase === "paying" ? "Paying with PayPal…" : `Pay ${formatCents(r.grossCents)} with PayPal`}
              </button>
            )}
          </div>
          <p className="mt-3 text-[13px] leading-5 text-[var(--h-muted)]">
            Drafted for you. It goes only after Penny taps OK, only because {r.customer} agreed to hear from the shop, and never twice in 48 hours.
          </p>
        </div>
        <div className="relative mt-4 lg:mt-0 lg:pt-24">
          <div aria-hidden className="scene-sun scene-sun-small" />
          <div className="scene-window">
            <Maya mood={paid ? "happy" : "reading"} who={`The wedding planner from ${r.customer}`} className="relative z-[1] mx-auto w-[52%] lg:mx-0 lg:w-[50%]" />
          </div>
          <div aria-hidden className="counter" />
        </div>
      </div>

      {fly && phase !== "idle"
        ? [0, 1, 2].map((i) => <span key={`${i}-${fly.x}`} aria-hidden className="h-fly" style={{ left: fly.x, top: fly.y, animationDelay: `${i * 140}ms` }} />)
        : null}
    </div>
  );
}
