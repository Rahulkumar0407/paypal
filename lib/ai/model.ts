/**
 * The ONE file with AI provider setup (AGENTS.md section 5). Owner: Person 4.
 * Switching from Google Gemini to OpenRouter must mean editing only this file.
 *
 * TODO(Person 4, P4-1): import the provider from "@ai-sdk/google" here (only here), read
 * AI_MODEL from lib/shared/env, and export the model for generateText / streamText.
 * Check the installed AI SDK major version's docs first: do not write the API from memory.
 */
import { getEnv } from "@/lib/shared/env";

/** The configured model id, or null when AI is not set up (the app must still work). */
export function getModelId(): string | null {
  const env = getEnv();
  return env.AI_MODEL && env.GOOGLE_GENERATIVE_AI_API_KEY ? env.AI_MODEL : null;
}

export function isAiConfigured(): boolean {
  return getModelId() !== null;
}
