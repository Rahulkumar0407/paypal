"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

export const TABS = [
  { id: "problem", label: "Problem" },
  { id: "what", label: "What it does" },
  { id: "features", label: "Features" },
  { id: "tech", label: "Tech" },
  { id: "next", label: "Next up" },
  { id: "github", label: "GitHub" },
  { id: "try", label: "Try it now", cta: true },
] as const;

type TabId = (typeof TABS)[number]["id"];

/** A section counts as "being read" once its top passes this far down the screen. */
const READING_LINE = 0.4;

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The landing page's tabs: one dark pill, like the dock in the app. As you scroll, a white spotlight slides to the
 * section you're reading, a thin line shows how far down the page you are, and the page dims every other section
 * (`data-spot` on .home, `data-on` on the lit section). Clicking a tab glides to its section.
 */
export function HomeTabs() {
  const [active, setActive] = useState<TabId | null>(null);
  const [progress, setProgress] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const spot = useRef<HTMLSpanElement>(null);
  const tabs = useRef<Partial<Record<TabId, HTMLAnchorElement | null>>>({});

  // Which section is being read, and how far through it.
  useEffect(() => {
    const home = document.querySelector(".home");
    home?.setAttribute("data-spot", "");
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * READING_LINE;
      let current: TabId | null = null;
      for (const t of TABS) {
        const r = document.getElementById(t.id)?.getBoundingClientRect();
        if (r && r.top <= line) current = t.id;
      }
      const room = document.documentElement.scrollHeight - window.innerHeight;
      // The last section is short of the reading line at the very bottom of the page: light it anyway.
      if (window.scrollY >= room - 4) current = TABS.at(-1)!.id;
      const through = room > 0 ? Math.min(1, Math.max(0, window.scrollY / room)) : 0;
      for (const t of TABS) document.getElementById(t.id)?.toggleAttribute("data-on", t.id === current);
      setActive(current);
      setProgress(through);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      home?.removeAttribute("data-spot");
      for (const t of TABS) document.getElementById(t.id)?.removeAttribute("data-on");
    };
  }, []);

  // The spotlight slides under the active tab; on a phone the bar scrolls so the active tab stays in view.
  useLayoutEffect(() => {
    const place = () => {
      const el = active ? tabs.current[active] : null;
      const s = spot.current;
      const t = track.current;
      if (!s || !t) return;
      if (!el) {
        s.removeAttribute("data-on");
        return;
      }
      s.style.transform = `translateX(${el.offsetLeft}px)`;
      s.style.width = `${el.offsetWidth}px`;
      s.setAttribute("data-on", "");
      s.toggleAttribute("data-cta", active === "try");
      const left = el.offsetLeft - (t.clientWidth - el.offsetWidth) / 2;
      if (t.scrollWidth > t.clientWidth) t.scrollTo({ left, behavior: reducedMotion() ? "auto" : "smooth" });
    };
    place();
    const ro = new ResizeObserver(place);
    if (track.current) ro.observe(track.current);
    return () => ro.disconnect();
  }, [active]);

  const go = (id: string) => (e: React.MouseEvent) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", id === "top" ? window.location.pathname : `#${id}`);
  };

  return (
    <nav aria-label="On this page" className="h-tabs">
      <a href="#top" onClick={go("top")} className="h-tabs-home h-wordmark" aria-label="tmrw, back to the top">
        <span>tm</span>
        <span>rw</span>
      </a>
      <div ref={track} className="h-tabs-track">
        <span ref={spot} aria-hidden className="h-tabs-spot" />
        {TABS.map((t) => (
          <a
            key={t.id}
            ref={(el) => {
              tabs.current[t.id] = el;
            }}
            href={`#${t.id}`}
            onClick={go(t.id)}
            aria-current={active === t.id ? "true" : undefined}
            className={`h-tab inline-flex items-center ${"cta" in t ? "h-tab-cta" : ""}`}
          >
            {t.label}
          </a>
        ))}
      </div>
      <span aria-hidden className="h-tabs-progress">
        <span style={{ transform: `scaleX(${progress})` }} />
      </span>
    </nav>
  );
}
