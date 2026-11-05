"use client";

import { useEffect, useRef, useState } from "react";
import { formatDollars, formatShortfall } from "@/lib/shared/money";

/**
 * An amount that counts up from $0 when it comes into view, so the visitor watches the number being worked out. The
 * server renders the final amount (readable with no JavaScript); reduced motion keeps it as it is.
 */
export function CountUp({ cents, delayMs = 0, durationMs = 900, kind = "dollars" }: { cents: number; delayMs?: number; durationMs?: number; kind?: "dollars" | "shortfall" }) {
  const [shown, setShown] = useState(cents);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = requestAnimationFrame(() => setShown(0));
    let timer = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return;
        io.disconnect();
        timer = window.setTimeout(() => {
          const start = performance.now();
          const tick = (now: number) => {
            const t = Math.min(1, (now - start) / durationMs);
            setShown(Math.round(cents * (1 - Math.pow(1 - t, 3))));
            if (t < 1) frame = requestAnimationFrame(tick);
          };
          frame = requestAnimationFrame(tick);
        }, delayMs);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [cents, delayMs, durationMs]);
  return (
    <span ref={ref} className="tabular">
      {kind === "shortfall" ? formatShortfall(shown) : formatDollars(shown)}
    </span>
  );
}
