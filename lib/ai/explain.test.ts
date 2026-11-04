import { beforeEach, describe, expect, it } from "vitest";
import { MockLanguageModelV4 } from "ai/test";
import { forgetAiTextsForTests } from "./run";
import { previewDemoStore } from "@/lib/forecast";
import { explainRegularPayment, explainShortfall, regularPaymentTemplate, shortfallTemplate } from "./explain";

beforeEach(() => forgetAiTextsForTests());

const usage = { inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined }, outputTokens: { total: 5, text: 5, reasoning: undefined } };
const writes = (text: string) => new MockLanguageModelV4({ doGenerate: async () => ({ content: [{ type: "text", text }], finishReason: { unified: "stop", raw: undefined }, usage, warnings: [] }) });
const store = previewDemoStore();

describe("the shortfall explanation", () => {
  it("has a code-built line with the day's real numbers", () => {
    expect(shortfallTemplate(store.forecast)).toBe(
      "On Thu 12 Nov there's $1,410 above your $100 minimum, but rent ($1,200) and the supplier order ($300) come to $1,500: $90 more than that.",
    );
    expect(shortfallTemplate(previewDemoStore({ recovered: true, setAsideDailyCents: 1_100 }).forecast)).toBeNull();
  });

  it("uses the AI's sentence only when its numbers are the day's", async () => {
    const good = "Rent ($1,200) and the supplier order ($300) both land on Thu 12 Nov, which is $90 more than the $1,410 above your minimum.";
    expect(await explainShortfall({ ...store.forecast, storeId: "st_e1" }, writes(good))).toBe(good);
    // Remembered for later visitors at the same story step: no second Gemini request.
    const counted = writes("unused");
    expect(await explainShortfall({ ...store.forecast, storeId: "st_e3" }, counted)).toBe(good);
    expect(counted.doGenerateCalls).toHaveLength(0);
    forgetAiTextsForTests();
    expect(await explainShortfall({ ...store.forecast, storeId: "st_e2" }, writes("You'll be about $120 short on Thursday."))).toBe(shortfallTemplate(store.forecast));
    expect(await explainShortfall(store.forecast, null)).toBe(shortfallTemplate(store.forecast));
  });
});

describe("the regular payment explanation", () => {
  const volta = store.payees.find((p) => p.name === "Volta Audio Parts")!;
  const evidence = store.evidence.find((e) => e.payeeId === volta.id)!;
  it("says what the pattern was found from", async () => {
    expect(regularPaymentTemplate(evidence)).toBe("Found from 9 payments between Fri 14 Aug and Mon 2 Nov, each between $291 and $312.");
    expect(await explainRegularPayment(volta, evidence, writes("Volta was paid 9 times, about $300 each, every 10 days since 2020!"))).toBe(regularPaymentTemplate(evidence));
  });
});
