"use client";

import Link from "next/link";
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
 * The landing page's header: the wordmark, the seven tabs and the demo button. As you scroll, a navy spotlight slides
 * to the tab of the section you're reading, a thin blue line shows how far down the page you are, and the page dims
 * every other section (`data-spot` on .home, `data-on` on the lit section). Clicking a tab glides to its section.
 */
export function HomeTabs() {
  const [active, setActive] = useState<TabId | null>(null);
  const [progress, setProgress] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const spot = useRef<HTMLSpanElement>(null);
  const tabs = useRef<Partial<Record<TabId, HTMLAnchorElement | null>>>({});

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
      for (const t of TABS) document.getElementById(t.id)?.toggleAttribute("data-on", t.id === current);
      setActive(current);
      setProgress(room > 0 ? Math.min(1, Math.max(0, window.scrollY / room)) : 0);
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

  // The spotlight slides under the active tab; when the tabs scroll sideways, the active one stays in view.
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
      if (t.scrollWidth > t.clientWidth) t.scrollTo({ left: el.offsetLeft - (t.clientWidth - el.offsetWidth) / 2, behavior: reducedMotion() ? "auto" : "smooth" });
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
    <header className="h-header">
      <div className="mx-auto grid max-w-[1280px] grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
        <a href="#top" onClick={go("top")} className="h-wordmark col-start-1 row-start-1 text-[28px]" aria-label="tmrw, back to the top">
          <span className="tm">tm</span>
          <span className="rw">rw</span>
        </a>
        <nav aria-label="On this page" className="col-span-3 col-start-1 row-start-2 min-w-0 lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:justify-self-center">
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
                className="h-tab"
              >
                {t.label}
              </a>
            ))}
          </div>
        </nav>
        <Link href="/demo" className="h-btn h-btn-primary h-btn-sm col-start-3 row-start-1 justify-self-end">
          Try the demo
        </Link>
      </div>
      <span aria-hidden className="h-tabs-progress">
        <span style={{ transform: `scaleX(${progress})` }} />
      </span>
    </header>
  );
}
