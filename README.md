# NeverShort

A money co-pilot for a small online store. It makes sure the store gets paid, stays safe from risky orders, and
always has money ready for its next supplier order or bill. AI agents only propose; a deterministic **Margin Guard**
approves, escalates or blocks every action that touches money, and prints a receipt saying why.

Built for the PayPal AI Hackathon 2026. Demo store: Loop Audio, a small headphone shop. All history is simulated,
and payments use the PayPal sandbox.

> TODO(Person 2, P2-4): the full README: architecture, PayPal sandbox setup, "Built with", what's simulated, and the
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
| `/dues`, `/approvals`, `/receipts`, `/ask`, `/dashboard`, `/settings` | The owner's app |
| `/demo` | Demo controls: your own copy of the store and its reset |
| `/store` | The buyer's side: the Loop Audio shop |
| `/design` | The design system, with every element on fake data |

## Checks

```bash
npm run check   # lint + typecheck + unit tests (runs on every pull request)
npm run e2e     # Playwright smoke tests on phone and laptop sizes
```

## Team rules

Read `AGENTS.md` (rules for every AI coding agent), `PLAN.md` (tasks) and `CONTRIBUTING.md`.

MIT licensed.
