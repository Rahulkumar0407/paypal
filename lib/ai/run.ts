import { generateText, Output, type LanguageModel } from "ai";
import type { z } from "zod";

/**
 * The two ways NeverShort calls a model: a short text, or a zod-checked object. Both give up quietly (null) on any
 * failure or after a time limit, so the caller shows its template instead. AI failure is never app failure.
 */

const TIME_LIMIT_MS = 8_000;

export async function aiText(model: LanguageModel, system: string, prompt: string): Promise<string | null> {
  try {
    const { text } = await generateText({ model, system, prompt, timeout: TIME_LIMIT_MS, maxRetries: 1, temperature: 0.3 });
    return text.trim() || null;
  } catch (error) {
    console.error("[ai] text failed:", error instanceof Error ? error.message : error);
    return null;
  }
}

export async function aiObject<T>(model: LanguageModel, schema: z.ZodType<T>, system: string, prompt: string): Promise<T | null> {
  try {
    const { output } = await generateText({ model, system, prompt, output: Output.object({ schema }), timeout: TIME_LIMIT_MS, maxRetries: 1, temperature: 0.4 });
    const checked = schema.safeParse(output);
    return checked.success ? checked.data : null;
  } catch (error) {
    console.error("[ai] structured output failed:", error instanceof Error ? error.message : error);
    return null;
  }
}

/** Remembers recent explanations for an hour, so a page reload doesn't ask the model again (and the demo replays). */
export function memo<T>(limit = 200, ttlMs = 60 * 60 * 1000) {
  const entries = new Map<string, { value: T; at: number }>();
  return async (key: string, work: () => Promise<T>): Promise<T> => {
    const hit = entries.get(key);
    if (hit && Date.now() - hit.at < ttlMs) return hit.value;
    const value = await work();
    entries.set(key, { value, at: Date.now() });
    if (entries.size > limit) entries.delete(entries.keys().next().value!);
    return value;
  };
}
