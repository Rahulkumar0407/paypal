"use client";

import { useSyncExternalStore } from "react";

/** Wide enough for the AG Grid tables and the AG Chart (AGENTS.md section 8: heavy libraries stay off the phone). */
const LAPTOP = "(min-width: 768px)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(LAPTOP);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * True on a laptop-sized screen. False on the server and on phones, so AG Grid and AG Charts are only downloaded
 * (dynamic import) when this turns true.
 */
export function useLaptop(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(LAPTOP).matches,
    () => false,
  );
}
