# lib/store/


**What goes here:** the visitor's store data: the catalogue, recent orders, the settings, and payment records.
lib/store never calls PayPal: the store routes, the webhook route and the Guard's executor call PayPal, then record
what it said here.

**Exports (from `index.ts`):** `listProducts`, `listRecentOrders`, `getStoreSettings`; `startStoreCheckout`,
`recordAttempt`, `findAttempt`, `recordApproval`, `recordCapture`, `recordDenied`, `recordCancelled`, `getPaidOrder`,
`applyPayPalEvent` (stores the webhook event id once, then applies it).

**Payments:** each PayPal checkout is a `PaymentAttempt` row (an order can have several: the store checkout, then a
link in each reminder). What an event does is in `transitions.ts`, pure, so the buyer's return and the webhook can
arrive in either order, or twice, with the same result. A capture puts what arrived after PayPal's fee in the ledger
(dated today) once; the forecast counts it.

Tests: `transitions.test.ts`.
