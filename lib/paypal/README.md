# lib/paypal/

**Owner:** Person 2. Tasks P2-1 (checkout) and P2-2 (webhooks). Rules: AGENTS.md section 6.

**What goes here:** the ONE file that talks to PayPal, `client.ts`. Sandbox only. Every call that creates or changes
something sends `PayPal-Request-Id`. ESLint only lets `lib/guard`, `app/api/paypal` and `app/store` import this module.

**Must export (from `index.ts`):** `createOrder`, `getOrder`, `captureOrder` (returns gross, fee, net),
`refundCapture`, `createPayout`, `verifyWebhookSignature`, `PAYPAL_SANDBOX_BASE`.

**Now:** stubs with fake PayPal ids and no network calls, marked `TODO(Person 2)`. Add the fake mode
(`PAYPAL_FAKE=1`, refused in production) here for the e2e test.
