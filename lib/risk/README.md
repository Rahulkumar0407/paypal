# lib/risk/

**Owner:** Person 1. Task P1-11.

**What goes here:** the risk check and the alerts.

- The score itself is `lib/shared/risk.ts` (pure, fixed rules): an unusual amount (3 times the usual order or more),
  a brand-new buyer's big first order, 3 or more failed attempts. It's in lib/shared because the forecast uses it too:
  a flagged pending order is never counted as money in until the owner clears it.
- `runRiskCheck(storeId)`: for each flagged pending or failed order not yet held or proposed, saves its RiskFlag rows
  and submits a HOLD_ORDER to the Guard, with one line on why (`lib/ai` `explainRisk`, template fallback). Approvals
  runs it when it opens. "Hold it" holds the order; "It's fine, count it" clears it.
- `listRiskFlags`, `proposeHold`, `getAlerts` (price rise on a bill, slow week; none when the forecast's confidence is low).

Tests: `alerts.test.ts`; the score's tests are `lib/shared/risk.test.ts`.
