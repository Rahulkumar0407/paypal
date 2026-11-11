"use client";

import { useEffect, useRef } from "react";
import { AppWindow, Dock } from "./Chrome";
import { Login } from "./Onboarding";
import { Setup } from "./Setup";
import { ASSET, Seat, Station, Train } from "./Scenes";
import { POSITIONS, useStage } from "./useStage";
import { FRAME_H, useFrame } from "./useFrameScale";
import { useScrollSteps } from "./useScrollSteps";

/** The next scene's painting, fetched while the current one plays (SPEC section 9). */
const PRELOAD: Record<string, string[]> = {
  login: [`${ASSET}/layers/train-strip.webp`, `${ASSET}/scenes/train-open.webp`, `${ASSET}/layers/door2-left.webp`, `${ASSET}/layers/door2-right.webp`],
  station: [`${ASSET}/layers/seat-window-glass-cut.webp`, `${ASSET}/layers/panorama-tile.webp`],
};

/**
 * The tmrw laptop intro: one 1440 × 900 frame, driven by scroll (design/tmrw-handoff/SPEC.md).
 * login → setup → station → train arrival → seats (Calendar, Ventures, Insights), with the dock inside the train.
 */
export function Stage({ requests = 3 }: { requests?: number }) {
  const s = useStage();
  const { state, position } = s;
  const frame = useFrame();
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
        style={{ width: frame.width, height: FRAME_H, transform: `translate(-50%, -50%) scale(${frame.scale})`, ["--cover" as string]: frame.cover }}
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
          <div aria-hidden="true" style={{ position: "absolute", zIndex: 18, right: 26, top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            {Array.from({ length: POSITIONS }, (_, i) => (
              <span
                key={i}
                aria-hidden="true"
                style={{ width: 6, height: i === position ? 18 : 6, borderRadius: 3, background: i === position ? "#ffffff" : "rgba(255,255,255,.5)", transition: "height .3s" }}
              />
            ))}
          </div>
        )}

        <AppWindow frameWidth={frame.width} which={state.window} focus={state.focus} onToggleFocus={s.toggleFocus} onClose={s.closeWindow} />
      </div>
    </div>
  );
}
