"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { AppWindow, Dock } from "./Chrome";
import { Login } from "./Onboarding";
import { Setup } from "./Setup";
import { art, Seat, Station, Train } from "./Scenes";
import { POSITIONS, useStage } from "./useStage";
import { FRAME_H, useFrame } from "./useFrameScale";
import { useScrollSteps } from "./useScrollSteps";

/** The next scene's painting, fetched while the current one plays (SPEC section 9). */
const PRELOAD: Record<string, string[]> = {
  login: ["layers/train-strip.webp", "scenes/train-open.webp", "layers/door2-left.webp", "layers/door2-right.webp"],
  station: ["layers/seat-window-glass-cut.webp", "layers/panorama-tile.webp"],
};
const NIGHT_KEY = "tmrw:night";

/** Day or night scenery, remembered in this browser (a convenience; nothing else depends on it). */
let nightInMemory = false;
const NIGHT_EVENT = "tmrw:night-change";
function readNight(): boolean {
  try {
    const stored = window.localStorage.getItem(NIGHT_KEY);
    return stored === null ? nightInMemory : stored === "1";
  } catch {
    return nightInMemory;
  }
}
function subscribeNight(onChange: () => void) {
  window.addEventListener(NIGHT_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(NIGHT_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
function useNight(): [boolean, (night: boolean) => void] {
  const night = useSyncExternalStore(subscribeNight, readNight, () => false);
  const set = (value: boolean) => {
    nightInMemory = value;
    try {
      window.localStorage.setItem(NIGHT_KEY, value ? "1" : "0");
    } catch {
      // Storage blocked: the choice lasts for this visit.
    }
    window.dispatchEvent(new Event(NIGHT_EVENT));
  };
  return [night, set];
}

const SUN = "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4";
const MOON = "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z";

/**
 * The tmrw laptop intro: one 1440 × 900 frame, driven by scroll (design/tmrw-handoff/SPEC.md).
 * login → setup → station → train arrival → seats (Calendar, Ventures, Insights), with the dock inside the train.
 */
export function Stage({ requests = 3 }: { requests?: number }) {
  const s = useStage();
  const { state, position } = s;
  const frame = useFrame();
  const [night, setNight] = useNight();
  const viewport = useRef<HTMLDivElement>(null);
  const pre = state.stage === "login" || state.stage === "setup";
  const inCar = state.stage === "car";
  useScrollSteps(viewport, s.nudge, !pre);

  useEffect(() => {
    for (const path of PRELOAD[state.stage] ?? []) {
      const img = new Image();
      img.src = art(path, night);
    }
  }, [state.stage, night]);

  return (
    <div ref={viewport} className="tmrw-viewport">
      <div
        className="tmrw-frame"
        style={{ width: frame.width, height: FRAME_H, transform: `translate(-50%, -50%) scale(${frame.scale})`, ["--cover" as string]: frame.cover }}
        data-stage={state.stage}
        data-position={position}
        data-arrival={state.arrival}
      >
        <Station stage={state.stage} night={night} />
        <Train stage={state.stage} arrival={state.arrival} night={night} />
        <Seat stage={state.stage} seat={state.seat} night={night} onOpen={s.openWindow} />

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

        {/* Day / night: top right, on every screen. */}
        <div
          role="group"
          aria-label="Scenery"
          style={{
            position: "absolute",
            zIndex: 22,
            right: 20,
            top: 16,
            display: "flex",
            padding: 3,
            borderRadius: 99,
            background: "rgba(22,22,24,.72)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            boxShadow: "0 10px 30px rgba(0,0,0,.25)",
          }}
        >
          {([false, true] as const).map((isNight) => (
            <button
              key={String(isNight)}
              className="tmrw-btn"
              aria-pressed={night === isNight}
              onClick={() => setNight(isNight)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                height: 34,
                padding: "0 14px 0 11px",
                borderRadius: 99,
                fontSize: 13.5,
                fontWeight: 600,
                color: night === isNight ? "#1D1D1F" : "rgba(255,255,255,.85)",
                background: night === isNight ? "#ffffff" : "transparent",
                transition: "background .25s, color .25s",
              }}
            >
              <svg className="tmrw-icon" width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
                <path d={isNight ? MOON : SUN} />
              </svg>
              {isNight ? "Night" : "Day"}
            </button>
          ))}
        </div>

        <AppWindow frameWidth={frame.width} which={state.window} focus={state.focus} onToggleFocus={s.toggleFocus} onClose={s.closeWindow} />
      </div>
    </div>
  );
}
