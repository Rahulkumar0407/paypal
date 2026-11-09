"use client";

import React, { useSyncExternalStore } from "react";
import Image from "next/image";
import { formatShortfall } from "@/lib/shared/money";

interface FlapData {
  weekday: string;
  day: string;
}

interface ShortDayData {
  label: string;
  flap: FlapData;
  shortByCents: number;
}

interface HeroAnimatedIllustrationProps {
  firstShortDay: ShortDayData | null;
  onSelectShortDay?: () => void;
  className?: string;
  priority?: boolean;
}

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

/**
 * HeroAnimatedIllustration
 * 
 * Professional 2D character and narrative animation for NeverShort V2.
 * Preserves the exact original masterpiece artwork (`scene_hero_custom.jpg`) with
 * 100% anatomical, stylistic, and textural fidelity.
 * 
 * Animation Timeline:
 * - 0.0s – 0.7s: Scene establishment (calm morning at Loop Audio, stillness).
 * - 0.7s – 1.5s: Natural human moment (subtle respiratory rhythm, seated rest).
 * - 1.5s – 2.0s: Character acting (handcrafted natural 240ms human eye blink).
 * - 2.0s – 3.1s: The future is revealed (focal emphasis on desk calendar,
 *                hand-drawn crimson marker draws around Thu 12 Nov bills due).
 * - 3.1s – 3.8s: All motion gently settles into stable resting equilibrium.
 * - Idle: Restrained ambient life (gentle breathing + occasional blink every ~6.5s).
 */
export function HeroAnimatedIllustration({
  firstShortDay,
  onSelectShortDay,
  className = "",
  priority = true,
}: HeroAnimatedIllustrationProps) {
  const prefersReduced = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  return (
    <div
      className={`hero-cinematic-stage relative w-full aspect-[1376/768] overflow-hidden select-none ${className}`}
      role="img"
      aria-label="Loop Audio shopkeeper resting at the counter as the shop calendar shows bills due on Thursday 12 November."
    >
      {/* ── LAYER 1: Master Artwork with Subtle Respiration ── */}
      <div
        className={`relative w-full h-full ${
          prefersReduced ? "" : "hero-shopkeeper-respiration"
        }`}
      >
        <Image
          src="/landing/scene_hero_custom.jpg"
          alt="Loop Audio shopkeeper resting at counter"
          fill
          priority={priority}
          loading="eager"
          unoptimized
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 70vw, 900px"
          className="object-cover w-full h-full"
        />

        {/* ── LAYER 2: Eyelid Blink Layers (Positioned to exact sub-pixel coordinates) ── */}
        {!prefersReduced && (
          <div
            className="hero-eye-socket-anchor absolute pointer-events-none"
            style={{
              left: "47.6017%",
              top: "18.8802%",
              width: "6.9040%",
              height: "5.2083%",
            }}
            aria-hidden="true"
          >
            {/* Half-Closed Transition Eyelid */}
            <div className="absolute inset-0 hero-lid-half">
              <Image
                src="/landing/hero_eyes_half.png"
                alt=""
                fill
                unoptimized
                className="object-contain w-full h-full"
              />
            </div>

            {/* Fully Closed Eyelid */}
            <div className="absolute inset-0 hero-lid-closed">
              <Image
                src="/landing/hero_eyes_closed.png"
                alt=""
                fill
                unoptimized
                className="object-contain w-full h-full"
              />
            </div>
          </div>
        )}

        {/* ── LAYER 3: Clean Calendar Paper Patch (Pre-Reveal: 0.0s – 2.0s) ── */}
        {!prefersReduced && (
          <div
            className="hero-clean-cal-patch absolute pointer-events-none"
            style={{
              left: "71.22%",
              top: "31.25%",
              width: "15.98%",
              height: "24.74%",
            }}
            aria-hidden="true"
          >
            <Image
              src="/landing/hero_calendar_clean_patch.png"
              alt=""
              fill
              unoptimized
              className="object-contain w-full h-full"
            />
          </div>
        )}

        {/* ── LAYER 4: Dynamic Crimson Marker Animation (2.0s – 2.7s) ── */}
        {!prefersReduced && (
          <svg
            viewBox="0 0 1376 768"
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            aria-hidden="true"
          >
            <defs>
              <filter id="crimsonInkGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#991B1B" floodOpacity="0.3" />
              </filter>
            </defs>

            {/* Hand-drawn marker oval circling "$1,500" bills due */}
            <ellipse
              cx="1087"
              cy="325"
              rx="93"
              ry="114"
              transform="rotate(-4 1087 325)"
              fill="none"
              stroke="#DC2626"
              strokeWidth="3.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#crimsonInkGlow)"
              className="hero-marker-ink-stroke"
            />
          </svg>
        )}

        {/* ── LAYER 5: Ambient Warmth & Focal Light on Calendar (2.0s+) ── */}
        {!prefersReduced && (
          <div
            className="hero-calendar-focal-glow absolute pointer-events-none rounded-full"
            style={{
              left: "68%",
              top: "24%",
              width: "28%",
              height: "44%",
              background: "radial-gradient(circle, rgba(254, 243, 199, 0.22) 0%, rgba(254, 243, 199, 0) 70%)",
            }}
            aria-hidden="true"
          ></div>
        )}
      </div>

      {/* ── LAYER 6: Integrated Calendar Forecast Risk Callout ── */}
      {firstShortDay && (
        <div
          className={`hero-event-callout-wrapper absolute z-20 ${
            prefersReduced ? "opacity-100" : "hero-event-callout-anim"
          }`}
          style={{
            left: "62%",
            bottom: "8%",
          }}
        >
          <a
            href="#the-problem"
            onClick={onSelectShortDay}
            className="group inline-flex items-center gap-2.5 bg-white/95 hover:bg-white text-[#001435] text-xs sm:text-sm font-extrabold px-4 py-2.5 sm:px-5 sm:py-3 rounded-full border border-[#CBD5E1] shadow-[0_12px_28px_-6px_rgba(0,20,53,0.18)] hover:border-[#DC2626] transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] backdrop-blur-xs"
            aria-label={`Jump to forecast risk for ${firstShortDay.label}: ${formatShortfall(firstShortDay.shortByCents)} below reserve`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full bg-[#DC2626] shadow-[0_0_0_3px_rgba(220,38,38,0.2)] animate-pulse shrink-0"
              aria-hidden="true"
            />
            <span className="tracking-tight">
              {firstShortDay.flap.weekday} {firstShortDay.flap.day} ·{" "}
              <span className="text-[#DC2626]">
                {formatShortfall(firstShortDay.shortByCents)} below reserve
              </span>
            </span>
            <span
              className="text-[#64748B] group-hover:text-[#0070E0] group-hover:translate-y-0.5 transition-transform text-xs"
              aria-hidden="true"
            >
              ↓
            </span>
          </a>
        </div>
      )}
    </div>
  );
}