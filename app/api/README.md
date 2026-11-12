# app/api/

Routes are thin: read the visitor's store id with `getVisitorStoreId()` (lib/demo), call the module, return JSON.
Everything a visitor does happens on their own copy of the sample shop.

| Route | What it does |
|-------|--------------|
| `GET /api/health` | One `SELECT 1`, never cached; `200` or `503` without a database. The uptime pinger opens it (keeps Render awake, stops Supabase pausing). Also answers `HEAD` |
| `GET /api/ping` | No database at all: a lightweight check for uptime monitors. Also answers `HEAD` |
| `POST /api/paypal/webhook` | PayPal webhooks: verifies the signature first (a bad one changes nothing), stores each event id once, finds the visitor's copy from `custom_id`. Handles `CHECKOUT.ORDER.APPROVED` and `PAYMENT.CAPTURE.COMPLETED` / `DENIED` / `REFUNDED`. Excluded from the visitor cookie in `proxy.ts` |
| `GET /api/forecast` | The visitor's 30-day forecast and headline |
| `GET /api/guard` | The visitor's approval inbox and decisions. `POST` answers `405`: proposals are made on the server by tmrw's own screens and agents, never from a browser |
| `GET /api/recovery` | Unpaid and abandoned checkouts the reminder helper would act on (`findRecoveryCandidates`) |
| `GET /api/risk` | Risk flags on recent orders (`listRiskFlags`) |
| `POST /api/ai` | Ask: one question, answered from the visitor's own numbers through read-only tools. Rate-limited per visitor in lib/ai |
| `POST /api/demo/reset` | Resets the calling visitor's copy and redirects to `/demo`. The `/demo` page resets through a server action that calls the same `resetStore` |
| `GET /api/auth/verify-email` | Confirms a merchant's email address from the link sent at sign-up |
