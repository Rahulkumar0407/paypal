import { describe, expect, it } from "vitest";
import { previewDemoForecast } from "@/lib/forecast";
import { buildLandingStory } from "./story";

describe("the landing page story", () => {
  const story = buildLandingStory();

  it("plays the real 30-day forecast, with Thu 12 Nov $120 short", () => {
    const base = previewDemoForecast();
    expect(story.days).toHaveLength(30);
    expect(story.days.map((d) => d.closingCents)).toEqual(base.days.map((d) => d.closingCents));
    const short = story.days[story.shortIndex!]!;
    expect(short.label).toBe("Thu 12 Nov");
    expect(short.closingCents).toBe(8_000);
    expect(short.narrator).toBe("Thu 12 Nov: the bean order and rent land the same day. $80 left, $120 less than the shop needs.");
    expect(short.moves.filter((m) => m.kind === "out").map((m) => m.label).sort()).toEqual(["Bean There", "Rent"]);
  });

  it("writes every narrator line in the house voice", () => {
    for (const d of story.days) {
      expect(d.narrator).not.toContain("!");
      expect(d.narrator).not.toMatch(/\$\d[\d,]*\.\d/); // whole dollars in sentences
    }
    expect(story.days[0]!.narrator.startsWith("Today:")).toBe(true);
  });
});
