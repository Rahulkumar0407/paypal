"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { DayState } from "@/types";
import { formatDollars } from "@/lib/shared/money";
import { MiniTicket } from "../MiniTicket";

export interface BoardDay {
  date: string;
  /** "Today", "Fri 6". */
  label: string;
  closingCents: number;
  state: DayState;
  shortByCents: number;
}

export interface DroppedBill {
  kind: string;
  name: string;
  amountCents: number;
}

/** Marks itself seen the first time this much of it is on screen. */
function useSeen<T extends HTMLElement>(threshold: number) {
  const [seen, setSeen] = useState(false);
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return;
        io.disconnect();
        setSeen(true);
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, seen] as const;
}

/**
 * The problem, acted out in v2's scene: the shopkeeper at her desk; when it comes into view the two bills due on the
 * short day drop onto it. Amounts from the real forecast.
 */
export function ProblemScene({ bills, dueLabel }: { bills: DroppedBill[]; dueLabel: string }) {
  const [ref, seen] = useSeen<HTMLDivElement>(0.4);
  const spots = [
    { top: "50%", left: "44%", cls: "animate-bill-1" },
    { top: "60%", left: "63%", cls: "animate-bill-2" },
  ];
  return (
    <div ref={ref} className="h-art">
      <div className="h-parallax relative">
      <Image src="/landing/scene_bills_custom.jpg" alt="The shopkeeper at her desk, worried, as the bills pile up" width={1376} height={768} unoptimized className="h-auto w-full" />
      {bills.slice(0, 2).map((b, i) => (
        <div key={b.name} className={`h-bill ${seen ? spots[i]!.cls : ""}`} style={{ top: spots[i]!.top, left: spots[i]!.left }}>
          <p className="hidden items-center justify-between gap-2 text-[10px] font-bold text-[var(--h-muted)] uppercase sm:flex">
            <span>{b.kind}</span>
            <span className="text-[var(--h-out)]">{dueLabel}</span>
          </p>
          <p className="text-[11px] leading-tight font-black sm:mt-0.5 sm:text-[12.5px]">{b.name}</p>
          <p className="mt-0.5 text-[12px] font-extrabold text-[var(--h-out)] sm:text-[14px]">−{formatDollars(b.amountCents)}</p>
        </div>
      ))}
      </div>
    </div>
  );
}

/** The next 14 days dealt onto the till board like cards; the short day lands last and its SHORT stamp thumps on. */
export function DealtDays({ days, shortIndex, headline }: { days: BoardDay[]; shortIndex: number; headline: string }) {
  const [ref, dealt] = useSeen<HTMLDivElement>(0.3);
  return (
    <div ref={ref} className="till-board">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="text-[17px] leading-snug font-bold text-white sm:text-[19px]">{headline}</p>
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
  );
}
