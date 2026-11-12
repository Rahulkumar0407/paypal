# AGENTS.md: tmrw

Rules for every AI coding agent working in this repo (Claude Code, Codex, Cursor, Gemini, Copilot or any other).
Read the whole file before your first change. If a request conflicts with this file, stop and ask before acting.

The code and package still say "NeverShort" in places; the product is now **tmrw**. Rename as you touch things.

**Hackathon:** PayPal AI Hackathon ("Build What's Next") on Devpost.

- **Deadline:** Thu 12 Nov 2026, 12:00pm PST (1:30am Fri 13 Nov in India).
- **Judged on:** Technological Implementation, Design, Potential Impact, Innovation/Idea, Presentation.
- **Requirements:** meaningful use of PayPal and of AI; a working hosted build judges can use; documentation of the
  tools used; a public repo with its licence visible; a YouTube demo video under 3 minutes.
- **Sponsors we use for real:** AG Grid + AG Charts, Render (hosting). Bryntum Calendar only if a free hackathon
  licence exists (no trial watermark on screen). Not APIMatic.

---

## 1. Start of every session

1. **Explain in plain English.** The project owner is new to team repos and to fintech. Be concrete, no jargon,
   and say honestly when an idea or sponsor tool is forced.
2. **Check versions before writing code.** Read `package.json` and use the docs for the installed major version.
   Next.js, Tailwind, Prisma, the AI SDK and AG Grid have all shipped breaking major versions recently.
   Do not write their APIs from memory.
3. **Anyone can commit.** Any team member, or their agent when its human asks, may `git add` and `git commit`. Run
   `npm run check` first and commit only if it passes. Push only when your human asks: pushing to `main` deploys.
   Never force-push, rebase or reset history that is already pushed.

---

## 2. Product brief

### What tmrw is

**"See the short day before it arrives."** A small shop's month, on one page, inside PayPal.

A shop's money month is scattered across five places: the PayPal app (sales trickle in), auto-debits (set once,
forgotten), WhatsApp (suppliers and staff asking for money), a paper calendar (rent, supplier orders, staff pay)
and the owner's head. Two big payments can land on the same day and nobody notices until that day. PayPal already
has most of this data; tmrw puts it on one page that actually helps. **It is not a typical dashboard.**

The guiding picture is a hand-drawn monthly planner with four parts:

- **Must pay:** rent, staff, suppliers, auto-debits (labelled "Auto-debit").
- **Coming in:** expected sales by day, and money people owe.
- **Want to do:** growth goals (new stock, a second oven, ads), fitted in only after every must-pay is safe.
- **Focus line:** one line for the month, for example "second oven before Christmas".

### How it works: Spot · Plan · Steer

- **Spot.** Read PayPal history and sort every payment into money in, supplier payments and regular bills. Detect
  auto-debits and flag clashes (two payments landing with rent).
