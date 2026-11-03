import { beforeEach, describe, expect, it } from "vitest";
import { allowAiAnswer, resetLimitsForTests } from "./limit";

describe("the per-visitor limit", () => {
  beforeEach(() => resetLimitsForTests());
  it("allows 8 AI answers in 10 minutes, then answers from code until the window passes", () => {
    const t = 1_000_000;
    for (let i = 0; i < 8; i++) expect(allowAiAnswer("st_a", t + i)).toBe(true);
    expect(allowAiAnswer("st_a", t + 10)).toBe(false);
    expect(allowAiAnswer("st_b", t + 10)).toBe(true);
    expect(allowAiAnswer("st_a", t + 10 * 60 * 1000 + 20)).toBe(true);
  });
});
