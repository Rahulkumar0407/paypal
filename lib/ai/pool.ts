import { APICallError, wrapLanguageModel, type LanguageModel, type LanguageModelMiddleware } from "ai";

/**
 * Keeps tmrw inside the free Gemini limits. Every (model, key) pair is a slot, named "<model>#<key>", with its
 * own budget: at most `perMinute` requests in any minute and `perDay` in any 24 hours, counted here, kept under
 * Google's own limits. Models are tried in order; within a model, keys take turns (round robin), so a later model is
 * only used when every key for the earlier ones is spent. If Google still says a
 * key is used up (429), that slot rests and the request moves to the next one. When every slot is out of budget,
 * the request fails at once, without calling Google, and the caller shows its plain fallback.
 * No provider import here: model.ts builds the slots.
 */

export class AiBudgetError extends Error {
  constructor() {
    super("Every Gemini key is at its budget for now; using the plain fallback.");
    this.name = "AiBudgetError";
  }
}

export interface Limits {
  perMinute: number;
  perDay: number;
}

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

export function createPool(ids: readonly string[], limits: Limits, now: () => number = Date.now) {
  const uses = new Map<string, number[]>(ids.map((id) => [id, []]));
  const restUntil = new Map<string, number>();
  const groups: string[][] = [];
  for (const id of ids) {
    const name = id.split("#")[0]!;
    const group = groups.find((g) => g[0]!.split("#")[0] === name);
    if (group) group.push(id);
    else groups.push([id]);
  }
  const turn = new Map<string[], number>(groups.map((g) => [g, 0]));

  function free(id: string, t: number): boolean {
    if ((restUntil.get(id) ?? 0) > t) return false;
    const recent = (uses.get(id) ?? []).filter((u) => t - u < DAY);
    uses.set(id, recent);
    return recent.filter((u) => t - u < MINUTE).length < limits.perMinute && recent.length < limits.perDay;
  }

  return {
    /** The next slot with budget left, counting the use; null when every slot is spent or resting. */
    take(): string | null {
      const t = now();
      for (const group of groups) {
        const start = turn.get(group)!;
        for (let i = 0; i < group.length; i++) {
          const id = group[(start + i) % group.length]!;
          if (!free(id, t)) continue;
          uses.get(id)!.push(t);
          turn.set(group, (start + i + 1) % group.length);
          return id;
        }
      }
      return null;
    },
    /** Google said this slot is used up: leave it alone for a while. */
    rest(id: string, ms: number): void {
      restUntil.set(id, now() + ms);
    },
    /** How many requests each slot has made in the last 24 hours (for logs and tests). */
    usage(): Record<string, number> {
      const t = now();
      return Object.fromEntries(ids.map((id) => [id, (uses.get(id) ?? []).filter((u) => t - u < DAY).length]));
    },
  };
}

export type Pool = ReturnType<typeof createPool>;

/** True when Google says the key or model is out of quota (as opposed to a bad request). */
export function isQuotaError(error: unknown): boolean {
  if (APICallError.isInstance(error)) return error.statusCode === 429 || /RESOURCE_EXHAUSTED|quota/i.test(error.responseBody ?? error.message);
  return error instanceof Error && /RESOURCE_EXHAUSTED|quota exceeded|rate limit/i.test(error.message);
}

/** How long to rest a slot after a quota error: a day's quota rests an hour, a minute's quota a minute. */
export function restFor(error: unknown): number {
  const text = APICallError.isInstance(error) ? `${error.message} ${error.responseBody ?? ""}` : error instanceof Error ? error.message : "";
  return /per ?day|daily|PerDay/i.test(text) ? 60 * MINUTE : MINUTE;
}

type V4 = Parameters<typeof wrapLanguageModel>[0]["model"] & { doGenerate: (p: never) => unknown; doStream: (p: never) => unknown };

/** One model that sends each request to a slot with budget left, moving on when a slot is out of quota. */
export function rotatingModel(slots: readonly { id: string; model: V4 }[], pool: Pool): LanguageModel {
  const byId = new Map(slots.map((s) => [s.id, s.model]));
  async function attempt<T>(call: (model: V4) => PromiseLike<T>): Promise<T> {
    let lastQuotaError: unknown = null;
    for (let i = 0; i < slots.length; i++) {
      const id = pool.take();
      if (!id) break;
      try {
        return await call(byId.get(id)!);
      } catch (error) {
        if (!isQuotaError(error)) throw error;
        console.warn(`[ai] ${id} is out of quota; resting it and trying the next key.`);
        pool.rest(id, restFor(error));
        lastQuotaError = error;
      }
    }
    if (lastQuotaError) console.warn("[ai] every key tried was out of quota.");
    throw new AiBudgetError();
  }
  const middleware: LanguageModelMiddleware = {
    wrapGenerate: ({ params }) => attempt((m) => (m.doGenerate as (p: typeof params) => ReturnType<NonNullable<LanguageModelMiddleware["wrapGenerate"]>>)(params)),
    wrapStream: ({ params }) => attempt((m) => (m.doStream as (p: typeof params) => ReturnType<NonNullable<LanguageModelMiddleware["wrapStream"]>>)(params)),
  };
  return wrapLanguageModel({ model: slots[0]!.model, middleware });
}
