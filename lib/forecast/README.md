# lib/forecast/

**Owner:** Person 1. Tasks P1-6 (payment detection, 14-day forecast) and P1-8 (fix-the-gap maths).

**What goes here:** recurring-payee detection, the 14-day cash forecast, fix-the-gap options, "can I afford" checks.
Deterministic code only: no AI. All money in cents, "today" from `lib/shared/clock`.

**Must export (from `index.ts`):**
- `getForecast(storeId): Promise<Forecast>`: 14 days from today, first shortfall, confidence.
- `getDues(storeId): Promise<Due[]>`: known money out, each with `readyCents`.
- `getRecurringPayees(storeId)`, `confirmRecurringPayee(storeId, payeeId)`.
- `getFixOptions(storeId): Promise<FixOption[]>`: at most 3; set-aside within the 30% cap; gap loan simulated.
- `simulateAction(storeId, proposal): Promise<Forecast>`: used by Guard rule 6.
- `canAfford(storeId, amountCents, date): Promise<AffordabilityCheck>`: used by Ask chat as a tool.
- `buildHeadline(forecast): Headline`: **already real** (code templates, tested in `headline.test.ts`).

**Now:** every function except `buildHeadline` is a stub returning fake data from `mocks/forecast.ts` and
`mocks/fixes.ts`, marked `TODO(Person 3)`.
