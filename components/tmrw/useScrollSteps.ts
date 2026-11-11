"use client";

import { useEffect, type RefObject } from "react";

/** Below this, a wheel event is noise (a resting trackpad), not a notch. */
const MIN_WHEEL_DELTA = 6;
/** A swipe has to travel this far to count. */
const MIN_SWIPE_PX = 40;

/**
 * Turns wheel notches, ↑/↓ (and Page Up/Down, Space) and vertical swipes into one-step moves. The page itself never
 * scrolls. `nudge` decides whether a move is allowed (debounce, setup, open window) and returns whether it moved.
 */
export function useScrollSteps(target: RefObject<HTMLElement | null>, nudge: (direction: 1 | -1) => boolean, enabled: boolean) {
  useEffect(() => {
    const el = target.current;
    if (!el || !enabled) return;

    const onWheel = (e: WheelEvent) => {
      // Inside an open window the wheel scrolls the window's own content.
      if (e.target instanceof Element && e.target.closest('[role="dialog"]')) return;
      const d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      e.preventDefault();
      if (Math.abs(d) < MIN_WHEEL_DELTA) return;
      nudge(d > 0 ? 1 : -1);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        nudge(1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        nudge(-1);
      }
    };
    let startY: number | null = null;
    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0]?.clientY ?? null;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const endY = e.changedTouches[0]?.clientY;
      if (startY === null || endY === undefined) return;
      const dy = startY - endY;
      startY = null;
      if (Math.abs(dy) >= MIN_SWIPE_PX) nudge(dy > 0 ? 1 : -1);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
    };
  }, [target, nudge, enabled]);
}
