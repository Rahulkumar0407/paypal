# lib/recovery/


**What goes here:** the Recovery agent (the "reminder helper"). It finds abandoned or failed checkouts and PROPOSES
reminders. It never sends anything: every proposal goes to the Margin Guard (`lib/guard`), and the Guard's executor
creates the fresh PayPal link and writes approved reminders to the simulated outbox.

**Exports (from `index.ts`):**
- `findRecoveryCandidates(storeId)`: abandoned and failed orders (abandoned first, newest first), with consent and
  reminders sent in the last 48 hours. Deterministic query, no AI.
- `proposeReminder(storeId, orderId)`: a SEND_REMINDER proposal with the next sequence, its idempotency key and the
  drafted message (`draft.ts` template).
- `runRecoveryAgent(storeId)`: one first reminder per unfinished checkout not yet handled, each submitted to the Guard.
  The Approvals page runs it when it opens.
- `proposeFollowUp(storeId, orderId)`: the next reminder for the same order ("Send a follow-up"), judged by the Guard.
  Story step 4: after the order is paid, it's blocked by rule 1.
- `listOutbox(storeId)`: the simulated outbox, newest first.

Tests: `draft.test.ts` (wording and voice rules).
