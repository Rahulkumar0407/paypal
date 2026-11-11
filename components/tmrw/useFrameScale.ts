"use client";

import { useEffect, useState } from "react";

/** Every scene is designed 900px tall. The frame is always 900 tall and as wide as the screen's shape allows. */
export const FRAME_H = 900;
/** The design width (SPEC section 2); the frame never gets narrower than this, so cards and windows always fit. */
export const DESIGN_W = 1440;
/** The paintings are drawn in a 1600 × 900 box (SPEC section 3). */
const PAINT_W = 1600;

export interface Frame {
  /** Screen pixels per frame pixel. */
  scale: number;
  /** Frame width in frame pixels: fills the screen, no letterbox bars. */
  width: number;
  /** How much the 1600-wide paintings scale up so they always cover a wider frame. */
  cover: number;
}

function fit(): Frame {
  if (typeof window === "undefined") return { scale: 1, width: DESIGN_W, cover: 1 };
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // Fill the height; on a very narrow window fall back to fitting the design width.
  let scale = vh / FRAME_H;
  if (vw / scale < DESIGN_W) scale = vw / DESIGN_W;
  const width = vw / scale;
  return { scale, width, cover: Math.max(1, width / PAINT_W) };
}

/** The frame fills the whole browser window: full height, full width, the paintings cropped to cover. */
export function useFrame(): Frame {
  const [frame, setFrame] = useState<Frame>({ scale: 1, width: DESIGN_W, cover: 1 });
  useEffect(() => {
    const update = () => setFrame(fit());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return frame;
}
