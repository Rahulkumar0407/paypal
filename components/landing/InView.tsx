"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Marks its block `data-inview` the first time it scrolls into view, so its CSS entrance plays then (and only once).
 */
export function InView({ children, className = "", threshold = 0.25 }: { children: React.ReactNode; className?: string; threshold?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return;
        setSeen(true);
        io.disconnect();
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return (
    <div ref={ref} data-inview={seen ? "" : undefined} className={className}>
      {children}
    </div>
  );
}
