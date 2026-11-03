# lib/paypal/

**Owner:** Person 1. Task P1-9 (checkout and webhooks; Person 2 switches it on in P2-3). Rules: AGENTS.md section 6.

**What goes here:** the ONE file that talks to PayPal, `client.ts`. Sandbox only. Every call that creates or changes
something sends `PayPal-Request-Id`. ESLint only lets `lib/guard`, `app/api/paypal` and `app/store` import this module.

**Must export (from `index.ts`):** `createOrder`, `getOrder`, `captureOrder` (returns gross, fee, net),
`refundCapture`, `createPayout`, `verifyWebhookSignature`, `PAYPAL_SANDBOX_BASE`.

**Now:** stubs with fake PayPal ids and no network calls, marked `TODO(Person 2)`. Add the fake mode
(`PAYPAL_FAKE=1`, refused in production) here for the e2e test.