- **Plan.** Draft the month page. The owner can always edit it, and tmrw learns from the edits (she moves bean
  orders to Mondays once; next month they're scheduled on Mondays).
- **Steer.** Guide the owner past short days. Never move money automatically; every payment needs the owner's tap.
  Remind customers who owe (only with their consent), suggest setting money aside, and offer a small PayPal loan as
  a last resort (part of the business model: PayPal earns the fee).

Setup asks only three questions: the least balance to keep, which payments are must-pay versus optional, and any
big plan this month. Everything else comes from history.

### Main features

1. **Month page.** The four parts above, 30 days ahead (`FORECAST_DAYS` in `lib/forecast/engine.ts`; change the
   tests with it).
2. **Today panel** (what the owner checks each morning): safe to spend now; the biggest day ahead and how ready it
   is ("$1,780 of $1,900 ready"); who owes me, with one-tap Remind; goal progress ("$320 of $1,200").
3. **The assistant edits the page instead of chatting.** The owner types an instruction or uploads a bill (photo,
   PDF or WhatsApp screenshot). tmrw shows the proposed changes on the page as dashed entries; the owner taps Keep
   or Discard. Each change is checked by code ("staff pay is still covered").
4. **Requests inbox.** Staff and suppliers send requests in the app instead of WhatsApp. AI groups repeats
   ("3 requests about the mixer"), then code checks money and timing ("buy on 27 Nov, set aside $8 a day; rent and
   staff pay stay covered"). The owner taps Add and it goes into Want to do.
5. **Bring lost payments back** (part of Steer). tmrw finds money the shop is owed but never received: unpaid
   invoices (Ivory & Vow's $240 cake), abandoned checkouts and failed payments (card declined, PayPal attempt
   dropped). It drafts a reminder with a fresh PayPal checkout link, only if the customer agreed to be contacted,
   and never twice in 48 hours. If PayPal shows the order already paid, the reminder is blocked. When the customer
   pays, the webhook confirms it and the month page updates with what actually arrived after PayPal's fee. Risky
   orders (brand-new buyer with a big order, repeated failed attempts) are held and not counted as money coming in.
6. **Already built:** Margin Guard and receipts, reminders with a real PayPal sandbox checkout, set-aside, move a
   payment, gap loan (simulated), risk holds.

### Demo story

| What | Detail |
|---|---|
| Shop | **Dunder Mifflin & Co.**, a small café-bakery that takes orders through PayPal (the pitch deck says Crumb & Co.) |
| People | Penny, the owner, minds the money. Flo, the baker, minds the flour |
| Coffee supplier | Bean There, about $400 every 10 days (2, 12, 22 Nov) |
| Oat milk supplier | Oat of Office, $180 auto-debit |
| Customer who owes | Ivory & Vow, a wedding planner; owes $240 for a tiered cake, due 18 Nov |
| Bills | Rent $1,500 on the 12th - card machine $49 (auto-debit) on the 13th - internet $60 (auto-debit) on the 3rd - oven loan $250 (auto-debit) on the 25th - staff pay $1,600 on the 28th |
| Short day | Thu 12 Nov: rent + beans = $1,900 due; $1,780 free above the $200 minimum, so $120 short |
| Fixes | Remind Ivory & Vow (fully covers it), set money aside, move the bean order, or a $120 loan at a 2% fee ($122.40 back on 13 Nov) |
| November | Must pay $4,839; about $6,900 coming in; about $2,060 left for plans. Sales about $180 a day on weekdays, $320 on weekends |

Today in the demo is Thu 5 Nov 2026. The code's seed still uses the older "Loop Audio" headphone shop; it is being
moved to this story. Names carry meaning (suppliers say what they sell); no real brands for suppliers or customers.

### Demo clock, per-visitor copies and reset

- `DEMO_TODAY=2026-11-05` (Thu 5 Nov 2026) fixes "today" for the whole app.
- **One copy per visitor.** Each visitor gets their own copy of Loop Audio. A cookie maps the browser to its own
  `storeId`, created from the seed on the first visit. Judges never see each other's actions.
- **Reset.** It restores that visitor's copy exactly and starts a new **demo run id**, so the story replays
  identically every time. It never touches other visitors' copies.
- **Webhooks find the right copy.** PayPal orders carry the visitor's `storeId` in `custom_id`, so a webhook
  updates the right copy.
- **Demo page.** The demo guide (`/demo`) walks judges through the six story steps (each marked Simulated or PayPal
  sandbox), shows the sandbox buyer login and the demo date, and has the reset button.
- **Routes.** The public landing page is `/`: what tmrw does in one sentence, how it works in three
  steps, a "Can you save Thursday?" slider judged by the real Guard rules, Maya's reminder paid on screen, and real
  receipts, all from `lib/landing` with no database. The owner's Today screen is `/today`.

---

## 3. Safety model (non-negotiable)

1. **Propose, decide, execute.** AI agents and the owner's choices create proposals. The Margin Guard decides.
   Only the Guard's executor carries out actions, and only after APPROVE, or after the owner approves an ESCALATE.
2. **No money moves without passing the Guard.** All seven action types go through it, including the ones that
   don't move money directly (reminders, holds).
3. **AI never calculates money.** All amounts, dates and forecasts come from code. AI only finds patterns, explains
   in plain words, drafts messages, and answers questions using tools that return calculated numbers.
4. **AI never calls PayPal.** Only the Guard's executor does, after APPROVE (section 6 lists the few other
   non-AI callers).
5. **AI failure is not app failure.** If an AI call fails, the app still works and shows the calculated numbers.
6. **Simulated means labelled.** Anything simulated says "Simulated" in the UI: seeded history, gap loans, the
   reminder outbox, moved payment dates.
7. **PayPal sandbox only.** Never live credentials, never the live API.

---

## 4. Margin Guard

Lives in `lib/guard/`. Plain TypeScript. No AI. Fully unit-tested.

### Action types

`SEND_REMINDER`, `SET_ASIDE`, `MOVE_PAYMENT`, `GAP_LOAN`, `PAY_SUPPLIER`, `REFUND`, `HOLD_ORDER`

### Rules

| # | Rule | Applies to | Fails when | On fail |
|---|------|------------|------------|---------|
| 1 | Already paid | SEND_REMINDER | PayPal shows the order captured. Never remind or charge for a captured order. | BLOCK |
| 2 | Consent | SEND_REMINDER | The customer has not allowed contact. | BLOCK |
| 3 | Contact frequency | SEND_REMINDER | 2 reminders were already sent for this order in the last 48 hours. | BLOCK |
| 4 | Risk hold | SEND_REMINDER, REFUND | The order is under risk hold. No recovery or refund on it without the owner. | ESCALATE |
| 5 | Duplicate action | All | An action with the same idempotency key already exists. | BLOCK |
| 6 | Minimum balance | PAY_SUPPLIER, REFUND, MOVE_PAYMENT, GAP_LOAN, SET_ASIDE | After the action, some day in the 14-day forecast is below the owner's minimum balance **and** lower than it was before the action. | BLOCK |
| 7 | Set-aside cap | SET_ASIDE | The daily set-aside is more than 30% of that day's expected sales. | BLOCK |
| 8 | Owner approval | GAP_LOAN, MOVE_PAYMENT, REFUND always; any action whose amount is over $100.00 | (always triggers when it applies) | ESCALATE |
| 9 | Total spending | PAY_SUPPLIER, REFUND, GAP_LOAN | With this action, the money these actions moved or asked for in the last 7 days (approved, done, or waiting for the owner) comes to more than $500.00. Many small actions can't add up unnoticed. | ESCALATE |

**Action amount** (rules 8 and 9): the money the action moves or asks for. Reminder: the order total. Set-aside: the total
over all its days. Hold: the order total. Move payment: the payment's amount.

### How a decision is made

- Rules are pure functions: `(proposal, context) -> PASS | FAIL | N/A` plus a plain reason. A separate loader
  gathers the context first (database rows, forecast, PayPal order status). This is what keeps rules unit-testable.
- A rule that cannot be checked (for example, PayPal is unreachable) FAILS. The Guard fails closed.
- Final decision: BLOCK if any failing rule says BLOCK; otherwise ESCALATE if any failing rule says ESCALATE;
  otherwise APPROVE.
- The headline reason is the lowest-numbered failing rule that produced the final decision.

### Idempotency

- Every proposal has an idempotency key: `<demo run id>:<action type>:<target id>:<sequence>`. The sequence is
  1 + the number of times this action type has already been executed on this target.
- A retried or double-submitted proposal reuses its key, so rule 5 blocks it. A genuinely new attempt (a second
  reminder) gets the next sequence number, so rule 3 judges it. In demo step 4 the only failing rule is "Already
  paid".
- The demo run id changes on every reset, so PayPal never replays a response from an earlier run.
- `PayPal-Request-Id` headers are derived from the action's idempotency key.

### Owner approval and execution

- ESCALATE puts the proposal in the owner's approval inbox. The owner approves or rejects it.
- Owner approval clears ESCALATE rules only. Just before executing, the executor re-runs the BLOCK rules. If one
  now fails, nothing is executed and the receipt says why.
- The executor is the only code that carries out actions (PayPal writes, saving a set-aside, moving a due date,
  recording a simulated loan, holding an order, sending a reminder to the simulated outbox).

### Receipts

Every decision saves a receipt. Receipts are append-only: later events (owner decision, execution result) are added,
never edited in. A receipt holds:

- the request: action type, target, amount, who proposed it (which agent, or the owner), any AI-drafted text;
- all 9 rules, each PASS, FAIL or N/A, with a plain reason;
- the final decision and the headline reason;
- every PayPal ID checked or created (order, capture, refund, payout batch);
- the idempotency key and timestamps (demo date and real time);
- the owner's decision and the execution result, when they happen.

---

## 5. AI rules

- Everything in section 3 applies.
- **One file.** All AI setup lives in `lib/ai/model.ts`. It reads `AI_MODEL` and builds the provider with
  `@ai-sdk/google` (the AI SDK, package `ai`). Switching to OpenRouter (`@openrouter/ai-sdk-provider`) must mean editing only
  that file. No other file imports a provider package.
- **Model.** Use a model that supports tool calling and structured output. The chosen default goes in
  `.env.example` and the README.
- **Structured output.** Agents return JSON validated with zod. Invalid output counts as a failure and uses the
  fallback.
- **Ask chat** uses tool calling. Tools are read-only and return numbers calculated by code. A tool may create a
  proposal, which then goes to the Guard like any other.
- **Deterministic screens.** The headline sentence, the money strip, receipts and every number on screen are built
  by code templates, so the demo replays identically. AI may add an explanation line underneath.
- **Drafts are checked.** AI text follows the voice rules (section 7). Code checks every draft: no exclamation
  marks, no emoji, no banned words, no amount that wasn't in the input. A failing draft falls back to a template.
- **Untrusted text.** Customer-supplied text (names, notes) goes into prompts as data, never as instructions.
- **Labels.** Name AI features by what they do ("Found from your payments", "Drafted for you"). Never "AI-powered".

---

## 6. PayPal rules

- **Sandbox only.** `lib/paypal` refuses any base URL other than `https://api-m.sandbox.paypal.com`.
- **Runs without keys.** With no sandbox keys the app still works: pages show "PayPal isn't set up yet"
  (`components/app/PayPalStatus.tsx`), checkout is switched off, and nothing calls PayPal. `PAYPAL_FAKE=1` keeps
  the fake PayPal mode for tests and offline demos; it is refused in production.
- **Switches on by itself.** Checkout and webhooks were built against fake mode first. Once `PAYPAL_CLIENT_ID` and
  `PAYPAL_CLIENT_SECRET` are set, the same code uses the real sandbox, with no code change. `SWITCH-ON.md` has the
  exact steps (keys, webhook registration, one real test payment).
- **APIs:** Orders v2 (create, get, capture), Webhooks with signature verification, Payments (refund),
  Payouts (paying the supplier).
- **One file.** All PayPal HTTP calls live in `lib/paypal/client.ts`: the official SDK or a small typed REST
  wrapper.
- **Agent Toolkit: optional.** If it fits cleanly, it may be used only as a plain library behind
  `lib/paypal/client.ts`, called by the Guard's executor. Never hand its tools to an LLM. If it doesn't fit, skip
  it.
- **Net money in.** Record what actually arrives after PayPal's fee (the capture's net amount) and use that in the
  forecast. Keep the gross amount and the fee on the record too.
