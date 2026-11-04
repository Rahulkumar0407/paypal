import { describe, expect, it } from "vitest";
import { APICallError, generateText } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { AiBudgetError, createPool, isQuotaError, restFor, rotatingModel } from "./pool";

const usage = { inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined }, outputTokens: { total: 1, text: 1, reasoning: undefined } };
const says = (text: string) => new MockLanguageModelV4({ doGenerate: async () => ({ content: [{ type: "text", text }], finishReason: { unified: "stop", raw: undefined }, usage, warnings: [] }) });
const quota = (body = '{"error":{"status":"RESOURCE_EXHAUSTED","message":"Quota exceeded"}}') =>
  new MockLanguageModelV4({ doGenerate: async () => Promise.reject(new APICallError({ message: "Resource exhausted", url: "https://generativelanguage.googleapis.com", requestBodyValues: {}, statusCode: 429, responseBody: body })) });

describe("the key pool", () => {
  it("lets keys take turns, and uses a later model only when every key for the first is spent", () => {
    let t = 0;
    const pool = createPool(["flash-lite#key1", "flash-lite#key2", "flash#key1"], { perMinute: 2, perDay: 100 }, () => t);
    expect([pool.take(), pool.take(), pool.take(), pool.take(), pool.take()]).toEqual(["flash-lite#key1", "flash-lite#key2", "flash-lite#key1", "flash-lite#key2", "flash#key1"]);
    expect(pool.take()).toBe("flash#key1");
    expect(pool.take()).toBeNull();
    t += 60_000;
    expect(pool.take()).toBe("flash-lite#key1");
  });

  it("stops each key at its daily budget", () => {
    let t = 0;
    const pool = createPool(["m#key1"], { perMinute: 100, perDay: 3 }, () => t);
    for (let i = 0; i < 3; i++) expect(pool.take()).toBe("m#key1");
    expect(pool.take()).toBeNull();
    t += 24 * 60 * 60_000;
    expect(pool.take()).toBe("m#key1");
  });

  it("rests a key Google says is out of quota", () => {
    let t = 0;
    const pool = createPool(["m#key1", "m#key2"], { perMinute: 100, perDay: 100 }, () => t);
    pool.rest("m#key1", 60_000);
    expect([pool.take(), pool.take()]).toEqual(["m#key2", "m#key2"]);
    t += 60_001;
    expect(pool.take()).toBe("m#key1");
  });

  it("tells a quota error from any other, and rests a day's quota longer than a minute's", () => {
    const err = (body: string, statusCode = 429) => new APICallError({ message: "x", url: "u", requestBodyValues: {}, statusCode, responseBody: body });
    expect(isQuotaError(err("{}"))).toBe(true);
    expect(isQuotaError(err('{"error":"bad request"}', 400))).toBe(false);
    expect(restFor(err("GenerateRequestsPerDayPerProjectPerModel"))).toBe(60 * 60_000);
    expect(restFor(err("GenerateRequestsPerMinutePerProjectPerModel"))).toBe(60_000);
  });
});

describe("the rotating model", () => {
  it("moves to the next key when one is out of quota", async () => {
    const pool = createPool(["m#key1", "m#key2"], { perMinute: 10, perDay: 10 });
    const model = rotatingModel([{ id: "m#key1", model: quota() }, { id: "m#key2", model: says("From key 2.") }], pool);
    expect((await generateText({ model, prompt: "hi", maxRetries: 0 })).text).toBe("From key 2.");
    // key 1 now rests, so the next request goes straight to key 2.
    expect((await generateText({ model, prompt: "hi", maxRetries: 0 })).text).toBe("From key 2.");
  });

  it("stops without calling Google when every key is over budget, so the caller uses its fallback", async () => {
    const calls: string[] = [];
    const counted = new MockLanguageModelV4({ doGenerate: async () => (calls.push("call"), { content: [{ type: "text", text: "ok" }], finishReason: { unified: "stop", raw: undefined }, usage, warnings: [] }) });
    const model = rotatingModel([{ id: "m#key1", model: counted }], createPool(["m#key1"], { perMinute: 1, perDay: 1 }));
    await generateText({ model, prompt: "hi", maxRetries: 0 });
    await expect(generateText({ model, prompt: "hi", maxRetries: 0 })).rejects.toThrow(AiBudgetError);
    expect(calls).toHaveLength(1);
  });

  it("passes other errors straight through (a bad request is not a reason to burn another key)", async () => {
    const broken = new MockLanguageModelV4({ doGenerate: async () => Promise.reject(new Error("bad prompt")) });
    const fine = says("never used");
    const model = rotatingModel([{ id: "m#key1", model: broken }, { id: "m#key2", model: fine }], createPool(["m#key1", "m#key2"], { perMinute: 10, perDay: 10 }));
    await expect(generateText({ model, prompt: "hi", maxRetries: 0 })).rejects.toThrow("bad prompt");
    expect(fine.doGenerateCalls).toHaveLength(0);
  });
});
