# lib/forecast/

**Owner:** Person 1. Tasks P1-6 (payment detection, 14-day forecast: done) and P1-8 (fix-the-gap maths).

**What goes here:** regular payment detection, the 14-day cash forecast, "can I afford" checks, what-ifs for the
Guard, fix-the-gap options. Deterministic code only: no AI. All money in cents, "today" from `lib/shared/clock`.

## Files

| File | What it does |
|------|--------------|
| `detect.ts` | Pure. Finds a payee's pattern from past payments; the plain-words summary. |
| `engine.ts` | Pure. Rows in, forecast out: balance, weekday averages, confidence, the day-by-day run, what-ifs. |
| `load.ts` | Reads one store's rows (7 queries, once per request). No database: uses the demo seed in memory. |
| `headline.ts` | The home screen's sentence (code templates). |
| `index.ts` | The public API below. |

Tests: `detect.test.ts`, `engine.test.ts` (fixed round numbers), `demo-story.test.ts` (the seed gives the exact
`DEMO.md` numbers), `headline.test.ts`.

## Public API (`@/lib/forecast`)

- `getForecast(storeId)`: 14 days from today, first shortfall, confidence.
- `getDues(storeId)`: every payment in the next 35 days, each with `readyCents`.
- `getRecurringPayees(storeId)`: regular payees found from history (`DETECTED`) and confirmed ones.
- `confirmRecurringPayee(storeId, payeeId)`: saves the payee's next payments (35 days) as dues.
- `dismissRecurringPayee(storeId, payeeId)`: "Not regular"; its payments leave the forecast.
- `simulateAction(storeId, proposal)`: the forecast if a Guard proposal ran (rule 6). Throws if it names a payment
  that isn't there, so the Guard fails closed.
- `canAfford(storeId, amountCents, date)`: affordable when no day from `date` on ends below the minimum. Throws
  `RangeError` for a past date, more than 35 days out, or an amount of $0 or less.
- `getFixOptions(storeId)`: **still the stub** (`mocks/fixes.ts`) until P1-8.
- `previewDemoForecast(scenario)`: the demo store's real forecast in memory, for `/design` and tests.
- `buildHeadline(forecast)`.

## How the forecast works

- **Balance at the start of today:** the store's opening balance plus every ledger entry before today.
- **Money in:** the average net sales (after PayPal's fee) for that weekday over the last 8 weeks, counting days
  with no sales as $0. Money that already arrived today is added on top (a recovered order).
- **Money out:** scheduled and moved dues, plus the next payments of payees found from history but not confirmed
  yet. A payee the owner dismissed is left out. Confirming writes the same payments as dues, so the numbers
  don't jump.
- **Day state:** short below the minimum balance, tight within the margin above it, otherwise covered.
  `shortByCents` = minimum − closing.
- **Ready:** each day's money above the minimum goes to its payments in order: already paid, bills, loans, the
  supplier, then the owner's own transfer.
- **Confidence:** from how much weekly sales swung over the last 8 weeks (sample standard deviation over the
  average): high up to 20%, medium up to 35%, low above that or with fewer than 4 weeks of history.

## Detection

At least 3 past payments to the same payee, each within 15% of the median amount, with steady gaps: the same
whole number of weeks on the same weekday, monthly within 2 days of the same day of the month, or every N days
within a day. A pattern whose last payment is more than one and a half cycles ago has stopped.

## Contracts for the other tasks

- **P1-9 (checkout, webhooks):** a capture writes a `SALE` ledger entry dated today with the net amount. The
  forecast counts it once, on top of today's expected sales.
- **P1-7 (executor):** `SET_ASIDE` saves a `SetAside` row (the forecast keeps its total back from the owner's
  transfers between its start and the day it's for). `GAP_LOAN` saves a `GapLoan` row and no ledger entry (the
  forecast counts both legs from the row). `MOVE_PAYMENT` and `PAY_SUPPLIER` on a found-but-unconfirmed payment
  create the `Due` row with id `<payeeId>_due_<date>` (`projectedDueId`); the forecast then stops projecting that
  date. A payment that went out today is a ledger `OUT` entry dated today.
- **P1-11 (risk):** a `PENDING` order is not counted until PayPal captures it; one on risk hold shows as
  `heldInCents` on today. If pending orders should count while not held, change `inputFromRows` and retune the
  seed (the risky $567 order would otherwise cover the 12th).
