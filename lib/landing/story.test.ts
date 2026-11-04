import { describe, expect, it } from "vitest";
import { previewDemoForecast } from "@/lib/forecast";
import { buildLandingStory, MAX_DAILY_DOLLARS } from "./story";

describe("the landing page story", () => {
  const story = buildLandingStory();

  it("plays the real 14-day forecast, with Thu 12 Nov $90 short", () => {
    const base = previewDemoForecast();
    expect(story.days).toHaveLength(14);
    expect(story.days.map((d) => d.closingCents)).toEqual(base.days.map((d) => d.closingCents));
    const short = story.days[story.shortIndex!]!;
    expect(short.label).toBe("Thu 12 Nov");
    expect(short.closingCents).toBe(1_000);
    expect(short.narrator).toBe("Thu 12 Nov: the supplier order and rent land the same day. $10 left, $90 less than the shop needs.");
    expect(short.moves.filter((m) => m.kind === "out").map((m) => m.label).sort()).toEqual(["Rent", "Volta Audio Parts"]);
  });

  it("writes every narrator line in the house voice", () => {
    for (const d of story.days) {
      expect(d.narrator).not.toContain("!");
      expect(d.narrator).not.toMatch(/\$\d[\d,]*\.\d/); // whole dollars in sentences
    }
    expect(story.days[0]!.narrator.startsWith("Today:")).toBe(true);
  });

  it("works out each slider step with the real forecast", () => {
    expect(story.steps).toHaveLength(MAX_DAILY_DOLLARS + 1);
    for (const dollars of [0, 13, 20, 60]) {
      const after = previewDemoForecast({ setAsideDailyCents: dollars * 100 });
      expect(story.steps[dollars]!.closings).toEqual(after.days.map((d) => d.closingCents));
    }
    expect(story.steps[0]!.decision).toBeNull();
    expect(story.steps[20]!.transferCents).toBe(250_000 - 20 * 100 * 7);
  });

  it("lets the real Guard decide each step: approve, then ask the owner, then block at the 30% cap", () => {
    expect(story.steps[13]!.decision).toBe("APPROVE");
    expect(story.steps[20]!.decision).toBe("ESCALATE");
    expect(story.steps[20]!.ruleNumber).toBe(8);
    const blocked = story.steps.find((s) => s.decision === "BLOCK")!;
    expect(blocked.ruleNumber).toBe(7);
    expect(story.steps.at(-1)!.decision).toBe("BLOCK");
    expect(story.bestStep).not.toBeNull();
    expect(story.steps[story.bestStep!]!.states).not.toContain("short");
  });

  it("counts a recovered payment after PayPal's fee", () => {
    expect(story.recovery.grossCents).toBe(7_200);
    expect(story.recovery.netCents).toBeGreaterThan(6_500);
    expect(story.recovery.netCents).toBeLessThan(7_200);
    expect(story.recovery.feeCents).toBe(story.recovery.grossCents - story.recovery.netCents);
    // The short payment fills up by exactly what arrived.
    const due = story.recovery.due!;
    expect(due.name).toBe("Volta Audio Parts");
    expect(due.readyBeforeCents).toBe(21_000);
    expect(due.readyAfterCents - due.readyBeforeCents).toBe(story.recovery.netCents);
  });

  it("judges three reminders with the real rules", () => {
    expect(story.receipts.map((r) => r.decision.decision)).toEqual(["APPROVE", "ESCALATE", "BLOCK"]);
    expect(story.receipts[2]!.decision.headlineRule).toBe("ALREADY_PAID");
  });
});
