# PLAN.md: NeverShort work plan

- **Deadline:** Thu 12 Nov 2026, 12:00pm PST, which is 1:30am Fri 13 Nov in India. **We submit by Wed 11 Nov
  night (IST).** Thu 12 Nov is emergency buffer only.
- **Today:** Tue 3 Nov 2026.
- **Team:** two people (D13). P1 (Diwakar, Claude Code) builds the app. P2 (name to add, any AI agent) takes it
  live and finishes it. We work one after the other, never at the same time (AGENTS.md section 11).
- **Judging:** reportedly 1 to 15 Dec 2026 (third-party listing; confirm on Devpost). The app must stay up until
  judging ends.
- **Judged on:** Technological Implementation, Design, Potential Impact, Innovation/Idea, Presentation.
- **Rules:** `AGENTS.md`. One task at a time. A task is done only when its "Done when" test has been **run and
  passed**, and the result is written in the commit message.

Status: `[ ]` not started, `[~]` in progress, `[x]` done (test run and passed).

---

## Where things stand (Tue 3 Nov, night): read this first

**P1's build tasks are in (P1-6 to P1-11, all pushed).** The forecast, Margin Guard, reminder helper, fix the gap,
PayPal checkout and webhooks, Ask chat and the risk check are real code with 221 unit tests (`npm run check`, Thu 5 Nov).
All 6 story steps were clicked through on Wed 4 Nov (fake PayPal mode). Next for P1: the design pass (P1-12).

What P2 (and P2's agent) needs to know:
- **The repo moved** to `github.com/Rahulkumar0407/paypal` (GitHub redirects the old `kritsii/paypal`). Point your
  remote at it: `git remote set-url origin https://github.com/Rahulkumar0407/paypal`.
- **New (Thu 5 Nov), all pushed; pull, then `npm install`:**
  - **P2-5 is done** (built by P1 with the owner's OK, in P2's folders): `/dashboard` has the forecast in AG Charts and
    the orders and money-out tables in AG Grid, laptop-only, with loading, empty and error states
    (`components/dashboard/README.md`, `components/charts/README.md`). Restyle or extend freely.
  - **`/try`** ("Try it with your own numbers"): a public page, no database. Balance, daily sales, minimum and up to 5
    payments give the app's own forecast, fix ideas and the Guard's verdict. Add it to the smoke test's pages list and
    the README's routes table.
  - **Settings now saves** (minimum balance, warning zone, shop answers) to the visitor's copy; the forecast and the
    Guard follow it. Reset on `/demo` restores $100 and $50.
  - **First visit fixed:** `getVisitorStoreId()` now waits until the visitor's copy exists (a first page used to read
    an empty shop).
  - **Wording your smoke test may check** (old → new): tab title `Dues` → `To pay`; banner `Demo shop.` →
    `Sample shop.`; Ask `Not yet.` → `No.`; `gap loan` → `short-term loan`; menu `Open the shop` →
    `Loop Audio's store (buyer view)`, `Design system` removed from the menu (the page still exists); button
    `Not regular` → `Not a regular payment`; Guard rule 8 reason now reads "$119.00 is more than $100.00, the most
    NeverShort does without asking you."; rule 9 "With this one, $540.00 has gone out in 7 days. The limit is
    $500.00, so you decide."; receipts label the key `Repeat-check ref`. Landing buttons say "sample shop".
  - **Gemini works live** (`gemini-3.5-flash-lite`, thinking set to minimum in `lib/ai/model.ts`; time limits 20 s for
    AI lines, 30 s for Ask). Pages never wait for it.
- **New (Wed 4 Nov): landing page at `/`, Today moved to `/today`** (P1-13, agreed with the owner; tell P2).
  `/` is a public page with no database (`lib/landing`, `components/landing`). **Redone Thu 5 Nov:** light paper page,
  chunky headline, "How it works" in three blocks, a "Can you save Thursday?" slider judged by the real Guard rules,
  Maya's reminder paid on screen, real receipts, and two Open Peeps cartoons (CC0; AGENTS.md section 7). The app's look changed too
  (P1-12 started): felt mat, till with register keys, banknote-paper cards, ticket stubs, a till drawer on To pay.
  AGENTS.md section 7 was updated to match (landing hero allowed with the live product as its picture, banknote on
  Today and the landing page, motion when it shows something happening, the money desk). `gsap` was added and then
  removed again on Thu 5 Nov: the landing page's motion is plain CSS now (run `npm install` after pulling).
  P2's files that need the route change: `tests/e2e/smoke.spec.ts` (Today test: `goto("/today")`; add `/today` and
  `/` to the pages list) and `README.md` (Today row is `/today`; add `/`, the landing page). Devpost and the video
  should link the bare URL: it opens on the landing page.
