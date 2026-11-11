import { describe, expect, it } from "vitest";
import { MockLanguageModelV4 } from "ai/test";
import { previewDemoStore, type DemoScenario } from "@/lib/forecast";
import { formatDollars } from "@/lib/shared/money";
import { amountFrom, answerWith, dateFrom, plainAnswer, type AskData } from "./ask";

/** Ask chat against the demo store's real forecast. FIXED is the story after Ivory & Vow pays. */
const START: DemoScenario = {};
const FIXED: DemoScenario = { recovered: true };

function data(scenario: DemoScenario): AskData {
  const s = previewDemoStore(scenario);
  return { today: s.today, forecast: async () => s.forecast, dues: async () => s.dues, canAfford: async (a, d) => s.canAfford(a, d), recentPayments: async () => s.recentPayments };
}

const usage = { inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined }, outputTokens: { total: 5, text: 5, reasoning: undefined } };
type Content = { type: "text"; text: string } | { type: "tool-call"; toolCallId: string; toolName: string; input: string };
const step = (content: Content[]) => ({ content, finishReason: { unified: content.some((c) => c.type === "tool-call") ? ("tool-calls" as const) : ("stop" as const), raw: undefined }, usage, warnings: [] });
const call = (toolName: string, input: object): Content => ({ type: "tool-call", toolCallId: `call-${toolName}`, toolName, input: JSON.stringify(input) });
const say = (text: string): Content => ({ type: "text", text });
const model = (...steps: Content[][]) => new MockLanguageModelV4({ doGenerate: steps.map(step) });

describe("five sample questions, answered from the forecast's numbers (no AI)", () => {
  it("'Can I afford a $200 order on Monday?' No: Mon 9 Nov ends at $1,464, Thu 12 Nov would be $89 short", async () => {
    const d = data(FIXED);
    const check = await d.canAfford(20_000, "2026-11-09");
    expect(check.balanceAfterOnDateCents).toBe(146_445);
    const a = await answerWith("Can I afford a $200 order on Monday?", d, null);
    expect(a).toMatchObject({ source: "fallback", toolsUsed: ["canAfford"], answer: "No. Mon 9 Nov itself ends at $1,464, but the order would leave Thu 12 Nov $89 short." });
    expect(a.facts).toEqual([
      { label: "Mon 9 Nov, after a $200 order", cents: 146_445, date: "2026-11-09" },
      { label: "Short on Thu 12 Nov with the order", cents: 8_887, date: "2026-11-12" },
    ]);
  });

  it("'When is my next shortfall?' Thu 12 Nov, $120 short", async () => {
    const a = await answerWith("When is my next shortfall?", data(START), null);
    expect(a.answer).toBe("Thu 12 Nov: you'll be $120 short, because the bean order and rent land the same day.");
    expect(a.facts).toEqual([{ label: "Short on Thu 12 Nov", cents: 12_000, date: "2026-11-12" }]);
  });

  it("'What do I have to pay this week?' rent, and Bean There with $280 ready", async () => {
    const a = await answerWith("What do I have to pay this week?", data(START), null);
    expect(a.answer).toBe("In the next week: Rent $1,500 on Thu 12 Nov; Bean There $400 on Thu 12 Nov ($280 ready).");
  });

  it("'How much do I usually pay Bean There?' its last three payments and the next", async () => {
    const a = await answerWith("How much do I usually pay Bean There?", data(START), null);
    expect(a.answer).toBe("Your last 3 payments to Bean There: $400 on Mon 2 Nov, $396 on Fri 23 Oct, $400 on Tue 13 Oct. The next one is $400 on Thu 12 Nov.");
  });

  it("'How much did I sell in the last 7 days?' the week's sales after PayPal's fees", async () => {
    const d = data(START);
    const week = (await d.recentPayments()).filter((p) => p.name === "Sales" && p.date >= "2026-10-29").reduce((s, p) => s + p.amountCents, 0);
    const a = await answerWith("How much did I sell in the last 7 days?", d, null);
    expect(a.answer).toBe(`In the last 7 days, ${formatDollars(week)} of sales arrived after PayPal's fees.`);
  });

  it("says so when it can't answer, and when a date is too far out", async () => {
    expect((await answerWith("What's the weather like?", data(START), null)).answer).toContain("I can't answer that from your numbers");
    expect((await plainAnswer("Can I afford $50 on 30 Dec?", data(START))).answer).toContain("next 35 days");
  });
});

describe("reading a question", () => {
  it("finds the amount and the date", () => {
    expect([amountFrom("Can I afford a $200 order?"), amountFrom("spend 1,250.50 dollars"), amountFrom("no amount")]).toEqual([20_000, 125_050, null]);
    const today = "2026-11-05";
    expect([dateFrom("on Monday", today), dateFrom("on Thursday", today), dateFrom("tomorrow", today), dateFrom("on 16 Nov", today), dateFrom("Nov 20", today), dateFrom("2026-11-30", today)]).toEqual([
      "2026-11-09",
      "2026-11-12",
      "2026-11-06",
      "2026-11-16",
      "2026-11-20",
      "2026-11-30",
    ]);
  });
});

describe("with the AI", () => {
  it("keeps an answer whose numbers all come from the tool, with code-built facts", async () => {
    const m = model([call("canAfford", { amountDollars: 200, date: "2026-11-09" })], [say("Not yet. Mon 9 Nov ends at $1,464 after the order, but Thu 12 Nov would be $89 short.")]);
    const a = await answerWith("Can I afford a $200 order on Monday?", data(FIXED), m);
    expect(a).toMatchObject({ source: "ai", toolsUsed: ["canAfford"], answer: "Not yet. Mon 9 Nov ends at $1,464 after the order, but Thu 12 Nov would be $89 short." });
    expect(a.facts[0]).toEqual({ label: "Mon 9 Nov, after a $200 order", cents: 146_445, date: "2026-11-09" });
  });

  it("replaces an answer with a number no tool gave", async () => {
    const m = model([call("canAfford", { amountDollars: 200, date: "2026-11-09" })], [say("Yes, you'll have about $950 left on Monday.")]);
    const a = await answerWith("Can I afford a $200 order on Monday?", data(FIXED), m);
    expect(a).toMatchObject({ source: "fallback", answer: "No. Mon 9 Nov itself ends at $1,464, but the order would leave Thu 12 Nov $89 short." });
  });

  it("replaces an answer that used no tool, or breaks the voice rules", async () => {
    expect((await answerWith("When is my next shortfall?", data(START), model([say("Probably Thursday.")]))).source).toBe("fallback");
    const shouting = model([call("getForecast", {})], [say("Thu 12 Nov is $120 short!")]);
    expect((await answerWith("When is my next shortfall?", data(START), shouting)).source).toBe("fallback");
  });

  it("falls back calmly when the AI fails", async () => {
    const broken = new MockLanguageModelV4({ doGenerate: async () => Promise.reject(new Error("quota exceeded")) });
    const a = await answerWith("When is my next shortfall?", data(START), broken);
    expect(a).toMatchObject({ source: "fallback", answer: "Thu 12 Nov: you'll be $120 short, because the bean order and rent land the same day." });
  });

  it("answers from code with a note when the visitor is over the limit", async () => {
    const m = model([say("unused")]);
    const a = await answerWith("When is my next shortfall?", data(START), m, "You've asked a lot in a few minutes, so this answer comes straight from your numbers.");
    expect(a.source).toBe("fallback");
    expect(a.answer.startsWith("You've asked a lot")).toBe(true);
    expect(m.doGenerateCalls).toHaveLength(0);
  });
});
