/**
 * The ONE file with AI provider setup (AGENTS.md section 5). Owner: Person 1.
 * No other file imports a provider package (ESLint enforces it).
 *
 * Gemini through the AI SDK (`@ai-sdk/google`). From the environment:
 *   AI_MODEL                       one model id, or several separated by commas, tried in that order.
 *                                  Default (.env.example): gemini-3.5-flash-lite, the free model with the most room.
 *   GOOGLE_GENERATIVE_AI_API_KEY   one key, or several separated by commas; requests are shared between them.
 *   AI_MAX_REQUESTS_PER_MINUTE / AI_MAX_REQUESTS_PER_DAY
 *                                  the app's own budget per key and model (default 8 and 200), kept under Google's
 *                                  free limits. Over budget, every AI feature uses its plain fallback.
 * See pool.ts for how keys are shared and rested.
 *
 * To switch to OpenRouter, edit only this file: build the slots with
 *   createOpenRouter({ apiKey })(modelId)   (from "@openrouter/ai-sdk-provider")
 * instead of createGoogle, reading OPENROUTER_API_KEY. AI_MODEL is then an OpenRouter id, e.g. "google/gemini-3.5-flash-lite".
 */
import { createGoogle } from "@ai-sdk/google";
import { defaultSettingsMiddleware, wrapLanguageModel, type LanguageModel } from "ai";
import { getEnv } from "@/lib/shared/env";
import { createPool, rotatingModel } from "./pool";

const list = (value: string | undefined) => (value ?? "").split(",").map((v) => v.trim()).filter(Boolean);

/** The first configured model id, or null when AI is not set up (the app must still work). */
export function getModelId(): string | null {
  const env = getEnv();
  const models = list(env.AI_MODEL);
  return models.length > 0 && list(env.GOOGLE_GENERATIVE_AI_API_KEY).length > 0 ? models[0]! : null;
}

export function isAiConfigured(): boolean {
  return getModelId() !== null;
}

/**
 * Gemini 3 and later "think" before answering by default, which took 11-16 s per reply and ran past the app's time
 * limits. NeverShort's AI only words and explains numbers code already calculated, so it needs the least thinking.
 * Gemini 3+ takes a thinking level; 2.5 Flash models take a budget (0 = off). Other models are left as they are.
 */
function thinkingFor(modelId: string): { thinkingLevel: "minimal" } | { thinkingBudget: 0 } | null {
  const version = /^gemini-(\d+(?:\.\d+)?)/.exec(modelId)?.[1];
  if (!version) return null;
  if (Number(version) >= 3) return { thinkingLevel: "minimal" };
  if (version === "2.5" && modelId.includes("flash")) return { thinkingBudget: 0 };
  return null;
}

function quick<M extends Parameters<typeof wrapLanguageModel>[0]["model"]>(model: M, modelId: string) {
  const thinkingConfig = thinkingFor(modelId);
  if (!thinkingConfig) return model;
  return wrapLanguageModel({ model, middleware: defaultSettingsMiddleware({ settings: { providerOptions: { google: { thinkingConfig } } } }) });
}

const cache = globalThis as unknown as { nevershortModel?: { signature: string; model: LanguageModel } };

/** One model that shares requests across every key and model, within budget. Null when AI is not set up. */
export function getLanguageModel(): LanguageModel | null {
  const env = getEnv();
  const models = list(env.AI_MODEL);
  const keys = list(env.GOOGLE_GENERATIVE_AI_API_KEY);
  if (models.length === 0 || keys.length === 0) return null;
  // Rebuilt only when the settings change, so the budget counts survive between requests.
  const signature = JSON.stringify([models, keys.map((k) => k.slice(-6)), env.AI_MAX_REQUESTS_PER_MINUTE, env.AI_MAX_REQUESTS_PER_DAY]);
  if (cache.nevershortModel?.signature === signature) return cache.nevershortModel.model;
  // Model first, then key: every key's quota for the first model is used before falling back to the next model.
  const slots = models.flatMap((modelId) => keys.map((apiKey, i) => ({ id: `${modelId}#key${i + 1}`, model: quick(createGoogle({ apiKey })(modelId), modelId) })));
  const pool = createPool(
    slots.map((s) => s.id),
    { perMinute: env.AI_MAX_REQUESTS_PER_MINUTE, perDay: env.AI_MAX_REQUESTS_PER_DAY },
  );
  const model = rotatingModel(slots, pool);
  cache.nevershortModel = { signature, model };
  return model;
}
