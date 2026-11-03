# lib/paypal/

**Owner:** Person 1. Task P1-9 (done; Person 2 switches it on with `SWITCH-ON.md`). Rules: AGENTS.md section 6.

**What goes here:** the ONE place that talks to PayPal: `client.ts` (a small typed REST wrapper, no SDK) and
`webhook.ts` (verify, then read the event). ESLint only lets `lib/guard`, `app/api/paypal` and `app/store` import it.

**Modes (from the environment, no code change):** `sandbox` when `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` are set;
`fake` when `PAYPAL_FAKE=1` (in-memory, for tests and offline demos; refused in production); otherwise `off`, where every
call throws `PayPalNotConfiguredError` and the screens say "PayPal isn't set up yet". Only
`https://api-m.sandbox.paypal.com` is ever called.

**Exports:** `createOrder` (custom_id = storeId, reference_id = our order id), `createCheckoutForOrder` (a fresh link
for an unpaid order: the Guard's executor uses it for reminders), `getOrder`, `captureOrder` (gross, fee, net; safe to
call twice), `refundCapture`, `createPayout`, `verifyWebhookSignature`, `handleWebhook`, `normalizeEvent`,
`paypalMode`, and the fake checkout helpers. Every call that creates or changes something sends `PayPal-Request-Id`
from the action's idempotency key (which carries the demo run id).

**Agent Toolkit (D8):** not used. Our calls are five plain endpoints; a typed wrapper keeps them testable and keeps
PayPal away from any AI code, which the toolkit's tool-calling design invites.

Tests: `client.test.ts` (mocked fetch: request ids, sandbox-only, fake refused in production, capture breakdown, fake
flow), `webhook.test.ts` (bad signature changes nothing, an event applied once).
