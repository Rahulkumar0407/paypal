# NeverShort

A money co-pilot for a small online store. It makes sure the store gets paid, stays safe from risky orders, and
always has money ready for its next supplier order or bill. AI agents only propose; a deterministic **Margin Guard**
approves, escalates or blocks every action that touches money, and prints a receipt saying why.

Built for the PayPal AI Hackathon 2026. Demo store: Loop Audio, a small headphone shop. All history is simulated,
and payments use the PayPal sandbox.

> TODO(Person 2, P2-4): the full README: architecture, PayPal sandbox setup, what's simulated, and the
> AI section from `lib/ai/README.md`. The quick start below is enough to run the foundation.

## Quick start

```bash
nvm use                 # Node 22
npm ci
cp .env.example .env    # add DATABASE_URL and DIRECT_URL from Supabase (optional for a first look)
npm run db:migrate      # only with a database
npm run db:reset        # only with a database: loads the demo store
npm run dev             # http://localhost:3000
```

| Page | What it shows |
|------|---------------|
| `/` | The forecast sentence, the 14-day money strip, ways to fix a gap, the money calendar |
| `/fix` | Fix the gap: up to three fixes, each sent to the Margin Guard, with the decision as a referee card |
| `/approvals` | Escalations waiting for the owner (Approve / Decline), recent decisions, the simulated outbox |
| `/receipts`, `/receipts/<id>` | Every Guard decision, newest first, filterable; one receipt printed in full |
| `/dues`, `/ask`, `/dashboard`, `/settings` | The rest of the owner's app (settings is the short setup form) |
| `/demo` | The demo guide: the six story steps, the sandbox buyer login, and a reset for your own copy |
| `/store` | The buyer's side: the Loop Audio shop |
| `/design` | The design system, with every element on fake data |

## Hosting

- **App:** Render web service in Frankfurt. The public link goes in `APP_URL` once it exists (until then
  `APP_URL=http://localhost:3000`).
- **Database:** Supabase Postgres in Paris (`eu-west-3`). The app uses the pooled URL; migrations use the direct URL.
- **Health check and uptime:** a free uptime pinger opens `GET /api/health` every 10 minutes. That keeps the Render
  service awake and stops Supabase pausing the project. The route runs one `SELECT 1`, is never cached, and answers
  `200 {"ok":true,...}` or `503` when the database is missing or unreachable. It also answers `HEAD`.

The app installs to a phone's home screen (manifest, icons, full-screen on iPhone). Its service worker only shows an
offline page; it never caches pages or data, so a reset always shows fresh numbers.

## PayPal without keys

The sandbox app isn't created yet, and the app runs without it: with the `PAYPAL_*` keys empty, `/demo` says
"PayPal isn't set up yet", checkout is switched off and nothing calls PayPal. `PAYPAL_FAKE=1` turns on the fake
PayPal mode used by tests (refused in production).

## Built with

**AI tools used to build it**

| Tool | Maker | Used for |
|------|-------|----------|
| Claude Code | Anthropic | Person 1's coding agent: foundation, design system, owner screens, docs |
| Gemini | Google | Coding agent, and the runtime model behind the AI features (through the AI SDK, `@ai-sdk/google`) |
| _To add_ | | Each teammate adds the agent they use here |

**Inside the app at runtime:** Google Gemini through the AI SDK (package `ai`, `@ai-sdk/google`), for finding
patterns, drafting reminders and the Ask chat. AI never calculates money and never calls PayPal (see `AGENTS.md`).

**Stack and services**

- PayPal sandbox: Orders v2, Webhooks, Payments (refunds), Payouts
- Next.js 16, React 19, TypeScript 6, Tailwind CSS 4
- Prisma 7 with Supabase Postgres; hosted on Render
- AG Grid Community and AG Charts Community (planned for the laptop dashboard and forecast chart)
- zod 4, Vitest 5, Playwright, ESLint 9
- Fonts: Fraunces, Inter, JetBrains Mono

## Checks

```bash
npm run check   # lint + typecheck + unit tests (runs on every pull request)
npm run e2e     # Playwright smoke tests on phone and laptop sizes
```

## Team rules

Read `AGENTS.md` (rules for every AI coding agent), `PLAN.md` (tasks) and `CONTRIBUTING.md`.

MIT licensed.
