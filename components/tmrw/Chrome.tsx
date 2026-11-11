/* eslint-disable @next/next/no-img-element -- small pre-sized icons (SPEC section 8). */
"use client";

import { useEffect } from "react";
import { ASSET } from "./Scenes";
import type { WindowKey } from "./useStage";

/** Every window: its title, tint, header glyph and icon (the prototype's META, ICON and IMG). */
export const WINDOWS: Record<WindowKey, { title: string; tint: string; glyph: string; img: string; big: boolean }> = {
  cal: { title: "Calendar", tint: "#FF3B30", glyph: "M3 5h18v16H3zM16 3v4M8 3v4M3 10h18", img: `${ASSET}/icons/calendar.png`, big: true },
  grow: { title: "Ventures", tint: "#C08A2B", glyph: "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6", img: `${ASSET}/icons/ventures.png`, big: true },
  ins: { title: "Insights", tint: "#D7263D", glyph: "M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z", img: `${ASSET}/icons/insights.png`, big: true },
  settings: {
    title: "Settings",
    tint: "#8E8E93",
    glyph: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2",
    img: `${ASSET}/icons/settings.png`,
    big: false,
  },
  morning: {
    title: "Daily brief",
    tint: "#FF9500",
    glyph: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2",
    img: `${ASSET}/icons/brief.png`,
    big: false,
  },
  requests: {
    title: "Requests",
    tint: "#AF52DE",
    glyph: "M22 12h-6l-2 3h-4l-2-3H2M5.5 5.1L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1z",
    img: `${ASSET}/icons/requests.png`,
    big: false,
  },
  plus: { title: "tmrw Pro", tint: "#0071E3", glyph: "M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z", img: `${ASSET}/icons/pro.png`, big: false },
};

const DOCK: { key: WindowKey; name: string; badge?: number }[] = [
  { key: "settings", name: "Settings" },
  { key: "morning", name: "Daily brief" },
  { key: "requests", name: "Requests", badge: 3 },
  { key: "plus", name: "Pro" },
];

/** 4.4 The always-on dock, top centre, inside the train only. */
export function Dock({ onOpen, requests }: { onOpen: (key: WindowKey) => void; requests: number }) {
  return (
    <nav aria-label="tmrw" style={{ position: "absolute", zIndex: 20, left: 0, right: 0, top: 12, display: "flex", justifyContent: "center", gap: 10 }}>
      {DOCK.map((d) => {
        const badge = d.key === "requests" ? requests : d.badge;
        return (
          <button
            key={d.key}
            className="tmrw-btn"
            onClick={() => onOpen(d.key)}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 10,
              height: 46,
              padding: "0 18px 0 10px",
              borderRadius: 99,
              background: "rgba(22,22,24,.86)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
              boxShadow: "0 10px 30px rgba(0,0,0,.3)",
            }}
          >
            <img src={WINDOWS[d.key].img} alt="" width={30} height={30} />
            {d.name}
            {badge ? (
              <span
                aria-label={`${badge} new`}
                style={{
                  position: "absolute",
                  top: 5,
                  left: 28,
                  minWidth: 20,
                  height: 20,
                  borderRadius: 10,
                  background: "#FF3B30",
                  color: "#fff",
                  fontSize: 11.5,
                  fontWeight: 700,
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "0 0 0 2px rgba(22,22,24,.9)",
                }}
              >
                {badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}

const EASE = ".5s cubic-bezier(.2,.8,.2,1)";
const FOCUS_ICON = "M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3";
const UNFOCUS_ICON = "M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3";

/**
 * Section 6: a window over the dimmed seat. Seat windows are large (1300 × 820), dock windows smaller (820 × 560);
 * Focus fills the frame. Content is a "Coming soon" placeholder until the windows are designed.
 */
export function AppWindow({
  which,
  focus,
  frameWidth,
  onToggleFocus,
  onClose,
}: {
  which: WindowKey | null;
  focus: boolean;
  frameWidth: number;
  onToggleFocus: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!which) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [which, onClose]);

  const w = which ? WINDOWS[which] : null;
  // Seat windows 1300 × 820, dock windows 820 × 560, centred in the frame; Focus fills it.
  const size = w?.big ? { width: 1300, height: 820 } : { width: 820, height: 560 };
  const box = !w ? null : focus ? { left: 0, top: 0, width: frameWidth, height: 900, borderRadius: 0 } : { left: (frameWidth - size.width) / 2, top: (900 - size.height) / 2, ...size, borderRadius: 22 };

  return (
    <>
      <div className="tmrw-layer" aria-hidden="true" style={{ opacity: which ? 1 : 0, transition: "opacity .6s ease", pointerEvents: which ? "auto" : "none", background: "rgba(8,14,10,.42)", zIndex: 25 }} onClick={onClose} />
      {w && box && (
        <section
          key={which}
          role="dialog"
          aria-label={w.title}
          className="tmrw-panel-in"
          style={{
            position: "absolute",
            zIndex: 30,
            ...box,
            background: "#F5F5F7",
            boxShadow: "0 40px 100px rgba(0,0,0,.35)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            transition: `left ${EASE}, top ${EASE}, width ${EASE}, height ${EASE}, border-radius .5s`,
          }}
        >
          <header style={{ flex: "0 0 56px", display: "flex", alignItems: "center", gap: 12, padding: "0 16px 0 20px", background: "rgba(255,255,255,.7)", borderBottom: "1px solid rgba(0,0,0,.06)" }}>
            <span style={{ display: "grid", placeItems: "center", width: 30, height: 30, borderRadius: 9, background: w.tint, color: "#fff" }}>
              <svg className="tmrw-icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <path d={w.glyph} />
              </svg>
            </span>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, flex: 1 }}>{w.title}</h2>
            <button
              className="tmrw-btn"
              onClick={onToggleFocus}
              style={{ display: "flex", alignItems: "center", gap: 6, height: 34, padding: "0 12px", borderRadius: 99, background: "rgba(0,0,0,.05)", color: "#1D1D1F", fontSize: 13, fontWeight: 500 }}
            >
              <svg className="tmrw-icon" width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
                <path d={focus ? FOCUS_ICON : UNFOCUS_ICON} />
              </svg>
              {focus ? "Unfocus" : "Focus"}
            </button>
            <button className="tmrw-btn" onClick={onClose} aria-label="Close" style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(0,0,0,.05)", color: "#1D1D1F", display: "grid", placeItems: "center" }}>
              <svg className="tmrw-icon" width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </header>
          <div className="tmrw-fade-up" style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, textAlign: "center", padding: 30 }}>
            <img src={w.img} alt="" width={w.big ? 200 : 140} height={w.big ? 200 : 140} style={{ filter: "drop-shadow(0 14px 24px rgba(0,0,0,.18))" }} />
            <p style={{ margin: "6px 0 0", fontSize: 26, fontWeight: 700, letterSpacing: "-.02em" }}>{w.title}</p>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 500, color: "#3A3A3C" }}>Coming soon.</p>
          </div>
        </section>
      )}
    </>
  );
}
