"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The laptop intro flow's state machine (design/tmrw-handoff/SPEC.md section 2).
 *
 *   login → setup (9 steps) → station → train → seat 0 (Calendar) → seat 1 (Ventures) → seat 2 (Insights)
 *
 * After setup, one scroll "notch" (or arrow key, swipe, or the nav arrows) moves one position along FLOW.
 * Scrolling down from the station starts the train's arrival timeline; going back up to the train shows the doors open.
 */

export type StageName = "login" | "setup" | "station" | "train" | "car";
export type Arrival = "start" | "moving" | "slowing" | "settle" | "stopped" | "open";
export type WindowKey = "cal" | "grow" | "ins" | "settings" | "morning" | "requests" | "plus";

/** The five scroll positions: station, train, and the three seats. */
export const POSITIONS = 5;
export const SETUP_STEPS = 9;
/** One step per wheel notch at most this often (SPEC section 2). */
export const STEP_DEBOUNCE_MS = 1100;
/** The train's arrival, from the moment you scroll down from the station (SPEC section 4.2). */
export const ARRIVAL_TIMELINE: readonly (readonly [number, Arrival])[] = [
  [60, "moving"],
  [2100, "slowing"],
  [3300, "settle"],
  [4700, "stopped"],
  [5200, "open"],
];

export interface StageState {
  stage: StageName;
  /** Setup step, 1 to 9. */
  step: number;
  /** Seat 0 Calendar, 1 Ventures, 2 Insights. */
  seat: number;
  arrival: Arrival;
  window: WindowKey | null;
  focus: boolean;
}

const INITIAL: StageState = { stage: "login", step: 1, seat: 0, arrival: "open", window: null, focus: false };

/** Where along the scroll flow we are: 0 station, 1 train, 2-4 seats. -1 before setup is done. */
export function positionOf(s: Pick<StageState, "stage" | "seat">): number {
  if (s.stage === "station") return 0;
  if (s.stage === "train") return 1;
  if (s.stage === "car") return 2 + s.seat;
  return -1;
}

export function useStage(initial: Partial<StageState> = {}) {
  const [state, setState] = useState<StageState>({ ...INITIAL, ...initial });
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const lastStepAt = useRef(0);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const goTo = useCallback((target: number) => {
    const s = stateRef.current;
    const from = positionOf(s);
    if (from < 0) return;
    const i = Math.max(0, Math.min(POSITIONS - 1, target));
    if (i === from) return;
    clearTimers();
    if (i === 1 && s.stage === "station") {
      // The train rolls in, stops, and the doors open.
      setState((p) => ({ ...p, stage: "train", window: null, arrival: "start" }));
      for (const [ms, arrival] of ARRIVAL_TIMELINE) timers.current.push(setTimeout(() => setState((p) => ({ ...p, arrival })), ms));
    } else if (i === 0) setState((p) => ({ ...p, stage: "station", window: null, arrival: "open" }));
    else if (i === 1) setState((p) => ({ ...p, stage: "train", window: null, arrival: "open" }));
    else setState((p) => ({ ...p, stage: "car", seat: i - 2, window: null, arrival: "open" }));
  }, []);

  /** One step forward (+1) or back (-1), at most once per STEP_DEBOUNCE_MS. Ignored before setup ends or with a window open. */
  const nudge = useCallback(
    (direction: 1 | -1, now = Date.now()) => {
      const s = stateRef.current;
      if (positionOf(s) < 0 || s.window) return false;
      if (now - lastStepAt.current < STEP_DEBOUNCE_MS) return false;
      lastStepAt.current = now;
      goTo(positionOf(s) + direction);
      return true;
    },
    [goTo],
  );

  const actions = {
    goTo,
    nudge,
    up: () => goTo(positionOf(stateRef.current) - 1),
    down: () => goTo(positionOf(stateRef.current) + 1),
    toSetup: () => setState((p) => ({ ...p, stage: "setup", step: 1 })),
    nextStep: () =>
      setState((p) => (p.step < SETUP_STEPS ? { ...p, step: p.step + 1 } : { ...p, stage: "station", arrival: "open" })),
    backStep: () => setState((p) => (p.step > 1 ? { ...p, step: p.step - 1 } : { ...p, stage: "login" })),
    openWindow: (window: WindowKey) => setState((p) => ({ ...p, window })),
    closeWindow: () => setState((p) => ({ ...p, window: null, focus: false })),
    toggleFocus: () => setState((p) => ({ ...p, focus: !p.focus })),
  };

  return { state, position: positionOf(state), ...actions };
}