- **PayPal sandbox works.** A US business sandbox app and a US personal buyer exist (P1 made them; keys are in P1's
  local `.env`, never in git). One real sandbox payment went through on 3 Nov: $72.00 paid, $3.00 fee, $69.00 arrived,
  exactly the `DEMO.md` numbers. Accounts must be **United States**: an India account gets "This seller doesn't accept
  payments in your currency".
- **P2-1:** send P1 the judges' buyer login (a separate US personal sandbox account) for `/demo` and `DEMO.md`.
- **P2-2 Render, P2-3 switch PayPal on:** follow `SWITCH-ON.md` (env keys, webhook URL and the 4 events, a test
  payment). `PAYPAL_FAKE` must stay unset on Render. Migrations: `npm run db:migrate`.
- **Shared change:** `prisma/schema.prisma` gained `PaymentAttempt` (migration `20261103120000_payment_attempts`,
  already applied to Supabase).
- **Agreed change (Wed 4 Nov), team files:** the Margin Guard has a **9th rule, "Total spending"** (AGENTS.md
  section 4): if supplier payments, refunds and loans in the last 7 days (approved, done or waiting) would pass $500
  with this action, the owner decides. `types/` `RuleId` gained `TOTAL_SPENDING`; every receipt now lists 9 rules.
  Any test of yours that counts rules should expect 9.
