# lib/recovery/

**Owner:** Person 1. Task P1-8.

**What goes here:** the Recovery agent. It finds abandoned or failed checkouts and PROPOSES reminders. It never
sends anything: every proposal goes to the Margin Guard (`lib/guard`), and the Guard's executor writes approved
reminders to the simulated outbox.

**Must export (from `index.ts`):**
- `findRecoveryCandidates(storeId): Promise<RecoveryCandidate[]>`: deterministic query, no AI.
- `proposeReminder(storeId, orderId): Promise<ActionProposal>`: next sequence number, idempotency key, AI draft via `lib/ai` `draftReminder` (template fallback).
- `listOutbox(storeId): Promise<OutboxMessage[]>`.

**Now:** stubs returning `mocks/recovery.ts` and `mocks/guard.ts` data, marked `TODO(Person 3)`.
