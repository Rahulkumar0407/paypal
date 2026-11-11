/* eslint-disable @next/next/no-img-element -- the paintings are pre-sized .webp layers moved by exact CSS transforms (SPEC section 9). */
import type { CSSProperties } from "react";
import type { Arrival, StageName } from "./useStage";

export const ASSET = "/tmrw";
const PAINT = { width: 1672, height: 941 } as const;
/** Painting pixels (1672 × 941) as a percentage of the painting, for placing layers. */
const px = (x: number) => `${(x / 1672) * 100}%`;
const py = (y: number) => `${(y / 941) * 100}%`;

/** 12 wind-blown leaves, placed the same way on every visit (the prototype's seeded generator). */
const LEAVES: CSSProperties[] = (() => {
  let s = 11;
  const r = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const colours = ["#5E9E3C", "#7DB24A", "#A7C35A", "#4C8A34"];
  return Array.from({ length: 12 }, (_, i) => ({
    left: `${(60 + r() * 45).toFixed(1)}%`,
    top: `${(5 + r() * 60).toFixed(1)}%`,
    animationDuration: `${(9 + r() * 8).toFixed(1)}s`,
    animationDelay: `-${(r() * 14).toFixed(1)}s`,
    background: colours[i % 4],
  }));
})();

/**
 * 4.1 The station: the empty platform breathes, leaves blow past, the lamp glows. Blurred behind login and setup.
 * The drift runs only before the train comes, so the train arrives onto a still platform.
 */
export function Station({ stage }: { stage: StageName }) {
  const pre = stage === "login" || stage === "setup";
  const drifting = stage === "station" || pre;
  return (
    <div
      className="tmrw-layer tmrw-scene"
      style={{ opacity: stage === "car" ? 0 : 1, filter: pre ? "blur(10px) brightness(.85)" : "none", transition: "opacity .9s ease, filter 1s ease" }}
    >
      <div className={`tmrw-paint${drifting ? " tmrw-kb" : ""}`}>
        <img className="tmrw-full" {...PAINT} src={`${ASSET}/scenes/platform-empty.webp`} alt="A quiet country railway platform with a street lamp, fields and summer clouds beyond" />
        <span
          className="tmrw-glow"
          aria-hidden="true"
          style={{ position: "absolute", left: "26.1%", top: "6.5%", width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,236,190,.55), rgba(255,236,190,0) 65%)" }}
        />
        {LEAVES.map((style, i) => (
          <span key={i} className="tmrw-leaf" aria-hidden="true" style={style} />
        ))}
      </div>
    </div>
  );
}

/** The long train strip, in the 1600-wide box (3780 painting px wide). */
const STRIP_W = Math.round(3780 * (1600 / 1672));
/** Where the strip stops: as far left as it can go with its right edge still on screen (its last door near centre). */
const STRIP_END_X = 1600 - STRIP_W;
const GLIDING: readonly Arrival[] = ["start", "moving", "slowing", "settle"];

/**
 * 4.2 The train arrives: a long train glides in over the empty platform and slows to a stop, then gives way to the
 * still painting of the same train, whose door leaves slide apart. 4.3 Scrolling on zooms through the door into the seat.
 */
