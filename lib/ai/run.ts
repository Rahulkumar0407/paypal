import { generateText, Output, type LanguageModel } from "ai";
import type { z } from "zod";

/**
 * The two ways tmrw calls a model: a short text, or a zod-checked object. Both give up quietly (null) on any
 * failure or after a time limit, so the caller shows its template instead. AI failure is never app failure.
 */

/**
 * Gemini's free tier answers in 1 to 16 s, unevenly. No page waits for these calls (explanations stream in through
 * Suspense, reminder drafts run after the response), so the limit can be generous without slowing anything.
 */
const TIME_LIMIT_MS = 20_000;

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

/**
 * Remembers AI texts for a day, keyed by the facts they were written from. Every visitor's copy of the demo store has
 * the same facts at the same story step, so after the first visitor, the rest cost no Gemini requests (and the demo
 * replays word for word).
 */
const memories: Map<string, unknown>[] = [];

/** `keep` decides what is worth remembering: only what the AI actually wrote, never a fallback (so it's retried). */
export function memo<T>(limit = 500, ttlMs = 24 * 60 * 60 * 1000) {
  const entries = new Map<string, { value: T; at: number }>();
  memories.push(entries);
  return async (key: string, work: () => Promise<T>, keep: (value: T) => boolean = () => true): Promise<T> => {
    const hit = entries.get(key);
    if (hit && Date.now() - hit.at < ttlMs) return hit.value;
    const value = await work();
    if (keep(value)) entries.set(key, { value, at: Date.now() });
    if (entries.size > limit) entries.delete(entries.keys().next().value!);
    return value;
  };
}

/** Tests only: forget every remembered AI text. */
export function forgetAiTextsForTests(): void {
  for (const m of memories) m.clear();
}
