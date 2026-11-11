import { describe, expect, it } from "vitest";
import { ARRIVAL_TIMELINE, POSITIONS, positionOf, STEP_DEBOUNCE_MS } from "./useStage";

describe("the tmrw stage machine", () => {
  it("has five scroll positions: station, train, and the three seats", () => {
    expect(POSITIONS).toBe(5);
    expect(positionOf({ stage: "station", seat: 0 })).toBe(0);
    expect(positionOf({ stage: "train", seat: 0 })).toBe(1);
    expect([0, 1, 2].map((seat) => positionOf({ stage: "car", seat }))).toEqual([2, 3, 4]);
  });

  it("has no scroll position before setup is done", () => {
    expect(positionOf({ stage: "login", seat: 0 })).toBe(-1);
    expect(positionOf({ stage: "setup", seat: 0 })).toBe(-1);
  });

  it("follows the spec's timings: one step per 1100 ms, and the train's arrival timeline", () => {
    expect(STEP_DEBOUNCE_MS).toBe(1100);
    expect(ARRIVAL_TIMELINE).toEqual([
      [60, "moving"],
      [3000, "slowing"],
      [4800, "settle"],
      [6000, "stopped"],
      [6250, "open"],
    ]);
  });
});