- **Right copy.** Every PayPal order carries the visitor's `storeId` in `custom_id`. Webhooks use it to update the
  right copy.
- **Who may call PayPal:** the Guard's context loader (read-only status checks), the Guard's executor (writes,
  after APPROVE), the store checkout routes (the buyer creating and paying their own order), and the webhook route.
  Nothing else, and never anything under `lib/ai/`. ESLint enforces this.
- **Idempotency.** Every PayPal call that creates or changes something sends a `PayPal-Request-Id` derived from the
  action's idempotency key (which includes the demo run id).
- **Webhooks.** Verify the signature first; if it fails, reject and change nothing. Store each event id and ignore
  an event id already processed. Every handler is idempotent. Return 2xx quickly.
- **Money in.** Capturing on the buyer's return updates the order at once; the webhook confirms it. Whichever
  arrives second changes nothing.
- **Fresh links.** Create checkout links when a reminder is approved, never in the seed: approval links expire.
- **Traceability.** Store PayPal IDs on our records and on receipts.
- **Public repo.** Only the sandbox *buyer* test login may be published (in `DEMO.md` and on `/demo`). Never the
  sandbox business account, client secret or webhook id.

---

## 7. Design

The new laptop flow lives at `/` (`components/tmrw/`): login → 9-step setup → station → train arrival → window seats
(Calendar, Ventures, Insights) with a top dock (Settings, Daily brief, Requests, Pro). It follows the design handoff
in `design/tmrw-handoff/` (in the repo; the artwork the app uses is cut from it into `public/tmrw/`). The windows are
"Coming soon" placeholders until they're designed. The assistant is called Pip. Writing rules from the handoff: use a
hyphen, never a middle dot; no lightning-bolt icons. The old "banknote / money desk" screens under `/today` are going
away. These rules stay:

