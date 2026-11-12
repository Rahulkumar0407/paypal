"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { StoryRecovery } from "@/lib/landing";
import { formatCents, formatDollars, formatShortfall } from "@/lib/shared/money";
import { DayWord } from "./FixPicker";

type Phase = "idle" | "paying" | "paid";

/** Untouched this long after coming into view, the customer pays by themselves (for visitors who only scroll). */
const AUTOPAY_MS = 5000;
const PAYING_MS = 1300;

function Coin({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className="drop-shadow-lg">
      <circle cx="16" cy="16" r="14" fill="#F59E0B" stroke="#D97706" strokeWidth="2" />
      <circle cx="16" cy="16" r="10" stroke="#FDE68A" strokeWidth="1.5" strokeDasharray="3 2" />
      <path d="M16 9v14M12 13.5c0-1.5 1.8-2.5 4-2.5s4 1 4 2.5-1.8 2-4 2.5-4 1-4 2.5 1.8 2.5 4 2.5 4-1 4-2.5" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * "Bring lost payments back", in v2's scene: the customer on her phone, the shopkeeper with open hands. tmrw's reminder
 * to Ivory & Vow carries a fresh PayPal link; tap Pay (or wait) and v2's coins arc across, the amount that actually
 * arrived after PayPal's fee counts up, and the short day's bar fills to covered. SIMULATED here; in the app it's a
 * real PayPal sandbox payment. Every amount comes from lib/landing.
 */
export function ComesBack({ r, shop }: { r: StoryRecovery; shop: string }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [arrived, setArrived] = useState(0);
  const [round, setRound] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const touched = useRef(false);

  const pay = () => {
    setRound((n) => n + 1);
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
      { threshold: 0.45 },
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

  // The arrived amount counts up once the coins have landed.
  useEffect(() => {
    if (phase !== "paid") return;
    const instant = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = instant ? 1 : Math.min(1, (now - start - 200) / 900);
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
    <div ref={box}>
      {/* v2's scene: coins arc from the customer's phone to the shopkeeper's hands. */}
      <div className="h-art relative mx-auto max-w-5xl">
        <div className="h-parallax">
          <Image src="/landing/scene_recovery_custom.jpg" alt="A customer pays on her phone and coins fly into the shopkeeper's open hands" width={1376} height={768} unoptimized className="h-auto w-full" />
        </div>
        {phase === "paying" ? (
          <div key={round} aria-hidden className="pointer-events-none absolute top-[46%] left-[24%] z-10">
            <div className="relative">
              <div className="animate-coin-1 absolute">
                <Coin size={32} />
              </div>
              <div className="animate-coin-2 absolute">
                <Coin size={28} />
              </div>
              <div className="animate-coin-3 absolute">
                <Coin size={32} />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mx-auto mt-8 grid max-w-5xl items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
        {/* The reminder, as the customer sees it. */}
        <div className="h-message p-5 sm:p-6" data-paid={paid ? "" : undefined}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[13px] font-bold text-[var(--h-muted)]">To {r.customer}</p>
            <span className="h-tag">Simulated</span>
          </div>
          <p className="mt-3 text-[18px] leading-7 font-extrabold">Your {r.what} is still open</p>
          <p className="mt-1.5 text-[15.5px] leading-6 text-[var(--h-strong)]">
            Hi, a quick note: the {formatDollars(r.grossCents)} for your {r.what}
            {r.dueOnLabel ? ` is due ${r.dueOnLabel}` : " is still open"}. You can pay here with PayPal whenever it suits.
          </p>
          <p className="mt-1.5 text-[15.5px] text-[var(--h-strong)]">Penny, {shop}</p>
          <div className="mt-4">
            {paid ? (
              <p className="h-paid flex items-center gap-2 rounded-[14px] bg-[#e8f7ec] px-4 py-3 text-[15px] font-bold text-[var(--h-in)]">
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
            Drafted for you. Sent only with Penny&apos;s OK and the customer&apos;s consent.
          </p>
        </div>

        {/* Where the money goes. */}
        <div aria-live="polite">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="h-display h-num text-[3.2rem] lg:text-[4rem]">+{formatCents(arrived)}</p>
            <p className="text-[16px] font-medium text-[var(--h-muted)]">arrived in PayPal</p>
          </div>
          <p className={`mt-2 text-[15.5px] leading-6 text-[var(--h-strong)] transition-opacity duration-500 ${paid ? "opacity-100" : "opacity-0"}`}>
            {formatCents(r.grossCents)} paid, minus {formatCents(r.feeCents)} PayPal fee. tmrw counts what arrives.
          </p>

          {due ? (
            <div className="h-card mt-6 p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                <p className="text-[17px] font-bold">{due.name}</p>
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
                <p key={String(done)} className={`flex flex-wrap items-center gap-2 text-[16px] font-bold ${done ? "h-stamp" : ""}`}>
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
              }}
              className="mt-5 text-[15px] font-bold text-[var(--h-blue)] hover:underline"
            >
              Play it again
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
