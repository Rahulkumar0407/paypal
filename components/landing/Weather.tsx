"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

/**
 * The landing page's room. The felt mat lies on a dark desk under a lamp; the "money weather" dims the mat when the
 * story reaches the short day and clears when the visitor fixes it.
 */
type Weather = "clear" | "dim";

const SetWeather = createContext<(w: Weather) => void>(() => {});

export function LandingFelt({ children }: { children: React.ReactNode }) {
  const [weather, setWeather] = useState<Weather>("clear");
  return (
    <SetWeather.Provider value={setWeather}>
        <div data-weather={weather} className="mat landing-desk relative isolate min-h-dvh overflow-x-clip">
          <div aria-hidden className="landing-mat landing-felt">
            <div className="landing-lamp" />
            <div className="landing-stitch" />
          </div>
          {children}
        </div>
    </SetWeather.Provider>
  );
}

export function useWeather() {
  return useContext(SetWeather);
}

/**
 * Marks its element `data-inview` once it scrolls into view, so CSS can start that section's entrance (receipts
 * dropping, stamps landing). Optionally reports the weather while visible.
 */
export function InView({
  children,
  className = "",
  threshold = 0.25,
  weather,
}: {
  children: React.ReactNode;
  className?: string;
  threshold?: number;
  weather?: Weather;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  const report = useWeather();
  const onEntry = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          setSeen(true);
          if (weather) report(weather);
        }
      }
    },
    [report, weather],
  );
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(onEntry, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [onEntry, threshold]);
  return (
    <div ref={ref} data-inview={seen ? "" : undefined} className={className}>
      {children}
    </div>
  );
}
