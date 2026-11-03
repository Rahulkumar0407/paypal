/**
 * A per-visitor limit on Ask chat, so one browser can't run up the AI bill. In memory (one server), which is enough
 * for a demo: at most 8 AI answers in 10 minutes and 40 a day per visitor. Over the limit, answers still come, from
 * code alone.
 */

const WINDOWS = [
  { ms: 10 * 60 * 1000, max: 8 },
  { ms: 24 * 60 * 60 * 1000, max: 40 },
] as const;

const seen = new Map<string, number[]>();

/** True if this visitor may have another AI answer now (and counts it). */
export function allowAiAnswer(visitor: string, now = Date.now()): boolean {
  const longest = WINDOWS.at(-1)!.ms;
  const times = (seen.get(visitor) ?? []).filter((t) => now - t < longest);
  const over = WINDOWS.some((w) => times.filter((t) => now - t < w.ms).length >= w.max);
  if (!over) times.push(now);
  seen.set(visitor, times);
  if (seen.size > 5_000) seen.delete(seen.keys().next().value!);
  return !over;
}

/** Tests only. */
export function resetLimitsForTests(): void {
  seen.clear();
}
