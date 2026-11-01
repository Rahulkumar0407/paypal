import { describe, expect, it } from "vitest";
import { buildHeadline } from "./headline";
import { buildMockForecast, mockForecast, mockForecastAfterRecovery, mockForecastFixed } from "@/mocks/forecast";

describe("buildHeadline", () => {
  it("reads the story's opening sentence word for word", () => {
    expect(buildHeadline(mockForecast)).toEqual({
      text: "Clear until Wednesday. On Thu 12 Nov you'll be $90 short: the supplier order and rent land the same day.",
      tone: "short",
    });
  });

  it("updates after the recovered payment", () => {
    expect(buildHeadline(mockForecastAfterRecovery).text).toBe(
      "Clear until Wednesday. On Thu 12 Nov you'll be $21 short: the supplier order and rent land the same day.",
    );
  });

  it("says clear once the gap is fixed, and names the big day", () => {
    const h = buildHeadline(mockForecastFixed);
    expect(h.tone).toBe("covered");
    expect(h.text).toBe("Clear for the next two weeks. Thu 12 Nov is covered too, when rent and the supplier order go out.");
  });

  it("speaks about today when today is the short day", () => {
    const f = buildMockForecast({ extraIn: { "2026-11-05": -200_000 } });
    expect(buildHeadline(f).text.startsWith("Today you're")).toBe(true);
  });
});
