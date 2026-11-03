/**
 * lib/ai: Ask chat, explanations and reminder drafts. Owner: Person 1.
 * AI never calculates money and never calls PayPal (AGENTS.md sections 3 and 5): it answers through read-only tools
 * that return numbers calculated by lib/forecast, and code checks every word it writes. Every function falls back to
 * calculated numbers or a template when the model is off, slow, wrong or failing.
 */
import type { ChatAnswer, Forecast, RecurringPayee, ReminderDraft, StoreId } from "@/types";
import { canAfford, getDues, getForecast, getPatternEvidence, listRecentPayments, type PatternEvidence } from "@/lib/forecast";
import { today } from "@/lib/shared/clock";
import { answerWith, type AskData } from "./ask";
import { explainRegularPayment as explainPayee, explainShortfall as explainGap } from "./explain";
import { allowAiAnswer } from "./limit";
import { getLanguageModel } from "./model";
import { draftReminder as draft, type DraftInput } from "./reminder";

export { getModelId, isAiConfigured } from "./model";
export { SUGGESTED_QUESTIONS, type AskData } from "./ask";
export { reminderTemplate, type DraftInput } from "./reminder";
export { regularPaymentTemplate, shortfallTemplate } from "./explain";

function liveData(storeId: StoreId): AskData {
  return {
    today: today(),
    forecast: () => getForecast(storeId),
    dues: () => getDues(storeId),
    canAfford: (amountCents, date) => canAfford(storeId, amountCents, date),
    recentPayments: () => listRecentPayments(storeId),
  };
}

const LIMIT_NOTE = "You've asked a lot in a few minutes, so this answer comes straight from your numbers.";

/** Answers an owner's question from their own numbers. Rate-limited per visitor; never throws for an AI problem. */
export async function answerQuestion(storeId: StoreId, question: string): Promise<ChatAnswer> {
  const model = getLanguageModel();
  const note = model && !allowAiAnswer(storeId) ? LIMIT_NOTE : undefined;
  return answerWith(question, liveData(storeId), model, note);
}

/** A drafted reminder (checked by code), or the template. Code inserts the link at {checkout_link}. */
export async function draftReminder(input: DraftInput): Promise<ReminderDraft> {
  return draft(input, getLanguageModel());
}

/** One line on why the first short day is short, shown under the headline. Null when nothing is short. */
export async function explainShortfall(forecast: Forecast): Promise<string | null> {
  return explainGap(forecast, getLanguageModel());
}

/** One line per found payee on what the pattern rests on, keyed by payee id. */
export async function explainRegularPayments(storeId: StoreId, payees: RecurringPayee[]): Promise<Record<string, string>> {
  const evidence = new Map<string, PatternEvidence>((await getPatternEvidence(storeId).catch(() => [])).map((e) => [e.payeeId, e]));
  const model = getLanguageModel();
  const pairs = await Promise.all(payees.map(async (p) => [p.id, evidence.has(p.id) ? await explainPayee(p, evidence.get(p.id)!, model) : null] as const));
  return Object.fromEntries(pairs.filter((x): x is [string, string] => x[1] !== null));
}
