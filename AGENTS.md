# AGENTS.md: NeverShort

Rules for every AI coding agent working in this repo: Claude Code, Codex, Cursor, Gemini, Copilot or any other.
Read the whole file before your first change. If a request from your human conflicts with this file, stop and ask
before acting.

**Hackathon:** PayPal AI Hackathon on Devpost.

- **Deadline:** Thu 12 Nov 2026, 12:00pm PST (1:30am Fri 13 Nov in India). We submit by Wed 11 Nov night (IST).
- **Judged on:** Technological Implementation, Design, Potential Impact, Innovation/Idea, Presentation.
- **Requirements:**
  - meaningful use of at least one PayPal technology, and of AI;
  - a working build judges can use (our hosted URL; mockups don't count);
  - documentation that explains the tools used;
  - a public repo with its licence visible in the GitHub About section;
  - a YouTube demo video under 3 minutes.

Tasks, owners, decisions and status live in `PLAN.md`.

---

## 1. Start of every session

1. **Know who you work for.** The team is two people, P1 and P2 (section 10). If you were not told which person
   you are working for, ask before doing anything else. You may only change files in that person's folders.
2. **Pick one task.** Open `PLAN.md`, find the current task, and work on that task only. If it depends on an item
   under "Decisions pending" in `PLAN.md`, stop and ask.
3. **Check versions before writing code.** Read `package.json` and use the docs for the installed major version.
   Next.js, Tailwind, Prisma, the AI SDK and AG Grid have all shipped breaking major versions recently.
   Do not write their APIs from memory.

---

## 2. Product brief

### What NeverShort is

A money co-pilot for a small online store. It makes sure the store gets paid, stays safe from risky orders, and
always has money ready for its next supplier order or bill.

AI agents can only PROPOSE actions. Every action that touches money goes to the **Margin Guard**, which returns
APPROVE, ESCALATE (owner decides) or BLOCK, and saves a receipt explaining why. No money moves without passing
the Guard.

### Demo store

"Loop Audio", a small online headphone store. Currency USD.

- Regular supplier: "Volta Audio Parts", about $300 every 10 days.
- Fixed bills: rent, internet, software, a small loan repayment. Some fall on the same day.
- Owner's pay: the owner regularly transfers money from PayPal to their bank. These transfers are money out, found
  from history the same way as Volta's payments.

### Features, in build order

Must-have:

1. **Money calendar.** Money in (sales, recovered payments) and money out (supplier orders, bills) on one screen.
   Each due item shows how much is ready.
2. **Regular payment detection.** Find recurring payees from history (similar amount, regular interval). Show
   "We think Volta is paid ~$300 every 10 days" and let the owner confirm once.
3. **14-day cash forecast.** Expected daily sales (weekday-based average of recent history) minus known money out
   (dues and the owner's regular bank transfers), giving a balance line per day and the first shortfall date and
   amount. Each forecast has a confidence level. Money in counts what actually arrives after PayPal's fee.
4. **Recovery agent.** Finds abandoned or failed PayPal checkouts and proposes a reminder with a fresh PayPal
   checkout link. Approved reminders go to a simulated outbox, labelled "Simulated", that shows the message and the
   live PayPal sandbox checkout link. The judge clicks the link and pays as the sandbox buyer.
5. **Margin Guard.** Deterministic rules, receipts, approval inbox (section 4).
6. **Fix the gap.** For a shortfall, propose up to three fixes:
   - set aside $X a day from sales: keep $X a day of the owner's regular bank transfers in PayPal until the due
     date, so that day's balance genuinely rises;
   - move a payment to a later date that sales can cover;
   - a small gap loan (SIMULATED, clearly labelled).

Should-have:

7. **Risk check.** Flag risky orders (unusual amount, brand-new buyer with a big order, repeated failed attempts)
   and hold them so they don't count as expected money.
8. **Ask chat.** Questions like "Can I afford a $200 order on Monday?" answered from the store's own data through
   tools. Demo story step 6 needs this, so the "Can I afford" path is treated as a must-have.
9. **Extras.** Price-rise alert on a bill; "quiet when unsure" (no alert when confidence is low); owner's minimum
   balance; slow-week warning; a short setup form (what you sell, how you pay suppliers, busy seasons).

### The demo story (must work end to end on the hosted link)

1. Today (Thu 5 Nov 2026) the forecast shows about $90 short on Thu 12 Nov: the supplier order and rent land the
   same day.
2. The Recovery agent finds an abandoned $72 order and proposes a reminder. Guard: APPROVE.
3. The buyer pays through the new PayPal sandbox checkout. The webhook confirms it and the forecast improves by what
   actually arrived after PayPal's fee.
4. The Recovery agent proposes another reminder for the same order. Guard: BLOCK (already paid).
5. The owner picks "set aside a little each day" for the remaining gap. Guard: APPROVE. The 12th now shows as
   covered.
6. The owner asks "Can I afford a $200 order on Monday?" (Mon 9 Nov) and gets a correct, calculated answer.

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
- **Routes.** The public landing page is `/` (P1-13): what NeverShort does in one sentence, how it works in three
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

Lives in `lib/guard/` (P1). Plain TypeScript. No AI. Fully unit-tested.

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
- **Switches on by itself.** P1 builds checkout and webhooks against fake mode first. Once `PAYPAL_CLIENT_ID` and
  `PAYPAL_CLIENT_SECRET` are set, the same code uses the real sandbox, with no code change. `SWITCH-ON.md` has the
  exact steps P2 follows (keys, webhook registration, one real test payment).
- **APIs:** Orders v2 (create, get, capture), Webhooks with signature verification, Payments (refund),
  Payouts (paying the supplier).
- **One file.** All PayPal HTTP calls live in `lib/paypal/client.ts`: the official SDK or a small typed REST
  wrapper (P1 decides in task P1-9).
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

Judges score design. We want a distinctive product, not a template.

### Concept: "money weather"

A calm, honest forecast for a small shop that the owner checks every morning, the way they check the weather.
The metaphor lives in the words and the colours, never in sun or cloud icons. Not a generic SaaS dashboard.

### Signature elements (build these into the design system first; they define the product)

1. **Headline sentence.** Every home screen opens with ONE plain sentence in a large serif, like a forecast read
   aloud: "Clear until Wednesday. On Thu 12 Nov you'll be $90 short: the supplier order and rent land the same day."
2. **14-day money strip.** One tile per day, coloured by how the day looks (green = covered, amber = tight,
   red = short), showing the date and the day's balance. It is the visual heart of the app and changes colour live
   when a gap is fixed.
3. **Referee cards.** Every Margin Guard decision shows a small tilted card chip (green Approved, amber Needs your OK,
   red Blocked), like a football referee's card.
4. **Receipts.** Each Guard decision prints as a thermal shop receipt: monospace text, dashed dividers, zig-zag top
   and bottom edges, PASS/FAIL per rule, a BLOCKED stamp when blocked.
5. **The banknote** (chosen 1 Nov, option A2 at `/design/backgrounds`). The home screen's headline and strip sit
   inside a deep green note engraved like real currency: a fine lathe tint, a rope border with a 14 in each corner,
   NEVERSHORT at the top, "This forecast is good for fourteen days" at the bottom, a rosette medallion, the Margin
   Guard seal, red serials and signatures. Use `BanknotePanel` from `components/ui/Banknote.tsx`; never redraw it.
   The full note is for the home screen (Today) only. Precise, symmetric engraving only: no
   organic swirls.
6. **The money desk** (every owner page; chosen 4 Nov). Three physical objects, set in `components/app/AppShell.tsx`:
   - the **till** on the left: a screwed-down dark panel with a display window (shop and date) and square ivory
     **register keycaps** (`.key` in `app/globals.css`), the current page's key pressed down in brand green, numbers
     1 to 7 as keyboard shortcuts; on a phone the keys run along the bottom;
   - the **counting mat**: green felt with a fine twill weave and a stitched edge (`MatBackdrop`,
     `components/ui/Paper.tsx`). Text on the felt uses the light ink tokens that `.mat` sets;
   - **banknote paper** cards on the mat (`--color-paper` is a soft green-grey there, not white), with soft shadows.
   Day tiles are tear-off **ticket stubs** with a SHORT ink stamp; To pay opens with the **till drawer**
   (`components/app/TillDrawer.tsx`): one slot per payment, the stack of notes is how much is ready.
   The desk colours (desk, till, felt, paper) are surfaces, not accents; they live as hex values in `globals.css`.

### Colours

| Token | Hex | Use |
|-------|-----|-----|
| background | `#FFFFFF` | page |
| ink | `#14201B` | text |
| brand | `#0E3B2C` | brand deep green |
| surface | `#F3F5F2` | the one soft neutral surface |
| green | `#1E9E5E` | covered, approved, ready |
| amber | `#F2A93B` | tight, escalated |
| red | `#E5484D` | short, blocked |

- Meaning colours carry meaning only. "Short" is red everywhere (strip, calendar, text).
- No colour gradients. No other accent colours. Light and shadow on a physical surface (a lamp's pool of light, a
  book's spine shadow, ruled lines) are allowed, in neutral black or white only.
- **Contrast (WCAG AA, measured).** Meaning colours are fills and marks, never text on white: green is 3.4:1,
  amber 2.0:1, red 3.9:1 against white. Text on a green or amber fill is ink (4.9:1 and 8.4:1). Ink on red is
  only 4.3:1, so text on a red fill must be large (24px+, or 19px+ bold). Small text goes on white or surface with
  a coloured mark beside it.
- **Colour is never the only signal.** Every coloured tile, chip and card also carries a word: Covered, Tight,
  Short, Approved, Needs your OK, Blocked.

### Type

- **Fraunces** (chosen; variable, softened with `"SOFT" 50`) for headline sentences, page sentences and big single amounts. Instrument Serif was tried first and read as too condensed.
- **Landing page only:** big headlines use Fraunces at its heaviest, fully soft and "wonky" (the `display` class:
  weight 900, `"SOFT" 100, "WONK" 1`), for a friendlier, chunkier first impression. App screens keep the calm serif.
- Inter for interface text. JetBrains Mono for receipts only.
- Tabular numbers for money in columns: the `tabular` utility (Inter). Big single amounts use the serif.
- Fonts load through `next/font` in `app/layout.tsx`; tokens and the palette live in `app/globals.css`.
- **The palette is locked.** Tailwind's default colours are switched off, so only `ink`, `ink-muted`, `line`,
  `brand`, `surface`, `paper`, `white`, `green`, `amber` and `red` exist. `bg-blue-500` produces nothing.
- Build screens from `components/ui` (see the `/design` page) before writing new styles.

### Layout

- Generous spacing, one idea per card, big numbers, few borders.
- Phone-first for the owner's daily view: design every screen at 390px first.
- The laptop view is not secondary. Most judges will open the link on a laptop, so every screen must look finished
  at 1280px, in the same design style.

### Voice

- A calm, sharp shop manager: short sentences, real amounts, real dates.
  "Rent's covered. Volta's order is $90 short. Here are three ways to fix it."
- No exclamation marks, no emoji. Never "unlock", "seamless", "supercharge", or "AI-powered" badges.
- Dates read "Thu 12 Nov". Money in sentences and tiles is whole dollars, with shortfalls rounded up so a gap is
  never understated. Receipts and tables show cents.

### Motion (only when it shows something happening)

- Motion always shows something happening: a fixed day's tile turns green and a COVERED stamp lands, a BLOCKED
  stamp lands on a blocked receipt, notes slide into the till drawer, a key presses down, tickets are dealt, the
  landing page's owner looks worried on the short day and relieved when it's saved. Nothing moves just to decorate.
- Always respect `prefers-reduced-motion`: show the final state instead.

### Never

Purple or blue gradients, glassy cards, sparkle icons, icon-in-a-circle card grids, stock illustrations,
lorem ipsum, unlabelled charts, a marketing-style hero inside the app screens. The landing page (`/`) may open with a
hero built from the live product (the real forecast's tickets), never a mockup.

**Exception, landing page only:** hand-drawn people from **Open Peeps** by Pablo Stanley (CC0, openpeeps.com), drawn
in our ink: the shop's owner (`components/landing/Owner.tsx`) and Maya, the customer (`components/landing/Maya.tsx`).
They are generated from the Open Peeps drawing data, never hand-edited, and credited in the page footer. Each one acts
out the story (worried, relieved, paying). No other illustration sets.

### States

Every screen and every module component has a real empty state, loading state and error state, in the same voice.

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
- **Stubs and mocks.** Until a module is real, its `index.ts` returns fake data from `mocks/`, marked
  `TODO(Person N)`. Replace the stub body, keep the signature. If a signature must change, that is a `types/`
  change: tell the other person first (section 10).
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

## 10. Team and folder ownership

| Owner | Folders and files |
|-------|-------------------|
| **P1 (Diwakar)** | Everything not listed for P2 or as shared below: `app/` (including `app/store/` and every API route), `components/` (except `dashboard/` and `charts/`), `public/`, `proxy.ts`, every `lib/` module (`forecast`, `guard`, `recovery`, `demo`, `paypal`, `store`, `ai`, `risk`, `shared`), `mocks/`, `DEMO.md`, `SWITCH-ON.md`, `.github/` (CI), `package.json`, `package-lock.json`, `.env.example`, the root config files, `playwright.config.ts`, `CONTRIBUTING.md`, `LICENSE`, `.gitignore`, `.nvmrc`. |
| **P2 (name to add, any AI agent)** | `components/dashboard/` (AG Grid), `components/charts/` (AG Charts), `tests/e2e/`, `README.md`, and all deployment settings: the Render service and its environment variables, the uptime pinger, and the PayPal sandbox app and accounts. |
| **Shared** | `types/` and `prisma/`. Whoever changes one tells the other person first. |
| **Mocks** | `mocks/` belongs to P1. `mocks/mocks.test.ts` keeps the fake story numbers honest; update it with your mock. |
| **Never edit** | `generated/` (Prisma client output), `node_modules/`, `.next/`. |
| **Team** | `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `PLAN.md`. Change only when both agree. Ticking your own task's status in `PLAN.md` is fine. `CLAUDE.md` and `GEMINI.md` only import this file; put no rules there. |

- **Only change files in the current person's folders.** If anything outside them is needed, stop and say exactly
  which file, what change, and why.
- **Foundation exception.** During P1's foundation task only, P1 creates the skeleton in every folder, including
  stub `index.ts` files that return fake typed data. Once the foundation is merged, each folder belongs to its
  owner.
- **Shared files** (`types/`, `prisma/`). Whoever changes one tells the other person first, in chat, with the exact
  change and why.
- **Dependencies.** The foundation installs every library in the stack. Need another one? Stop and say which and
  why (`package.json` belongs to P1; tell P2 when one is added).

---

## 11. Workflow

- **One task at a time,** from `PLAN.md`. Before starting, say the task ID and the files you expect to touch.
- **After each task:**
  1. run `npm run check` (lint, typecheck and unit tests), and `npm run e2e` if you touched the demo flow;
  2. report the real result;
  3. give exact steps to test it by hand: URL, what to click, what to expect, with amounts;
  4. stop and wait.
- **Never claim something works without running it.** If you could not run something, say so plainly.
- **Git.** We work one after the other, never at the same time, and both push straight to `main`. No branches or
  pull requests are needed.
  - Before starting any work: `git pull` on `main`.
  - Before pushing: run `npm run check`, and push only if it passes. GitHub runs the same check on every push to
    `main`, so `main` always passes `npm run check` and deploys.
  - Never force-push, and never rewrite `main`'s history (no amending or squashing commits that are already pushed).
  - If a push is rejected because the other person pushed first: pull, fix any conflict, run `npm run check`
    again, then push.
  - Tell the other person in chat when you start and when you've pushed, so you never work at the same time.
- **No co-authors, ever.** Never add `Co-authored-by` trailers, "Generated with" lines or any other AI or tool
  attribution to commit messages or PR descriptions in this project.

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
