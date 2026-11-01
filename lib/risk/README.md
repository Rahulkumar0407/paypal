# lib/risk/

**Owner:** Person 4. Tasks P4-3 (risk check) and P4-4 (extras).

**What goes here:** deterministic risk flags (unusual amount, brand-new buyer with a big order, repeated failed
attempts) that PROPOSE `HOLD_ORDER` through the Guard, and the extras: price-rise alert, slow-week warning,
quiet when unsure (no alerts when forecast confidence is low).

**Must export (from `index.ts`):** `listRiskFlags(storeId)`, `proposeHold(storeId, orderId)`, `getAlerts(storeId)`.

**Now:** stubs returning `mocks/risk.ts` and `mocks/guard.ts`, marked `TODO(Person 4)`.
