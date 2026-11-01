# components/ask/

**Owner:** Person 4. Task P4-1.

**What goes here:** the Ask chat UI (client component) that talks to `app/api/ai`. Answers show the calculated
facts under the sentence, labelled by what they are ("Worked out from your forecast"), never "AI-powered".
When the model fails, show the calm fallback with the numbers.

**Must export:** `AskPanel({ suggestions, sample, initial })` (props may change with the real API).

**Now:** a placeholder that shows the sample answer from `mocks/ask.ts`, marked `TODO(Person 4)`.