- **P2-5:** done (above).
- **P2-6:** `tests/e2e/smoke.spec.ts` (P2's file) has 8 failing checks from old wording: the "closes at $150" text
  on Home, 6 sample receipts on `/receipts` (a fresh copy has none until something is decided), and the `/approvals`
  and `/demo` headings. Update them to the current screens, then add the 6-step story with `PAYPAL_FAKE=1`.
- **P2-7 README:** copy the AI section from `lib/ai/README.md` (default model `gemini-3.5-flash-lite`; several keys
  comma-separated share the load within a per-key budget; with no `AI_MODEL` or key, every AI feature uses its plain
  fallback). Live Gemini was tried on Thu 5 Nov and answers; the free tier is slow (1 to 16 s), which is fine.
  Also say which sponsor tools are used and how: PayPal (Orders v2, Webhooks, Payouts, Payments; test mode), AG Grid
  and AG Charts (the dashboard), and credit Open Peeps by Pablo Stanley (CC0) for the landing page's drawings.
- **Render env for AI:** `AI_MODEL=gemini-3.5-flash-lite`, `GOOGLE_GENERATIVE_AI_API_KEY=key1,key2,...`, and optionally
  `AI_MAX_REQUESTS_PER_MINUTE` / `AI_MAX_REQUESTS_PER_DAY` set just under what aistudio.google.com/rate-limit shows.
- **Running locally:** `npm run dev`. Pages take seconds because the database is in Paris; on Render (Frankfurt) it
  should be quick. Approvals runs the reminder helper and the risk check each time it opens.

## Decisions pending

Agents: if your task is listed under "Blocks", stop and ask. Do not guess.

| ID | Decision | Blocks |
|----|----------|--------|
| D15 | Person 2's name (the instructions had a placeholder). | Nothing |

D10 (owners of the team tasks), D11 (Bryntum licence) and D12 (which agents P2 to P4 use) are closed by D13 and D14.

## Decisions made (1 Nov 2026)

| ID | Decision |
|----|----------|
| D1 | `DEMO_TODAY` is Thu 5 Nov 2026. "Monday" in the story is Mon 9 Nov. |
| D2 | The seed includes the owner's regular transfers from PayPal to their bank. A set-aside keeps $X a day of those in PayPal until the due date, so the 12th genuinely becomes covered. |
| D3 | (Bryntum part replaced by D14.) Bryntum is a sponsor with its own prize, but optional: the last task, and only with a hackathon licence. Without one, we build the laptop calendar ourselves. AG Grid and AG Charts: our choice, Community editions (AG Grid has the biggest sponsor prize). |
| D4 | Reminders go to a simulated outbox labelled "Simulated", showing the message and the live PayPal sandbox checkout link. The judge clicks it and pays as the sandbox buyer. |
| D5 | Each visitor gets their own copy of Loop Audio, with its own reset. |
| D6 | Database: Supabase Postgres. Prisma uses the pooled URL for the app and the direct URL for migrations. Supabase in Paris (`eu-west-3`). A free uptime pinger opens `/api/health` every 10 minutes, which keeps Render awake and stops Supabase pausing the project. Web service: Render in Frankfurt, moved to a paid plan before judging (P2-4). |
| D7 | Money in counts what actually arrives after PayPal's fee. The seed is tuned so the story numbers still work. |
| D8 | Official rules confirmed (top of `AGENTS.md`). No specific PayPal product is required. "AI never calls PayPal" stays. The Agent Toolkit is optional: only as a library behind `lib/paypal`, called by the Guard's executor, and only if it fits. |
| D9 | P1 uses Claude Code. `GEMINI.md` points to `AGENTS.md`. |
| (first review) | All additions approved: red for short, amber for tight; money in whole cents; code-built sentences; contrast fixes; P3-0 first; fake PayPal mode; checks on every PR; Ask chat as a must-have. Also: the laptop view must look finished in the same style; phone-first stays for the owner's daily view. |

## Decisions made (3 Nov 2026)

| ID | Decision |
|----|----------|
| D13 | The team is two people. P1 builds the app: everything Persons 3 and 4 had, plus the Margin Guard and the PayPal code from P2. P2 takes it live and finishes it: PayPal sandbox setup, Render, switching PayPal on, the uptime pinger and paid plan, the AG Grid dashboard and AG Charts chart, the live end-to-end test, the README, the Devpost entry and the video. Folder ownership follows (AGENTS.md section 10). |
| D14 | Cut: the Bryntum calendar and reconciliation of orders against PayPal payments. The money calendar from P1-4 is the only calendar. |
| D16 | Git: both push straight to `main`, one after the other. Pull before starting, run `npm run check` before pushing, never force-push or rewrite `main`'s history, and say in chat when you start and when you've pushed. GitHub runs the check on every push to `main`. |

---

## Milestones

| Date | Milestone |
|------|-----------|
| Mon 2 Nov | **M0** Foundation, every screen on stubs, demo guide and installable app (done). |
| Wed 4 Nov | **M1** P1: real forecast and regular payment detection. Story step 1 (the $90 gap) shows from real maths. |
| Thu 5 Nov | **M2** P1: real Margin Guard with receipts and tests. |
| Fri 6 Nov | **M3** P1: Recovery agent, fix-the-gap maths and reset are real. Story steps 1, 2, 4 and 5 work locally. |
| Sat 7 Nov | **M4** P1: checkout, store page and webhooks work in fake PayPal mode; `SWITCH-ON.md` is ready. P2: sandbox app, keys and the judges' buyer account exist. |
| Sun 8 Nov | **M5** P2: Render is live, PayPal is switched on, and one real sandbox payment worked end to end. P1: Ask chat works. |
| Mon 9 Nov | **M6** P1: risk check. Story steps 1 to 6 work on Render, on phone and laptop. Feature freeze. P2: dashboard and chart. |
| Tue 10 Nov | **M7** P1: design pass at both widths. P2: end-to-end test green on the live link, README done, draft video. Cold test in the evening (T-2). |
| Wed 11 Nov | **M8** Cold-test fixes by midday, then code freeze. Final video uploaded. **Devpost entry submitted by night (IST).** |
| Thu 12 Nov | Emergency buffer only. The deadline is 1:30am Fri 13 Nov IST. |

---

## Person 1 (Diwakar): builds the app

Done or nearly done (foundation, screens, demo guide):

### [x] P1-1 Setup (Sun 1 to Mon 2 Nov)
_Status 2 Nov: done. Checked on a fresh clone on a second laptop: the repo is public and GitHub detects the MIT
licence; `npm ci && npm run check` pass; `npm run dev` serves `/`; `.env` is ignored; a lib/ai file importing
lib/paypal fails lint._
- Push this repo (it already holds `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `PLAN.md`) to a public GitHub repo.
- Add MIT `LICENSE` and `.gitignore`.
- Scaffold Next.js App Router with TypeScript strict and Tailwind.
- Add ESLint with the import-boundary rules from `AGENTS.md` sections 6 and 9, plus Vitest and Playwright.
- Add the npm scripts from `AGENTS.md` section 11, `.nvmrc`, and `.env.example` with every key.

**Done when:**
- the GitHub repo is public and its About section shows "MIT license";
- a fresh clone runs `npm ci && npm run check` with no errors;
- `npm run dev` serves a page;
- `git check-ignore .env` prints `.env`;
- a throwaway file under `lib/ai/` that imports `@/lib/paypal` makes `npm run lint` fail (then delete it).

### [~] P1-2 Foundation (Mon 2 Nov, M0)
_Status 1 Nov: built and tested against a local Postgres: migration applies; `db:reset` twice gives identical
data (753 rows, new run id); two browsers get two store ids and their own copies; resetting one copy leaves the
other alone; `/api/health` queries the database; `npm run build` and `npm start` work. The seed is the full
simulated history, not a placeholder (P1-6 tunes it). Status 2 Nov: the Supabase project is connected (`/api/health`
reports the database OK). The Render deploy moved to P2 (P2-5). Left: P2 reads and agrees the `types/` shapes._
- Folders per `AGENTS.md` section 10.
- A Supabase project, and a Prisma schema (store-scoped) using the pooled URL at runtime and the direct URL for
  migrations, plus the first migration.
- `types/` with every shape that crosses modules.
- `lib/shared/` (db, clock, money, env).
- A stub `index.ts` in every `lib/` module returning fake typed data.
- A placeholder seed (P1-6 and P1-8 replace it).
- Request middleware that gives each new visitor a cookie and their own copy of the placeholder seed (through a
  `lib/demo` stub).
- `/api/health`, which runs a real database query.
- Placeholder pages.
- The Render web service moved to P2 (task P2-2).

**Done when:**
- the Render URL loads every placeholder page with fake data, on a phone and on a laptop (once P2 has deployed it, P2-2);
- `/api/health` returns OK after a real database query;
- migrations run over the direct URL and the app runs over the pooled URL;
- two different browsers get two different `storeId`s;
- `npm run check` passes on `main`;
- P2 has read and agreed the `types/` shapes.

### [~] P1-3 Design system and `/design` (Tue 3 to Wed 4 Nov)
_Status 1 Nov: built early with the foundation. Fraunces chosen (Instrument Serif was tried first); the palette is locked in
`app/globals.css`; `/design` shows every element and the real screens at 390px and 1280px; contrast was
calculated for every pairing. Left: P2's review of the look, and a check with reduced motion switched on in
a real browser._
- Colour, type and spacing tokens.
- Pick the serif and record it in `AGENTS.md` section 7.
- The four signature elements as components: headline sentence, money strip, referee card, receipt.
- Shared empty, loading and error components.

**Done when** `/design` at 390px and at 1280px shows:
- a headline sentence;
- a 14-tile strip with Covered, Tight and Short tiles, each with a word as well as a colour;
- all three referee cards;
- an approved receipt, and a blocked receipt whose stamp lands;
- a tile turning green, with no animation when reduced motion is on;
- empty, loading and error examples.

And no meaning colour is used as small text on white (checked with a contrast tool).

### [~] P1-4 Screens: phone first, finished on laptop (Wed 4 to Sat 7 Nov)
_Status 2 Nov: built on the module stubs, each at 390px and 1440px with empty, loading and error states: Home, Dues,
Fix the gap (`/fix`, sends a fix to the Guard and shows the referee card), Approvals (Approve / Decline and what
happened), Receipts (newest first, filter, single receipt view) and the Settings form. Still fake: Guard decisions
and fixes come from mocks and nothing is saved yet. Needs P1-8 (move the fix-to-proposal code from
`app/(owner)/fix/actions.ts` into lib/forecast), P1-7 (saved receipts and inbox) and a `saveStoreSettings` in
lib/store (P1-11). Left: story steps 1 and 5 on the real modules, then the Done-when checks._
- Home: headline, strip, next dues with how much is ready.
- Money calendar, at both widths.
- Detected payments ("We think Volta is paid ~$300 every 10 days", confirm once).
- Fix-the-gap sheet.
- Approval inbox with referee cards, approve and reject, and receipt view.
- Simulated outbox.
- Ask page (hosts the chat from P1-10).
- Settings and setup form, including minimum balance.

**Done when:**
- every screen works at 390px and looks finished at 1280px, against the real module APIs (stubs only where a
  module isn't merged yet);
- every screen has empty, loading and error states;
- story steps 1 and 5 can be clicked through on a phone and on a laptop.

### [~] P1-5 PWA and demo guide (Sun 8 Nov)
_Status 2 Nov: built early. `/demo` has the intro, the six story steps (what to do, what you'll see, a link, and a
Simulated / PayPal sandbox label), the sandbox buyer login placeholder (`SANDBOX_BUYER`, filled in from P2-1) and a reset
that confirms in place (tested against Supabase). PWA: manifest, banknote-medallion icons, full-screen on iPhone, and
a service worker that only serves an offline page. Checked on a local production build. Left: install on the Render
URL (P2-2), the buyer login (P2-1), and the cold test (T-2)._
- Manifest, icons, and a service worker that never caches API or data responses.
- `/demo` shows the demo date and a "Reset my copy" button. It walks through the 6 story steps, shows the sandbox
  buyer login, and links to the store page and the outbox.

**Done when:**
- Chrome offers "Install" on the Render URL and the installed app opens Home;
- after a reset, a reload shows fresh numbers (nothing stale from the cache);
- a reset in one browser leaves another browser's copy unchanged;
- a teammate who hasn't seen the app completes the 6 steps using only `/demo`.

Then, in this order:

### [x] P1-6 Forecast and regular payment detection (was P3-0, P3-1; Tue 3 to Wed 4 Nov)
_Status 3 Nov: done. Real detection and forecast in lib/forecast (pure engine, 63 new unit tests). Seed retuned: the
real maths gives exactly $90 short on Thu 12 Nov, $21 after the $72 payment ($69 net), covered at $156 after $11 a
day; "$200 on Monday" makes the 12th $144 short (DEMO.md has the hand calculation). Volta and the owner's transfers
are found from history and count before they're confirmed; Confirm and Not regular are saved. Pending orders count
only once captured (P1-11 decides more). Home, dues and /design checked at 390px and 1440px._
- **Demo numbers** in `DEMO.md`, for `DEMO_TODAY` Thu 5 Nov 2026: opening balance; about 8 weeks of sales history
  with a weekday pattern; the owner's regular transfers to their bank; Volta's payments and the bills with their
  dates (Volta and rent both on Thu 12 Nov); the abandoned $72 checkout; one risky order and one customer who has
  not consented; the expected numbers at every story step. Until P2's first real sandbox capture, use PayPal's
  published fee (`paypalFeeCents`) and mark it as an estimate.
- Deterministic recurring-payee detection (Volta, bills, and the owner's bank transfers).
- A forecast from weekday averages (net of fees) minus known money out, with a daily balance, the first shortfall
  and a confidence level.
- Exposes `simulate(action)` for Guard rule 6, `canAfford(amount, date)` for Ask chat, and fix-the-gap inputs.

**Done when** a hand calculation in `DEMO.md` shows about $90 short on Thu 12 Nov, what the $72 payment nets after
PayPal's fee and the gap left, a set-aside within the 30% cap with a total of $100 or less that covers the 12th,
and the exact answer to "Can I afford a $200 order on Monday?" (Mon 9 Nov). And unit tests show:
- the seed history detects Volta at about $300 every 10 days, and the owner's transfers;
- the demo seed's first shortfall is Thu 12 Nov at the `DEMO.md` amount;
- `canAfford($200, Mon 9 Nov)` matches the strip's numbers;
- a sparse-history fixture gives low confidence;
- removing a due moves or clears the shortfall.

### [x] P1-7 Margin Guard, receipts, executor, tests (was P2-3; Thu 5 Nov)
_Status 3 Nov: done. The 8 rules, the decision, append-only receipts, the executor for all 7 actions and the inbox
are real (lib/guard, 46 unit tests: every rule passing and failing, the demo's step 2, 4 and 5 decisions, repeats
blocked, a gap loan always escalated, an approved escalation blocked at run time). Fix the gap, Approvals and
Receipts show real decisions at 390px and 1440px. Steps 2 and 4 can be clicked in the app once the Recovery agent
(P1-8) and checkout (P1-9) exist; their decisions are unit-tested now._
All per `AGENTS.md` section 4:
- pure rules, the context loader, and the decision;
- append-only receipts;
- the executor for all 7 action types (SEND_REMINDER writes to the simulated outbox with a checkout link created
  at execution);
- the inbox API (list, approve, reject), wired to the Approvals screen.

**Done when** unit tests cover:
- each of the 8 rules passing, failing, and N/A for actions it doesn't apply to;
- BLOCK > ESCALATE > APPROVE precedence, and fail-closed when PayPal is unreachable;
- the demo cases: step 2 ($72 reminder) gives APPROVE; step 4 (second reminder after capture) gives BLOCK with
  "Already paid" as the only FAIL; step 5 (set-aside) gives APPROVE;
- ESCALATE, then owner approves, then the BLOCK rules are re-checked, then the action runs; and the case where the
  re-check blocks;
- a receipt saved for every decision, never edited.

And in the app (fake PayPal mode until P2-3): story steps 2 and 4 show the right referee card and receipt.

### [x] P1-8 Recovery agent, fix-the-gap maths and demo reset (was P3-2; Fri 6 Nov)
_Status 3 Nov: done. The reminder helper runs when Approvals opens and proposes a reminder per unfinished checkout
(Maya's $72 approved, Hana's blocked for consent, Sam's $119 escalated); "Send a follow-up" proposes the next one.
Fix the gap is real maths in lib/forecast/fixes.ts ($20 a day at step 1, $11 a day at step 5, move Volta to Fri 13
Nov, an exact-gap simulated loan), and the fix-to-proposal code moved into lib/forecast (`proposeFix`). Tests cover
the fixes, the template, reset twice giving identical data, a reset leaving other copies alone, and cleanup. DEMO.md
has the fixes table and the judge script._
- **Fix the gap:** up to three fixes with calculated amounts: a set-aside (kept from the owner's transfers, within
  the 30% cap), moving a payment to the first date sales can cover, and a simulated gap loan. Move the
  fix-to-proposal code from `app/(owner)/fix/actions.ts` into `lib/forecast`.
- **Recovery agent:** a deterministic search for abandoned or failed checkouts, then a SEND_REMINDER proposal with
  a drafted message (a template until P1-10).
- **Seed, copies and reset:** the seed in `lib/demo/`, built relative to `DEMO_TODAY`; a copy per visitor; reset
  per visitor with a new demo run id; cleanup of copies idle for more than 7 days. (Copies and reset already work
  from the foundation; this task makes the numbers match `DEMO.md`.)
- **`DEMO.md` judge script:** step by step, with the expected numbers at each step and room for P2's buyer login.

**Done when:**
- after a reset, Home shows the `DEMO.md` gap on Thu 12 Nov;
- the Recovery agent proposes the $72 reminder;
- fix-the-gap returns at most 3 fixes, with the gap loan labelled simulated;
- after the $72 payment, the gap is recomputed from the net amount;
- a test resets one copy twice and finds identical data apart from the run id;
- a test shows a reset of one copy leaves another copy unchanged;
- a test shows cleanup removes only idle copies.

### [x] P1-9 PayPal checkout, store page and webhooks (was P2-1, P2-2; Sat 7 Nov)
_Status 3 Nov: done in fake mode; P2-3 switches on the sandbox with SWITCH-ON.md. lib/paypal is a typed REST wrapper
(no SDK, no Agent Toolkit) with sandbox, fake and off modes; every write sends PayPal-Request-Id. /store checks out,
captures on return and shows gross, fee and net; each attempt is a PaymentAttempt row (new table, migration
20261103120000). The webhook verifies first, stores each event once and handles approved, completed, denied and
refunded. Story steps 1 to 5 clicked through in fake mode on 3 Nov. Shared change for P2: prisma/schema.prisma gained
PaymentAttempt._
Built so it runs in fake PayPal mode now and uses the real sandbox automatically once `PAYPAL_CLIENT_ID` and
`PAYPAL_CLIENT_SECRET` are set (AGENTS.md section 6).
- `lib/paypal/client.ts`: OAuth, Orders v2 (create, get, capture), refund, Payouts, webhook signature verification.
  Decide between the official SDK and a typed REST wrapper, and whether the Agent Toolkit fits behind it (D8).
- Orders carry the visitor's `storeId` in `custom_id`. Captures record gross, fee and net.
- Fake mode (`PAYPAL_FAKE=1`, refused in production), so the e2e test can complete a checkout without PayPal's
  login page.
- `/store`: the buyer-facing Loop Audio page with PayPal checkout, plus return and cancel routes.
- `/api/paypal/webhook`: verify the signature, record the event id, find the visitor's copy from `custom_id`,
  update the order, and let the forecast reflect it.
- **`SWITCH-ON.md`:** exact steps for P2: which keys go where on Render, how to register the webhook for `APP_URL`
  and set `PAYPAL_WEBHOOK_ID`, and the one real test payment that proves it works.

**Done when:**
- unit tests (mocked fetch) show a `PayPal-Request-Id` on every write call;
- a non-sandbox base URL throws, and fake mode throws when `NODE_ENV=production`;
- in fake mode, a buyer pays on `/store` locally and the database shows the order captured, with gross, fee and net;
- unit test: the same webhook event posted twice changes the database once;
- unit test: a bad signature is rejected and changes nothing;
- unit test: capture-on-return and webhook arriving in either order give the same final state;
- `SWITCH-ON.md` exists and P2 has read it.

### [x] P1-10 Gemini and Ask chat (was P4-1, P4-2; Sun 8 Nov)
_Status 3 Nov: done and tested with the AI SDK's mock model (live Gemini not checked yet, by choice: set AI_MODEL to
switch it on). One provider file; Ask answers only through four tools and code checks every number; plain answers when
AI is off, wrong, failing or over the per-visitor limit. AI drafts for reminders, the shortfall line and the found
payment line, each with a template. Step 6 answers "Not yet: Mon 9 Nov ends at $808, Thu 12 Nov $144 short"._
- `lib/ai/model.ts` (the only provider import), driven by `AI_MODEL`.
- Read-only chat tools backed by `lib/forecast`, for example `canAfford`, `getForecast` and `listDues`.
- The chat route and the `components/ask/` screen; a rate limit per visitor, and a calm fallback when AI fails.
- Structured reminder drafts (zod), with code, not AI, inserting the checkout link; short explanations for the
  forecast and receipts; voice and amount checks with a template fallback.

**Done when:**
- searching the code finds `@ai-sdk/google` only in `lib/ai/model.ts`;
- "Can I afford a $200 order on Monday?" answers with exactly the numbers `canAfford` returns for Mon 9 Nov (also a
  unit test with a stubbed model);
- with an invalid API key, chat shows a calm error and every other screen still works;
- a draft with `!`, emoji, a banned word, or an amount not in the input is replaced by the template;
- with the AI down, the recovery flow still completes using the template;
- switching to OpenRouter by editing only `model.ts` has been shown working locally once.

### [x] P1-11 Risk check; extras only if time allows (was P4-3, P4-4; Mon 9 Nov)
_Status 4 Nov: done. Fixed rules (lib/shared/risk.ts) flag an unusual amount, a new buyer's big order and repeated
failed attempts; a flagged order never counts as money in until the owner clears it, and a HOLD_ORDER goes through the
Guard with one line on why. Seed: Isla Moreno's $894 pending order; store software up from $89 to $99. Extras:
price-rise alert, slow-week warning, quiet when unsure. All 6 story steps clicked through on 4 Nov in fake mode. The
reminder helper and risk check now start in the background on a visitor's first page (and after a reset), so Approvals
opens in about 3 seconds here instead of 38._
- Flags for an unusual amount, a brand-new buyer with a big order, and repeated failed attempts. Each flag creates
  a HOLD_ORDER proposal through the Guard. Held orders don't count as expected money.
- Saving the Settings form (`saveStoreSettings` in `lib/store`), so the minimum balance can be edited.
- Only if time allows: price-rise alert, quiet when unsure, slow-week warning.

**Done when:**
- unit tests cover each flag and a clean order;
- the seeded risky order gets a HOLD_ORDER proposal and a receipt, and once held, the forecast excludes it;
- any extra that ships has a unit test for when it fires and when it stays quiet, and a low-confidence forecast
  produces no alert.

### [~] P1-12 Design pass (was P1-6; Tue 10 Nov; started Wed 4 Nov with the money desk)
Every screen at 390px and 1280px: voice, states, motion, "Simulated" labels, labelled charts. The laptop view gets
the same care as the phone.

**Done when:**
- the commit has screenshots of every screen at both widths (in the commit message or a linked folder);
- a search of UI strings finds no `!`, emoji, "unlock", "seamless", "supercharge" or "AI-powered";
- every screen's empty, loading and error state has been seen in the browser.

### [~] P1-13 Landing page at `/` (Wed 4 Nov)
The page is the demo, not an advert: hero with the live banknote, a scroll time-lapse of the 14 days (split-flap date,
notes in and out of a till drawer, a narrator line, Thu 12 SHORT $90), "Now you fix it" (slider, live tickets, the
Guard's card), money comes back (tap Pay with PayPal on a phone), the Guard's receipts, built-with receipt.
Today moved to `/today`.

**Done when:** a 10-second cold test (someone new says what it does); every section at 390 / 1280 / 1440; reduced
motion shows the still version; no database queries from `/`; `npm run check` and `npm run e2e` pass.

---

## Person 2 (name to add): going live and finishing

Setup (P2-1 to P2-3) is finished by about Sun 8 Nov.

### [ ] P2-1 PayPal sandbox app, keys and the judges' buyer account (by Sat 7 Nov)
- Create the PayPal sandbox app and keep its client id and secret out of the repo.
- Create a separate sandbox buyer account just for judges. Only this buyer login may be published (AGENTS.md
  section 6); the business account stays private.
- Send P1 the buyer login for `/demo` (`SANDBOX_BUYER`) and `DEMO.md`.

**Done when** the buyer account can log in on the PayPal sandbox, and the keys are stored somewhere private (never in
git, logs or screenshots).

### [ ] P2-2 Render deploy (by Sun 8 Nov; earlier is better)
- A Render web service (free plan for now) in Frankfurt, close to the Supabase project in Paris. It deploys `main`,
  runs `prisma migrate deploy`, and has every key from `.env.example`. Set `APP_URL` to its link.
- Health check path: `/api/health`.

**Done when** the Render URL loads every page on a phone and on a laptop, `/api/health` reports the database OK,
and Chrome offers "Install" on it.

### [ ] P2-3 Switch PayPal on (Sun 8 Nov, after P1-9)
Follow `SWITCH-ON.md`: add the keys on Render, register the webhook for `APP_URL`, set `PAYPAL_WEBHOOK_ID`, and run
one real sandbox payment end to end.

**Done when:**
- on Render, the judges' buyer pays on `/store` and the database shows the order captured, with its PayPal order
  and capture IDs and the gross, fee and net amounts;
- the payment produces a verified webhook event in the logs (event id shown);
- with two browsers open, a payment in one changes only that browser's copy;
- an approved reminder's link in Sent reminders can be paid by the buyer;
- P1 has the real fee from the $72 capture for `DEMO.md`.

### [ ] P2-4 Uptime pinger and paid Render plan (pinger by Sun 8 Nov; paid plan by Mon 30 Nov)
- A free uptime pinger opens `<APP_URL>/api/health` every 10 minutes (keeps Render awake and Supabase from pausing).
- Move the Render web service to a paid plan before judging starts, so it never sleeps.

**Done when:**
- the pinger shows the health check passing for a full day;
- Render shows a paid plan;
- a daily check through the end of judging confirms the hosted link loads and a reset works.

### [x] P2-5 AG Grid dashboard and AG Charts forecast chart (was P4-5; Mon 9 Nov)
_Done Thu 5 Nov by P1, with the owner's OK (P2's folders): orders grid and money-out grid in AG Grid, the forecast in
AG Charts, both laptop-only, with loading, empty and error states. Also fixed in `lib/demo`: on a visitor's very first
request a page could read their copy before it existed; `getVisitorStoreId()` now waits for it._
AG Grid has the biggest sponsor prize, so use it meaningfully:
- **Dashboard:** a laptop dashboard with an orders and payments grid. It has sorting and filtering, plus custom
  cell renderers for money, state words and referee cards. It is styled in our design, not a stock-looking grid.
- **Chart:** a forecast chart with labelled axes, a minimum-balance line and a shortfall marker.

**Done when:**
- `/dashboard` at 1280px shows real module data and looks finished;
- searching the code finds no `ag-grid-enterprise` or `ag-charts-enterprise`;
- the dashboard has empty, loading and error states;
- AG Grid and AG Charts are not in the phone bundle.

### [ ] P2-6 End-to-end demo test on the live link (was P3-3; Tue 10 Nov)
- Playwright: the 6 story steps with `PAYPAL_FAKE=1`, plus a two-browser check that copies stay separate.
- The manual real-sandbox checklist in `DEMO.md`, run on the live link.

**Done when:**
- `npm run e2e` passes twice in a row, with a reset between runs;
- the manual checklist in `DEMO.md` has been run once on Render and ticked, with the date.

### [ ] P2-7 README, Devpost entry and video (was P2-4, P4-6, T-1; Tue 10 to Wed 11 Nov)
- **README:** setup, env keys, run, test, deploy; Supabase setup and the uptime pinger; PayPal sandbox setup;
  architecture, what's simulated, a link to `DEMO.md`; the AI section (model choice, how to switch provider, the AI
  rules, fallbacks); and a "Built with" section listing every tool, including every AI tool used to build it, and
  how we use PayPal and AI (a judging requirement).
- **Devpost entry:** a description written for the five judging criteria, screenshots, the built-with list, the
  public repo link, the hosted link and the judges' buyer login.
- **Video:** a public YouTube demo under 3 minutes: draft Tue 10 Nov, final Wed 11 Nov.

**Done when:**
- someone follows the README on a clean clone and reaches a running app with the demo seed, without asking anyone;
- the entry is submitted on Wed 11 Nov before midnight IST;
- the hosted link, the repo (with its licence showing in About) and the video all open in a private browser window;
- the video is under 3:00.

---

## Both

### [ ] T-2 Cold test with an outsider (Tue 10 Nov evening)
Someone outside the team opens the Render link on a laptop and on a phone, and follows `/demo`.

**Done when** they finish all 6 story steps without help, and every problem they hit is either fixed by Wed 11 Nov
midday or written down.
