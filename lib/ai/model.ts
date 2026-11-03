/**
 * The ONE file with AI provider setup (AGENTS.md section 5). Owner: Person 1.
 * No other file imports a provider package (ESLint enforces it).
 *
 * Default: Google Gemini through the AI SDK (`@ai-sdk/google`), model from AI_MODEL (default in .env.example:
 * gemini-3.5-flash, which supports tool calling and structured output).
 *
 * To switch to OpenRouter, edit only this file:
 *   import { createOpenRouter } from "@openrouter/ai-sdk-provider";
 *   ...in getLanguageModel():  return createOpenRouter({ apiKey: env.OPENROUTER_API_KEY })(env.AI_MODEL);
 * and change `getModelId` to check OPENROUTER_API_KEY. AI_MODEL is then an OpenRouter id, e.g. "google/gemini-3.5-flash".
 */
import { createGoogle } from "@ai-sdk/google";
import type { LanguageModel } from "ai";
import { getEnv } from "@/lib/shared/env";

/** The configured model id, or null when AI is not set up (the app must still work). */
export function getModelId(): string | null {
  const env = getEnv();
  return env.AI_MODEL && env.GOOGLE_GENERATIVE_AI_API_KEY ? env.AI_MODEL : null;
}

export function isAiConfigured(): boolean {
  return getModelId() !== null;
}

/** The model for generateText, or null when AI is not set up. */
export function getLanguageModel(): LanguageModel | null {
  const env = getEnv();
  const id = getModelId();
  if (!id) return null;
  return createGoogle({ apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY })(id);
}
