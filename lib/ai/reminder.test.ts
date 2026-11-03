import { describe, expect, it } from "vitest";
import { MockLanguageModelV4 } from "ai/test";
import { draftReminder, reminderTemplate } from "./reminder";

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

describe("the AI draft", () => {
  const input = { firstName: "Maya", orderNumber: 1258, items: ["Loop Kids volume-safe headphones"], sequence: 1 };
  const usage = { inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined }, outputTokens: { total: 5, text: 5, reasoning: undefined } };
  const writes = (subject: string, body: string) =>
    new MockLanguageModelV4({ doGenerate: async () => ({ content: [{ type: "text", text: JSON.stringify({ subject, body }) }], finishReason: { unified: "stop", raw: undefined }, usage, warnings: [] }) });

  it("is used when it passes every check", async () => {
    const d = await draftReminder(input, writes("Your Loop Audio order is waiting", "Hi Maya, your headphones are saved for you. You can finish here: {checkout_link}. Thanks, Loop Audio"));
    expect(d).toMatchObject({ source: "ai", body: "Hi Maya, your headphones are saved for you. You can finish here: {checkout_link}. Thanks, Loop Audio" });
  });

  it("falls back to the template for an amount, an exclamation mark, a missing link, or no AI", async () => {
    const template = reminderTemplate(input);
    for (const body of [
      "Hi Maya, your $45 headphones are waiting: {checkout_link}. Thanks, Loop Audio",
      "Hi Maya, don't miss out! Finish here: {checkout_link}. Thanks, Loop Audio",
      "Hi Maya, your headphones are waiting. Thanks, Loop Audio",
    ]) {
      expect(await draftReminder(input, writes("Your order", body))).toEqual(template);
    }
    expect(await draftReminder(input, null)).toEqual(template);
  });
});
