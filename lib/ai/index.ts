/**
 * lib/ai: Ask chat, explanations and reminder drafts. Owner: Person 4.
 * AI never calculates money and never calls PayPal (AGENTS.md sections 3 and 5).
 * Every function must fall back to calculated numbers or a template when the model fails.
 * Foundation stubs by Person 1 return FAKE data from mocks/.
 */
import type { ChatAnswer, Receipt, ReminderDraft, StoreId } from "@/types";
import { mockAffordAnswer, MOCK_SUGGESTED_QUESTIONS } from "@/mocks/ask";
import { mockReminderDraft } from "@/mocks/recovery";

export { getModelId, isAiConfigured } from "./model";

export const SUGGESTED_QUESTIONS: readonly string[] = MOCK_SUGGESTED_QUESTIONS;

/** Answer an owner's question using read-only tools that return calculated numbers. */
export async function answerQuestion(storeId: StoreId, question: string): Promise<ChatAnswer> {
  // TODO(Person 4): tool calling with lib/forecast canAfford / getForecast / getDues (P4-1).
  void storeId;
  return { ...mockAffordAnswer, question };
}

export interface ReminderDraftInput {
  customerFirstName: string;
  itemNames: string[];
  storeName: string;
}

/** Draft a reminder. The checkout link is inserted later by code as {checkout_link}. */
export async function draftReminder(input: ReminderDraftInput): Promise<ReminderDraft> {
  // TODO(Person 4): structured output validated with zod; voice and amount checks (P4-2).
  void input;
  return mockReminderDraft;
}

/** One plain-words line explaining a receipt, shown under the code-built text. */
export async function explainReceipt(receipt: Receipt): Promise<string | null> {
  // TODO(Person 4): optional; return null when AI is unavailable.
  return receipt.decision.headlineReason;
}
