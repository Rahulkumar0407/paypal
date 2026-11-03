# lib/ai/

**Owner:** Person 1. Task P1-10 (done). Person 2 copies the AI section into the main README (P2-7).

**What goes here:** everything that calls a language model. AI never calculates money and never calls PayPal
(AGENTS.md sections 3 and 5). Every function falls back to calculated numbers or a template when the model is off,
slow, wrong or failing, so AI failure is never app failure.

| File | What it does |
|------|--------------|
| `model.ts` | The ONLY provider import. Gemini through the AI SDK (`@ai-sdk/google`), model from `AI_MODEL` (default `gemini-3.5-flash`). Switching to OpenRouter means editing only this file (instructions inside). |
| `ask.ts` | Ask chat. The model may only answer through four read-only tools backed by lib/forecast: `getForecast`, `listDues`, `canAfford(amountDollars, date)`, `listRecentPayments`. Code checks the answer; the facts under it are code-built. `plainAnswer` answers the same questions without AI. |
| `checks.ts` | Voice rules (no `!`, no emoji, banned words) and "no number that wasn't given". |
| `reminder.ts` | The reminder draft (structured output, zod-checked, one `{checkout_link}`, no amounts) and its template. |
| `explain.ts` | One line under the headline on why the short day is short, and one under each found payment on what it was found from. Templates as fallback; remembered for an hour. |
| `limit.ts` | Per-visitor limit: 8 AI answers in 10 minutes, 40 a day. Over it, answers come from code with a note. |
| `run.ts` | The model calls, with an 8-second limit and one retry. |

Labels follow AGENTS.md: "Written for you from your forecast, and checked", never "AI-powered".

Tests: `ask.test.ts` (five sample questions against the demo forecast, including step 6; AI answers kept only when
their numbers come from the tools), `checks.test.ts`, `reminder.test.ts`, `explain.test.ts`, `limit.test.ts`. They use
the AI SDK's mock model: no network.
