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

describe("the landing page's fixes, recovery and receipts", () => {
  const story = buildLandingStory();

  it("explains the clash on Thu 12 Nov: $1,900 due, $1,780 free above the cushion, $120 short", () => {
    expect(story.clash).toMatchObject({ label: "Thu 12 Nov", dueCents: 190_000, freeCents: 178_000, shortByCents: 12_000 });
    expect(story.clash!.dues.map((d) => d.name).sort()).toEqual(["Bean There", "Rent"]);
  });

  it("offers the story's fixes, each from the real forecast, each needing the owner's OK", () => {
    const short = story.shortIndex!;
    const byLabel = Object.fromEntries(story.fixes.map((f) => [f.label, f]));
    expect(Object.keys(byLabel)).toEqual(["Remind Ivory & Vow", "Move Bean There to Sat 14 Nov", "Borrow $120"]);
    expect(byLabel["Remind Ivory & Vow"]!.states[short]).toBe("covered");
    expect(byLabel["Move Bean There to Sat 14 Nov"]!.states[short]).toBe("covered");
    expect(byLabel["Borrow $120"]!.states[short]).toBe("tight");
    for (const f of story.fixes) {
      expect(f.decision).toBe("ESCALATE");
      expect(f.ruleNumber).toBe(8);
      expect(f.states).not.toContain("short");
    }
  });

  it("counts what arrives after PayPal's fee when Ivory & Vow pays, and it covers the day", () => {
    expect(story.recovery).toMatchObject({ customer: "Ivory & Vow", grossCents: 24_000, netCents: 23_113, feeCents: 887, shortBeforeCents: 12_000, shortAfterCents: 0 });
    expect(story.recovery!.due).toMatchObject({ name: "Bean There", readyBeforeCents: 28_000, readyAfterCents: 40_000 });
  });

  it("prints three real Guard decisions: needs your OK, blocked for consent, blocked as already paid", () => {
    const decided = story.receipts.map(({ receipt }) => [receipt.decision.decision, receipt.decision.headlineRule]);
    expect(decided).toEqual([
      ["ESCALATE", "OWNER_APPROVAL"],
      ["BLOCK", "CONSENT"],
      ["BLOCK", "ALREADY_PAID"],
    ]);
    for (const { caption } of story.receipts) expect(caption).not.toContain("!");
  });
});