export function Train({ stage, arrival }: { stage: StageName; arrival: Arrival }) {
  const inCar = stage === "car";
  const gliding = stage === "train" && GLIDING.includes(arrival);
  const standing = inCar || (stage === "train" && (arrival === "stopped" || arrival === "open"));
  const open = arrival === "open";
  const zoom = inCar ? "transform 1.1s cubic-bezier(.7,0,.3,1), opacity .5s ease .6s" : "transform 1s ease, opacity .5s ease";
  const blur = arrival === "start" || arrival === "moving" ? "url(#tmrw-mblur)" : arrival === "slowing" ? "url(#tmrw-mblur2)" : "none";
  const door = "transform 2.4s cubic-bezier(.5,0,.2,1)";
  return (
    <>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs>
          <filter id="tmrw-mblur" x="-10%" y="0" width="120%" height="100%">
            <feGaussianBlur stdDeviation="6 0" />
          </filter>
          <filter id="tmrw-mblur2" x="-10%" y="0" width="120%" height="100%">
            <feGaussianBlur stdDeviation="2 0" />
          </filter>
        </defs>
      </svg>
      <div className="tmrw-layer tmrw-scene" style={{ opacity: stage === "train" ? 1 : 0, transition: zoom }}>
        <div className="tmrw-paint" style={{ transformOrigin: "50% 54.3%", transform: inCar ? "scale(3.2)" : "none", transition: zoom }}>
          {/* The still platform the train pulls into (the station's own painting, without the drift). */}
          <img className="tmrw-full" {...PAINT} src={`${ASSET}/scenes/platform-empty.webp`} alt="" />

          {/* The moving train: one long strip, no repeats, so no joins pass by. */}
          <div style={{ position: "absolute", left: 0, top: py(222), width: "100%", height: py(526), overflow: "hidden", opacity: gliding && arrival !== "start" ? 1 : 0, transition: "opacity .6s ease" }}>
            <img
              src={`${ASSET}/layers/train-strip.webp`}
              alt=""
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: STRIP_W,
                height: "100%",
                maxWidth: "none",
                transform: `translateX(${arrival === "start" ? 0 : STRIP_END_X}px)`,
                filter: blur,
                transition: arrival === "start" ? "none" : "transform 8s cubic-bezier(.22,.61,.36,1)",
              }}
            />
          </div>

          {/* The train standing at the platform: doors-open painting with the closed door leaves on top. */}
          <div style={{ position: "absolute", inset: 0, opacity: standing ? 1 : 0, transition: "opacity .8s ease" }}>
            <img className="tmrw-full" {...PAINT} src={`${ASSET}/scenes/train-open.webp`} alt="A cream and green local train stopped at the platform" />
            <div style={{ position: "absolute", left: px(664), top: py(300), width: px(344), height: py(422), overflow: "hidden" }}>
              <img src={`${ASSET}/layers/door2-left.webp`} alt="" style={{ position: "absolute", left: 0, top: 0, width: "50%", height: "100%", transform: open ? "translateX(-101%)" : "none", transition: door }} />
              <img src={`${ASSET}/layers/door2-right.webp`} alt="" style={{ position: "absolute", right: 0, top: 0, width: "50%", height: "100%", transform: open ? "translateX(101%)" : "none", transition: door }} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export const SEATS = [
  { key: "cal", name: "Calendar", img: `${ASSET}/icons/calendar.png` },
  { key: "grow", name: "Ventures", img: `${ASSET}/icons/ventures.png` },
  { key: "ins", name: "Insights", img: `${ASSET}/icons/insights.png` },
] as const;

/** 4.3 The window seat: one continuous landscape slides past every window, the carriage rocks. One icon per seat. */
export function Seat({ stage, seat, onOpen }: { stage: StageName; seat: number; onOpen: (key: (typeof SEATS)[number]["key"]) => void }) {
  const inCar = stage === "car";
  return (
    <div className="tmrw-layer tmrw-scene" style={{ opacity: inCar ? 1 : 0, pointerEvents: inCar ? "auto" : "none", transition: `opacity .8s ease ${inCar ? ".55s" : "0s"}` }}>
      <div className="tmrw-rock" style={{ position: "absolute", inset: 0 }}>
        <div className="tmrw-paint">
          {/* One seamless panorama (mirrored, so it loops) behind all three windows: clouds and fields always match. */}
          <div className="tmrw-panorun" style={{ position: "absolute", left: 0, top: 63, width: "100%", height: 537, background: `#3E8EE0 url(${ASSET}/layers/panorama-tile.webp) 0 0 / auto 100% repeat-x` }} />
          <img className="tmrw-full" {...PAINT} src={`${ASSET}/layers/seat-window-glass-cut.webp`} alt="A window seat on a sunlit train: olive walls, orange seats, fields rolling past" />
          {SEATS.map((s, i) => (
            <button
              key={s.key}
              className="tmrw-btn"
              onClick={() => onOpen(s.key)}
              aria-label={`Open ${s.name}`}
              tabIndex={i === seat && inCar ? 0 : -1}
              aria-hidden={i !== seat}
              style={{
                position: "absolute",
                left: 800,
                top: 322,
                transform: `translate(-50%, -50%) translateX(${(i - seat) * 820}px)`,
                opacity: i === seat ? 1 : 0,
                pointerEvents: i === seat ? "auto" : "none",
                transition: "transform 1.3s cubic-bezier(.45,.05,.2,1), opacity .9s ease",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
              }}
            >
              <img src={s.img} alt="" width={250} height={250} style={{ filter: "drop-shadow(0 18px 30px rgba(10,30,60,.3))" }} />
              <span
                style={{
                  height: 40,
                  padding: "0 18px",
                  borderRadius: 99,
                  background: "rgba(22,22,24,.82)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {s.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
