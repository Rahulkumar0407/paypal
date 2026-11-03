import { describe, expect, it } from "vitest";
import { reminderTemplate } from "./draft";

const BANNED = ["!", "unlock", "seamless", "supercharge", "AI-powered"];

describe("the reminder template", () => {
  it("names the customer and what they left, with a place for the link", () => {
    const d = reminderTemplate({ firstName: "Maya", orderNumber: 1258, items: ["Loop Kids volume-safe headphones", "Replacement ear cushions"], sequence: 1 });
    expect(d).toEqual({
      subject: "Your Loop Audio order #1258 is waiting",
      body: "Hi Maya, your Loop Kids volume-safe headphones and replacement ear cushions are still waiting for you. Here's a fresh checkout link if you'd like to finish your order: {checkout_link}. Thanks, Loop Audio",
      source: "template",
    });
  });

  it("is gentler the second time, and says there's no need to reply", () => {
    const d = reminderTemplate({ firstName: "Maya", orderNumber: 1258, items: ["Loop Buds"], sequence: 2 });
    expect(d.subject).toBe("A last reminder about Loop Audio order #1258");
    expect(d.body).toContain("Loop Buds is still saved for you");
    expect(d.body).toContain("no need to reply");
  });

  it("follows the voice rules: no exclamation marks, no banned words, no amounts", () => {
    for (const sequence of [1, 2]) {
      const { subject, body } = reminderTemplate({ firstName: "Sam", orderNumber: 1261, items: ["Loop Buds Pro"], sequence });
      for (const word of BANNED) expect(`${subject} ${body}`.toLowerCase()).not.toContain(word.toLowerCase());
      expect(body).not.toMatch(/\$\d/);
      expect(body).toContain("{checkout_link}");
    }
  });
});
