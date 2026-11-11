/* eslint-disable @next/next/no-img-element -- the paintings are pre-sized .webp layers moved by exact CSS transforms (SPEC section 9). */
import type { CSSProperties } from "react";
import type { Arrival, StageName } from "./useStage";

export const ASSET = "/tmrw";
const PAINT = { width: 1672, height: 941 } as const;

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

/** 4.1 The station: the painting breathes, leaves blow past, the lamp glows. Blurred behind login and setup. */
export function Station({ stage }: { stage: StageName }) {
  const pre = stage === "login" || stage === "setup";
  return (
    <div
      className="tmrw-layer tmrw-scene"
      style={{
        opacity: stage === "car" ? 0 : 1,
        filter: pre ? "blur(10px) brightness(.85)" : "none",
        transition: "opacity .9s ease, filter 1s ease",
      }}
    >
      <div className="tmrw-paint tmrw-kb">
        <img
          className="tmrw-full"
          {...PAINT}
          src={`${ASSET}/scenes/station-bench.webp`}
          alt="A quiet country railway platform with a bench and a street lamp under a summer sky"
        />
        <span
          className="tmrw-glow"
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "25.5%",
            top: "9%",
            width: 140,
            height: 140,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,236,190,.55), rgba(255,236,190,0) 65%)",
          }}
        />
        {LEAVES.map((style, i) => (
          <span
            key={i}
            className="tmrw-leaf"
            aria-hidden="true"
            style={style}
          />
        ))}
      </div>
    </div>
  );
}

const MOVING: readonly Arrival[] = ["start", "moving", "slowing", "settle"];

/**
 * 4.2 The train arrives: a blurred band of carriages slides in and slows, disappears into the identical painting
 * underneath, then the door leaves slide apart. 4.3 Scrolling on zooms through the door into the seat.
 */
export function Train({
  stage,
  arrival,
}: {
  stage: StageName;
  arrival: Arrival;
}) {
  const inCar = stage === "car";
  const transition = inCar
    ? "transform 1.1s cubic-bezier(.7,0,.3,1), opacity .5s ease .6s"
    : "transform 1s ease, opacity .5s ease";
  const bandFilter =
    arrival === "start" || arrival === "moving"
      ? "url(#tmrw-mblur)"
      : arrival === "slowing"
        ? "url(#tmrw-mblur2)"
        : "none";
  const open = arrival === "open";
  const door = "transform 2.4s cubic-bezier(.5,0,.2,1)";
  return (
    <>
      <svg
        width="0"
        height="0"
        style={{ position: "absolute" }}
        aria-hidden="true"
      >
        <defs>
          <filter id="tmrw-mblur" x="-10%" y="0" width="120%" height="100%">
            <feGaussianBlur stdDeviation="6 0" />
          </filter>
          <filter id="tmrw-mblur2" x="-10%" y="0" width="120%" height="100%">
            <feGaussianBlur stdDeviation="2 0" />
          </filter>
        </defs>
      </svg>
      <div
        className="tmrw-layer tmrw-scene"
        style={{ opacity: stage === "train" ? 1 : 0, transition }}
      >
        <div
          className="tmrw-paint"
          style={{
            transformOrigin: "50.1% 54.7%",
            transform: inCar ? "scale(3.2)" : "none",
            transition,
          }}
        >
          <img
            className="tmrw-full"
            {...PAINT}
            src={`${ASSET}/scenes/train-doors-open.webp`}
            alt="A cream and green local train stopped at the platform"
          />
          <div
            style={{
              position: "absolute",
              left: "39.89%",
              top: "32.31%",
              width: "20.27%",
              height: "43.78%",
              overflow: "hidden",
            }}
          >
            <img
              src={`${ASSET}/layers/door-left.webp`}
              alt=""
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: "50%",
                height: "100%",
                transform: open ? "translateX(-101%)" : "none",
                transition: door,
              }}
            />
            <img
              src={`${ASSET}/layers/door-right.webp`}
              alt=""
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                width: "50%",
                height: "100%",
                transform: open ? "translateX(101%)" : "none",
                transition: door,
              }}
            />
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: "21.79%",
              width: "100%",
              height: "58.98%",
              overflow: "hidden",
              opacity: stage === "train" && MOVING.includes(arrival) ? 1 : 0,
            }}
          >
            <div
              style={{
                display: "flex",
                width: 4800,
                height: "100%",
                transform: `translateX(${arrival === "start" ? 0 : -3200}px)`,
                filter: bandFilter,
                transition:
                  arrival === "start"
                    ? "none"
                    : "transform 8s cubic-bezier(.22,.61,.36,1)",
              }}
            >
              {[0, 1, 2].map((i) => (
                <img
                  key={i}
                  src={`${ASSET}/layers/train-band-doors-closed.webp`}
                  alt=""
                  style={{ flex: "0 0 1600px", height: "100%" }}
                />
              ))}
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

/** 4.3 The window seat: clouds drift, fields rush past, the carriage rocks. One window icon per seat. */
export function Seat({
  stage,
  seat,
  onOpen,
}: {
  stage: StageName;
  seat: number;
  onOpen: (key: (typeof SEATS)[number]["key"]) => void;
}) {
  const inCar = stage === "car";
  return (
    <div
      className="tmrw-layer tmrw-scene"
      style={{
        opacity: inCar ? 1 : 0,
        pointerEvents: inCar ? "auto" : "none",
        transition: `opacity .8s ease ${inCar ? ".55s" : "0s"}`,
      }}
    >
      <div className="tmrw-rock" style={{ position: "absolute", inset: 0 }}>
        <div className="tmrw-paint">
          <div
            className="tmrw-skyrun"
            style={{
              position: "absolute",
              left: 0,
              top: 63,
              width: "100%",
              height: 387,
              background: `#3E8EE0 url(${ASSET}/layers/scenery-sky-tile.webp) 0 0 / auto 100% repeat-x`,
            }}
          />
          <div
            className="tmrw-groundrun"
            style={{
              position: "absolute",
              left: 0,
              top: 410,
              width: "100%",
              height: 190,
              background: `url(${ASSET}/layers/scenery-ground-tile.webp) 0 0 / auto 100% repeat-x`,
            }}
          />
          <img
            className="tmrw-full"
            {...PAINT}
            src={`${ASSET}/layers/seat-window-glass-cut.webp`}
            alt="A window seat on a sunlit train: olive walls, orange seats, fields rolling past"
          />
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
                transition:
                  "transform 1.3s cubic-bezier(.45,.05,.2,1), opacity .9s ease",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
              }}
            >
              <img
                src={s.img}
                alt=""
                width={250}
                height={250}
                style={{ filter: "drop-shadow(0 18px 30px rgba(10,30,60,.3))" }}
              />
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
