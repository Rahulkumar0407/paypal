# lib/ai/

**Owner:** Person 1. Task P1-10 (Ask chat, explanations, reminder drafts). Person 2 copies the AI section into the main README (P2-7).

**What goes here:** everything that calls a language model. AI never calculates money and never calls PayPal
(AGENTS.md sections 3 and 5). Every function falls back to calculated numbers or a template when the model fails.

- `model.ts` is the ONLY file allowed to import a provider package (`@ai-sdk/google`, `@openrouter/ai-sdk-provider`).
  Switching provider means editing only this file. ESLint enforces it.

**Must export (from `index.ts`):**
- `answerQuestion(storeId, question): Promise<ChatAnswer>`: read-only tools backed by `lib/forecast` (`canAfford`, ...).
- `draftReminder(input): Promise<ReminderDraft>`: zod-validated; code inserts the checkout link.
- `explainReceipt(receipt): Promise<string | null>`.
- `getModelId()`, `isAiConfigured()`, `SUGGESTED_QUESTIONS`.

**Now:** stubs returning `mocks/ask.ts` and `mocks/recovery.ts`, marked `TODO(Person 4)`. No provider is imported yet.
