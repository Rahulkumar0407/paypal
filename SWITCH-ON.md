# SWITCH-ON.md: turning on the real PayPal sandbox

For Person 2. NeverShort already runs without PayPal (pages say "PayPal isn't set up yet") and in fake mode for
tests. These steps switch the same code to the real PayPal **sandbox**. No code changes: setting the two keys is the
switch. Sandbox only: the app refuses any PayPal URL other than `https://api-m.sandbox.paypal.com`.

Keep every secret out of git, logs and screenshots. Only the judges' **buyer** login may be published (`DEMO.md` and
`/demo`).

## 1. Create the sandbox app

1. Log in at https://developer.paypal.com with the team's PayPal account.
2. Open **Apps & Credentials**, make sure **Sandbox** is selected (top right), then **Create App**.
3. Name it `NeverShort`, type **Merchant**, and pick the sandbox **business** account it should use (one is made
   for you; you can create a separate one in step 2 first if you prefer).
4. Open the app and copy the **Client ID** and **Secret**. Keep them somewhere private.
5. Under the app's **Features**, make sure **Accept payments** and **Payouts** are ticked (Payouts pays the supplier).

## 2. Create the sandbox accounts

Open **Testing Tools > Sandbox Accounts**:

1. **Business account (the shop):** use the one linked to the app. Never publish its login.
2. **Judges' buyer account:** **Create account** > **Personal (buyer)**, country United States, with a PayPal balance
   of at least $1,000. Note its email and password. This is the only login we publish.
3. Send P1 the judges' buyer email and password, for `SANDBOX_BUYER` in `app/(owner)/demo/page.tsx` and `DEMO.md`.

## 3. Set the environment on Render

In the Render service's **Environment** tab, set:

| Key | Value |
|-----|-------|
| `PAYPAL_CLIENT_ID` | the app's Client ID |
| `PAYPAL_CLIENT_SECRET` | the app's Secret |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | the same Client ID |
| `PAYPAL_API_BASE` | `https://api-m.sandbox.paypal.com` |
| `APP_URL` | the Render link, e.g. `https://nevershort.onrender.com` (no trailing slash) |
| `PAYPAL_FAKE` | leave **unset** (fake mode is refused in production anyway) |
| `PAYPAL_WEBHOOK_ID` | from step 4 |

Save, and let Render redeploy. The `/demo` page's PayPal card should now say "PayPal test mode is connected."

## 4. Register the webhook

1. In the app (developer.paypal.com > Apps & Credentials > NeverShort), scroll to **Sandbox Webhooks** > **Add Webhook**.
2. Webhook URL: `<APP_URL>/api/paypal/webhook`, e.g. `https://nevershort.onrender.com/api/paypal/webhook`.
3. Tick these events:
   - `Checkout order approved` (CHECKOUT.ORDER.APPROVED)
   - `Payment capture completed` (PAYMENT.CAPTURE.COMPLETED)
   - `Payment capture denied` (PAYMENT.CAPTURE.DENIED)
   - `Payment capture refunded` (PAYMENT.CAPTURE.REFUNDED)
4. Save, copy the **Webhook ID**, set it as `PAYPAL_WEBHOOK_ID` on Render, and redeploy.

The webhook verifies every event's signature with PayPal first (a bad signature is rejected and changes nothing),
stores each event id once (repeats are ignored), and finds the visitor's copy from the order's `custom_id`.

## 5. Test one real sandbox payment

Use a private browser window so you get a fresh copy of the demo store.

1. Open `<APP_URL>/demo` and press **Reset the demo**.
2. Open **Approvals**. Maya Okafor's $72 reminder shows **Approved**, and under **Sent reminders** there's an
   **Open the PayPal checkout** button.
3. Press it. PayPal's sandbox checkout opens. Log in as the **judges' buyer** and pay.
4. You land on Loop Audio's "Paid" page: you paid $72.00, PayPal's fee, and what arrives. Note the real fee: P1 puts
   it in `DEMO.md` (it may differ from the $3.00 estimate).
5. Open Today (`/today`). Thu 12 Nov should now be about $21 short (the exact number depends on the real fee).
6. In Approvals, press **Send a follow-up** on Maya's reminder: **Blocked**, "PayPal shows order #1258 already paid".
7. Check the webhook arrived: developer.paypal.com > **Testing Tools > Webhooks events** (or Render's logs) shows a
   `PAYMENT.CAPTURE.COMPLETED` delivered with status 200.
8. With a second private window, repeat steps 1 and 2: its copy is separate, and the payment above didn't touch it.

If something fails, Render's logs show lines starting `[store]`, `[paypal]` or `[guard]` with the reason.

## Local testing without PayPal

`PAYPAL_FAKE=1` in a local `.env` (never on Render) turns on fake mode: reminders get a link to
`/store/fake-paypal`, a page that says plainly it is not PayPal, where the test buyer can pay or cancel. The whole
story then works offline, and the e2e test uses it.
