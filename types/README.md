# types/

**Owner:** shared. Created by Person 1 in the foundation; after that, every change goes through Person 2.

**What goes here:** the data shapes that cross module boundaries. Modules talk to each other only through these
types (AGENTS.md section 9). One file: `index.ts`.

**Must export:** `Cents`, `IsoDate`, `StoreId`, `ForecastDay`, `Forecast`, `Due`, `Shortfall`, `FixOption`,
`AffordabilityCheck`, `ActionProposal` (one shape per `ActionType`), `GuardDecision` with `RuleResult[]` (all 8 rules),
`Receipt`, `InboxItem`, `RiskFlag`, `Alert`, `ChatAnswer`, `RecoveryCandidate`, `OutboxMessage`, `PayPalCapture`, and the
store shapes (`Product`, `Order`, `StoreSettings`).

**Rules:** money is `Cents` (integer). Dates are `IsoDate` ('YYYY-MM-DD'). No functions here, only types.
To change a type: write the exact diff and why, and hand it to Person 2.
