"use client";

import { useEffect, useState } from "react";

export const FRAME_W = 1440;
export const FRAME_H = 900;

/** The 1440 × 900 frame scaled to fit the browser window (letterboxed), so every position in the spec holds. */
export function useFrameScale(): number {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / FRAME_W, window.innerHeight / FRAME_H));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  return scale;
}