- **Planner, not dashboard.** Inspired by Notion and calendar apps. No KPI tiles, no acronyms (GMV, AOV, WoW), no
  past-only charts. Show one clear next action, not a list of metrics. Presenting information well is the product.
- **Colour carries meaning, and never alone.** Short is red, tight is amber, covered is green, everywhere. Every
  coloured mark also has a word (Covered, Tight, Short, Approved, Needs your OK, Blocked). Text meets WCAG AA. Blue gradients in PayPal's colours are fine.
- **Voice.** A calm, sharp shop manager: short sentences, real amounts, real dates ("Thu 12 Nov"). No exclamation
  marks. Never "unlock", "seamless", "supercharge" or "AI-powered". Money in sentences is whole dollars, shortfalls
  rounded up; receipts and tables show cents.
- **Simulated means labelled.** Anything simulated says "Simulated".
- **Layout.** Phone-first at 390px, and finished at 1280px (most judges use a laptop).
- **Motion** only when it shows something happening; respect `prefers-reduced-motion`.
- **States.** Every screen has a real empty, loading and error state.
- **Never:** glassy cards, sparkle icons, icon-in-a-circle card grids, stock
  illustrations, lorem ipsum, unlabelled charts.

---

## 8. Tech stack

- **Versions are pinned** in `package.json`. Don't upgrade a major version without the team:
  Next.js 16.4 (App Router; middleware is now `proxy.ts`), React 19.3, TypeScript 6.0 (typescript-eslint does not
  support TypeScript 7 yet), Tailwind 4.3 (CSS-first config, no `tailwind.config.js`), Prisma 7.10 (npm's `latest`
  tag points at an 8.0 release candidate: don't install it), AI SDK 7, zod 4, Vitest 5, ESLint 9, Node 22.
- **App:** Next.js (App Router) + TypeScript (strict). One app for pages and API routes.
- **UI:** Tailwind CSS. Phone-first, installable as a PWA.
- **Data:** PostgreSQL on Supabase + Prisma 7.
  - The app connects through Supabase's pooled URL (`DATABASE_URL`) via `@prisma/adapter-pg` in
    `lib/shared/db.ts`. The Prisma CLI (migrations) uses `DIRECT_URL` via `prisma.config.ts`.
  - The Prisma client is generated into `generated/prisma` (gitignored). Import it from
    `@/generated/prisma/client` only in `lib/shared/db.ts` and inside `lib/` modules; never edit `generated/`.
  - Migrations run with `prisma migrate deploy` on deploy. Never run `prisma migrate reset` against Supabase.
  - Region: Supabase in Paris (`eu-west-3`).
  - A free uptime pinger opens `/api/health` every 10 minutes. That keeps Render awake and stops Supabase pausing
    the project. `/api/health` stays fast: one `SELECT 1`, nothing else, never cached.
- **PayPal:** sandbox only (section 6).
- **AI:** AI SDK (package `ai`) with Google Gemini (`@ai-sdk/google`), model from `AI_MODEL` (section 5).
- **Tables and charts:** AG Grid Community for tables, AG Charts Community for the forecast chart. Both are
  hackathon sponsors (AG Grid has the biggest sponsor prize), so use them meaningfully and style them in our
  design. Never import `ag-grid-enterprise`, `ag-charts-enterprise` or enterprise-only features.
- **Heavy libraries stay off the phone.** AG Grid and AG Charts are laptop-only: load them with dynamic
  import on their own routes, never on phone screens.
- **Motion:** plain CSS animations everywhere, the landing page included (no animation library).
- **Tests:** Vitest for unit tests, Playwright for the end-to-end demo test.
- **Hosting:** Render web service in Frankfurt (moved to a paid plan before judging, so it never sleeps). Database
  on Supabase in Paris (above). Until the Render link exists, `APP_URL` is `http://localhost:3000`.
- **Package manager:** npm.

---

## 9. Code conventions

- **TypeScript strict.** No `any`. Parse unknown data (requests, env, AI output, PayPal responses) with zod.
- **Money is integer cents.** Use the `Cents` type from `types/`. Never floats for money. Format only for display,
  through `lib/shared/money`.
- **Dates.** Business dates are `YYYY-MM-DD` strings in the store's time zone. "Today" and "now" come only from
  `lib/shared/clock`, which honours `DEMO_TODAY`. Never call `new Date()` or `Date.now()` in business logic.
- **Module boundaries.** Each `lib/<module>/` exposes its public API from `index.ts`. Other code imports only
  `@/lib/<module>`, never deeper files. Data passed between modules uses the types in `types/`. ESLint enforces
  this. The one exception is `lib/shared`: it has no index, so import its files directly
  (`@/lib/shared/money`). That keeps the database client out of browser bundles.
- **No database?** Modules fall back to the demo seed (`lib/demo`), never to separate fake data.
- **Store-scoped data.** Every table that holds store data has a `storeId` column.
- **Environment.** Read env only through `lib/shared/env.ts` (zod-validated). Secrets only in `.env` (gitignored).
  `.env.example` lists every key with no real values.
- **Tests.** Unit tests sit next to the code as `*.test.ts`, inside the owner's folder. End-to-end tests live in
  `tests/e2e/`.
- **Public repo.** MIT `LICENSE`. README with setup and run steps. No secrets, real customer data or credentials in
  code, commits, logs or screenshots.

### Environment keys (`.env.example`)

```
DATABASE_URL=                   # Supabase pooled connection (app at runtime)
DIRECT_URL=                     # Supabase direct connection (migrations)
DEMO_TODAY=2026-11-05           # the fixed "today" for the demo (Thu 5 Nov 2026)
APP_URL=http://localhost:3000   # public base URL; on Render: https://<service>.onrender.com once it exists

PAYPAL_CLIENT_ID=               # sandbox app
PAYPAL_CLIENT_SECRET=           # sandbox app
PAYPAL_WEBHOOK_ID=              # id of the webhook registered for APP_URL
PAYPAL_API_BASE=https://api-m.sandbox.paypal.com
NEXT_PUBLIC_PAYPAL_CLIENT_ID=   # same as PAYPAL_CLIENT_ID, for the store page button
PAYPAL_FAKE=                    # "1" only in tests: fake PayPal for e2e; refused in production

AI_MODEL=                       # Gemini model id with tool calling + structured output
GOOGLE_GENERATIVE_AI_API_KEY=
OPENROUTER_API_KEY=             # only if we switch provider
```

---

## 10. Workflow

- **Never edit** `generated/` (Prisma client output), `node_modules/`, `.next/`.
- **Changes to `types/` or `prisma/`** affect the whole app; say what you changed and why.
- **New dependency?** Say which and why before installing it.
- **After each change:**
  1. run `npm run check` (lint, typecheck and unit tests), and `npm run e2e` if you touched the demo flow;
  2. report the real result; never claim something works without running it;
  3. give exact steps to test it by hand: URL, what to click, what to expect, with amounts.
- **Windows note:** run `npm run check` from `C:\Users\...` with a capital drive letter. Opened as `c:\...`,
  Vitest loads itself twice and every test file fails with "Cannot read properties of undefined (reading 'config')".
- **Git:** anyone on the team can commit and push (section 1). `main` must always pass `npm run check` (GitHub runs it on every
  push and the host deploys from `main`). No `Co-authored-by` trailers or AI/tool attribution in commits or PRs.

### Commands

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start the app locally (http://localhost:3000) |
| `npm run build` | Generate the Prisma client and build for production |
| `npm run lint` | ESLint, including the import-boundary rules |
| `npm run typecheck` | Generate types, then `tsc --noEmit` |
| `npm test` | Vitest unit tests |
| `npm run e2e` | Playwright end-to-end tests (starts the dev server) |
| `npm run check` | lint + typecheck + unit tests. Run before every push |
| `npm run db:migrate` | Apply migrations (`prisma migrate deploy`, uses `DIRECT_URL`) |
| `npm run db:reset` | Delete every demo copy and recreate the local one from the seed |
| `npm run db:generate` | Regenerate the Prisma client after a schema change |

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
