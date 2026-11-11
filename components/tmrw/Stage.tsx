"use client";

import { useEffect, useRef } from "react";
import { AppWindow, Dock } from "./Chrome";
import { Login, Setup } from "./Onboarding";
import { ASSET, Seat, Station, Train } from "./Scenes";
import { POSITIONS, useStage } from "./useStage";
import { FRAME_H, FRAME_W, useFrameScale } from "./useFrameScale";
import { useScrollSteps } from "./useScrollSteps";

/** The next scene's painting, fetched while the current one plays (SPEC section 9). */
const PRELOAD: Record<string, string[]> = {
  login: [`${ASSET}/scenes/train-doors-open.webp`, `${ASSET}/layers/train-band-doors-closed.webp`, `${ASSET}/layers/door-left.webp`, `${ASSET}/layers/door-right.webp`],
  station: [`${ASSET}/layers/seat-window-glass-cut.webp`, `${ASSET}/layers/scenery-sky-tile.webp`, `${ASSET}/layers/scenery-ground-tile.webp`],
};

/**
 * The tmrw laptop intro: one 1440 × 900 frame, driven by scroll (design/tmrw-handoff/SPEC.md).
 * login → setup → station → train arrival → seats (Calendar, Ventures, Insights), with the dock inside the train.
 */
export function Stage({ requests = 3 }: { requests?: number }) {
  const s = useStage();
  const { state, position } = s;
  const scale = useFrameScale();
  const viewport = useRef<HTMLDivElement>(null);
  const pre = state.stage === "login" || state.stage === "setup";
  const inCar = state.stage === "car";
  useScrollSteps(viewport, s.nudge, !pre);

  useEffect(() => {
    for (const src of PRELOAD[state.stage] ?? []) {
      const img = new Image();
      img.src = src;
    }
  }, [state.stage]);

  return (
    <div ref={viewport} className="tmrw-viewport">
      <div
        className="tmrw-frame"
        style={{ width: FRAME_W, height: FRAME_H, transform: `translate(-50%, -50%) scale(${scale})` }}
        data-stage={state.stage}
        data-position={position}
        data-arrival={state.arrival}
      >
        <Station stage={state.stage} />
        <Train stage={state.stage} arrival={state.arrival} />
        <Seat stage={state.stage} seat={state.seat} onOpen={s.openWindow} />

        {state.stage === "login" && <Login onContinue={s.toSetup} />}
        {state.stage === "setup" && <Setup step={state.step} onNext={s.nextStep} onBack={s.backStep} />}

        {(state.stage === "station" || state.stage === "train") && !state.window && (
          <div
            aria-hidden="true"
            style={{ position: "absolute", left: 0, right: 0, bottom: 34, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: "#fff", textShadow: "0 1px 10px rgba(0,0,0,.45)" }}
          >
            <span style={{ fontSize: 14, fontWeight: 600 }}>Scroll to continue</span>
            <svg className="tmrw-icon tmrw-hint" width="22" height="22" viewBox="0 0 24 24">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        )}

        {inCar && <Dock onOpen={s.openWindow} requests={requests} />}

        {!pre && (
          <nav aria-label="Move through tmrw" style={{ position: "absolute", zIndex: 18, right: 22, bottom: 100, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <button className="tmrw-btn tmrw-glass" onClick={s.up} aria-label="Scroll up" disabled={position === 0} style={navButton}>
              <svg className="tmrw-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 15l-6-6-6 6" />
              </svg>
            </button>
            {Array.from({ length: POSITIONS }, (_, i) => (
              <span
                key={i}
                aria-hidden="true"
                style={{ width: 6, height: i === position ? 18 : 6, borderRadius: 3, background: i === position ? "#ffffff" : "rgba(255,255,255,.5)", transition: "height .3s" }}
              />
            ))}
            <button className="tmrw-btn tmrw-glass" onClick={s.down} aria-label="Scroll down" disabled={position === POSITIONS - 1} style={navButton}>
              <svg className="tmrw-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </nav>
        )}

        <AppWindow which={state.window} focus={state.focus} onToggleFocus={s.toggleFocus} onClose={s.closeWindow} />
      </div>
    </div>
  );
}

const navButton = { width: 40, height: 40, borderRadius: "50%", display: "grid", placeItems: "center", color: "#1D1D1F" } as const;
