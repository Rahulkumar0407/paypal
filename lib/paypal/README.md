# lib/paypal/

**Owner:** Person 1. Task P1-9 (checkout and webhooks; Person 2 switches it on in P2-3). Rules: AGENTS.md section 6.

**What goes here:** the ONE file that talks to PayPal, `client.ts`. Sandbox only. Every call that creates or changes
something sends `PayPal-Request-Id`. ESLint only lets `lib/guard`, `app/api/paypal` and `app/store` import this module.

**Must export (from `index.ts`):** `createOrder`, `getOrder`, `captureOrder` (returns gross, fee, net),
`refundCapture`, `createPayout`, `verifyWebhookSignature`, `PAYPAL_SANDBOX_BASE`.

**Now:** stubs with no network calls. Since P1-7 the fake ids are made from the idempotency key, so every action
gets its own PayPal id; `getOrder` always says CREATED. P1-9 makes it real and adds the fake mode
(`PAYPAL_FAKE=1`, refused in production) for the e2e test.
