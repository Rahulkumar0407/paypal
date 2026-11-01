# app/api/

Each route belongs to the owner of the module it serves (AGENTS.md section 10). Routes are thin: read the visitor's
store id with `getVisitorStoreId()` (lib/demo), call the module, return JSON.

| Route | Owner | Now |
|-------|-------|-----|
| `GET /api/health` | Person 1 | Real: one `SELECT 1`. The uptime pinger opens it every 10 minutes (keeps Render awake, Supabase from pausing). Also answers HEAD |
| `POST /api/demo/reset` | Person 3 | Real: resets the calling visitor's copy, redirects to `/demo` |
| `GET /api/forecast` | Person 3 | Stub data |
| `GET /api/recovery` | Person 3 | Stub data |
| `GET` / `POST /api/guard` | Person 2 | GET stub data; POST returns 501 until P2-3 |
| `POST /api/paypal/webhook` | Person 2 | 501 until P2-2 (excluded from the visitor cookie in `proxy.ts`) |
| `POST /api/ai` | Person 4 | Stub answer; validates `{ question }` |
| `GET /api/risk` | Person 4 | Stub data |
