# PLAN.md: NeverShort work plan

- **Deadline:** Thu 12 Nov 2026, 12:00pm PST, which is 1:30am Fri 13 Nov in India. **We submit by Wed 11 Nov
  night (IST).** Thu 12 Nov is emergency buffer only.
- **Today:** Sun 1 Nov 2026.
- **Judging:** reportedly 1 to 15 Dec 2026 (third-party listing; confirm on Devpost). The app must stay up until
  judging ends.
- **Judged on:** Technological Implementation, Design, Potential Impact, Innovation/Idea, Presentation.
- **Rules:** `AGENTS.md`. One task at a time. A task is done only when its "Done when" test has been **run and
  passed**, and the result is posted in the PR.

Status: `[ ]` not started, `[~]` in progress, `[x]` done (test run and passed).

---

## Decisions pending

Agents: if your task is listed under "Blocks", stop and ask. Do not guess.

| ID | Decision | Blocks |
|----|----------|--------|
| D10 | Names of the owners of T-1 (Devpost entry and video), T-2 (cold test) and T-3 (keeping the app running, including moving Render to a paid plan). The instructions had placeholders instead of names. | T-1, T-2, T-3 |
| D11 | Does Bryntum offer a hackathon licence? (P2-6a asks.) | P2-6b |
| D12 | Which coding agents P2 to P4 use (the instructions had a placeholder). Add a shim for any that doesn't read `AGENTS.md`. | Nothing |

## Decisions made (1 Nov 2026)

| ID | Decision |
|----|----------|
| D1 | `DEMO_TODAY` is Thu 5 Nov 2026. "Monday" in the story is Mon 9 Nov. |
| D2 | The seed includes the owner's regular transfers from PayPal to their bank. A set-aside keeps $X a day of those in PayPal until the due date, so the 12th genuinely becomes covered. |
| D3 | Bryntum is a sponsor with its own prize, but optional: the last task, and only with a hackathon licence. Without one, we build the laptop calendar ourselves. AG Grid and AG Charts: our choice, Community editions (AG Grid has the biggest sponsor prize). |
| D4 | Reminders go to a simulated outbox labelled "Simulated", showing the message and the live PayPal sandbox checkout link. The judge clicks it and pays as the sandbox buyer. |
| D5 | Each visitor gets their own copy of Loop Audio, with its own reset. |
| D6 | Database: Supabase Postgres. Prisma uses the pooled URL for the app and the direct URL for migrations. A daily keep-alive stops Supabase pausing the project. Web service: Render, moved to a paid plan before judging (T-3). |
| D7 | Money in counts what actually arrives after PayPal's fee. The seed is tuned so the story numbers still work. |
| D8 | Official rules confirmed (top of `AGENTS.md`). No specific PayPal product is required. "AI never calls PayPal" stays. The Agent Toolkit is optional: only as a library behind `lib/paypal`, called by the Guard's executor, and only if it fits. |
| D9 | P1 uses Claude Code. `GEMINI.md` points to `AGENTS.md`. |
| (first review) | All additions approved: red for short, amber for tight; money in whole cents; code-built sentences; contrast fixes; P3-0 first; fake PayPal mode; checks on every PR; Ask chat as a must-have. Also: the laptop view must look finished in the same style; phone-first stays for the owner's daily view. |

---

## Milestones

| Date | Milestone |
|------|-----------|
| Mon 2 Nov | **M0** Foundation live: Render web service, Supabase database, placeholder pages, a private copy per visitor, typed stubs. Types signed off by all four. |
| Thu 5 Nov | **M1** Real modules replace stubs. Story step 1 (the $90 gap) shows on Render. |
| Sat 7 Nov | **M2** Story steps 1 to 4 work on Render with a real sandbox payment. |
| Mon 9 Nov | **M3** Story steps 1 to 6 work on Render, on phone and laptop. Feature freeze. |
| Tue 10 Nov | **M4** Design pass done at both widths. E2E test green. `README.md` and `DEMO.md` complete. Draft video recorded. Cold judge test in the evening (T-2). |
| Wed 11 Nov | **M5** Cold-test fixes by midday, then code freeze. Final video uploaded. **Devpost entry submitted by night (IST).** |
| Thu 12 Nov | Emergency buffer only. The deadline is 1:30am Fri 13 Nov IST. |

Until M0 lands, P2 to P4 work on pure functions and tests against the draft types, and on account setup: PayPal
sandbox app and webhook (P2), the demo numbers (P3), the Gemini key and model choice (P4).

---

## Person 1 (Diwakar): app, components, PWA, demo page

### [~] P1-1 Setup (Sun 1 to Mon 2 Nov)
_Status 1 Nov: everything built and checked locally (`npm run check` passes; `.env` is ignored; the lib/ai to
lib/paypal import fails lint). Left: commit, push to a public GitHub repo, confirm "MIT license" in About._
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
simulated history, not a placeholder (P3 tunes it). Left: Supabase project, Render deploy, and the types/ sign-off
from P2, P3 and P4._
- Folders per `AGENTS.md` section 10.
- A Supabase project, and a Prisma schema (store-scoped) using the pooled URL at runtime and the direct URL for
  migrations, plus the first migration.
- `types/` with every shape that crosses modules.
- `lib/shared/` (db, clock, money, env).
- A stub `index.ts` in every `lib/` module returning fake typed data.
- A placeholder seed (P3 replaces it).
- Request middleware that gives each new visitor a cookie and their own copy of the placeholder seed (through a
  `lib/demo` stub).
- `/api/health`, which runs a real database query.
- Placeholder pages.
- A Render web service (free plan for now) in a region close to the Supabase project.

**Done when:**
- the Render URL loads every placeholder page with fake data, on a phone and on a laptop;
- `/api/health` returns OK after a real database query;
- migrations run over the direct URL and the app runs over the pooled URL;
- two different browsers get two different `storeId`s;
- `npm run check` passes on `main`;
- P2, P3 and P4 have each approved the `types/` shapes for their module in the PR.

### [~] P1-3 Design system and `/design` (Tue 3 to Wed 4 Nov)
_Status 1 Nov: built early with the foundation. Instrument Serif chosen; the palette is locked in
`app/globals.css`; `/design` shows every element and the real screens at 390px and 1280px; contrast was
calculated for every pairing. Left: the team's review of the look, and a check with reduced motion switched on in
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

### [ ] P1-4 Screens: phone first, finished on laptop (Wed 4 to Sat 7 Nov)
- Home: headline, strip, next dues with how much is ready.
- Money calendar, at both widths. This is the required laptop calendar; P2-6 is an optional extra.
- Detected payments ("We think Volta is paid ~$300 every 10 days", confirm once).
- Fix-the-gap sheet.
- Approval inbox with referee cards, approve and reject, and receipt view.
- Simulated outbox.
- Ask page (hosts P4's chat component).
- Settings and setup form, including minimum balance.

**Done when:**
- every screen works at 390px and looks finished at 1280px, against the real module APIs (stubs only where a
  module isn't merged yet);
- every screen has empty, loading and error states;
- story steps 1 and 5 can be clicked through on a phone and on a laptop.

### [ ] P1-5 PWA and demo control page (Sun 8 Nov)
- Manifest, icons, and a service worker that never caches API or data responses.
- `/demo` shows the demo date and a "Reset my copy" button. It walks through the 6 story steps, shows the sandbox
  buyer login, and links to the store page and the outbox.

**Done when:**
- Chrome offers "Install" on the Render URL and the installed app opens Home;
- after a reset, a reload shows fresh numbers (nothing stale from the cache);
- a reset in one browser leaves another browser's copy unchanged;
- a teammate who hasn't seen the app completes the 6 steps using only `/demo`.

### [ ] P1-6 Design pass (Tue 10 Nov)
Every screen at 390px and 1280px: voice, states, motion, "Simulated" labels, labelled charts. The laptop view gets
the same care as the phone.

**Done when:**
- the PR has screenshots of every screen at both widths;
- a search of UI strings finds no `!`, emoji, "unlock", "seamless", "supercharge" or "AI-powered";
- every screen's empty, loading and error state has been seen in the browser.

---

## Person 2: PayPal, Margin Guard, README, CI, merging

### [ ] P2-1 PayPal client, checkout and store page (Mon 2 to Wed 4 Nov)
- `lib/paypal/client.ts`: OAuth, Orders v2 (create, get, capture), refund, Payouts, webhook signature verification.
- Decide between the official SDK and a typed REST wrapper, and whether the Agent Toolkit fits behind it (D8).
- Orders carry the visitor's `storeId` in `custom_id`. Captures record gross, fee and net.
- A fake mode (`PAYPAL_FAKE=1`, refused in production) so the e2e test can complete a checkout without PayPal's
  login page.
- `/store`: a buyer-facing Loop Audio page with PayPal checkout, plus return and cancel routes.
- Send P3 the real fee from a $72 sandbox capture for the demo numbers.

**Done when:**
- unit tests (mocked fetch) show a `PayPal-Request-Id` on every write call;
- a non-sandbox base URL throws;
- fake mode throws when `NODE_ENV=production`;
- on Render, a sandbox buyer pays on `/store` and the database shows the order captured, with its PayPal order and
  capture IDs and the gross, fee and net amounts.

### [ ] P2-2 Webhooks (Wed 4 to Thu 5 Nov)
`/api/paypal/webhook`: verify the signature, record the event id, find the visitor's copy from `custom_id`, update
the order, and let the forecast reflect it.

**Done when:**
- a real sandbox payment on Render produces a verified event in the logs (event id shown);
- with two browsers open, a payment in one changes only that browser's copy;
- unit test: the same event posted twice changes the database once;
- unit test: a bad signature is rejected and changes nothing;
- unit test: capture-on-return and webhook arriving in either order give the same final state.

### [ ] P2-3 Margin Guard, receipts, executor, inbox API (Tue 3 to Sat 7 Nov)
All per `AGENTS.md` section 4:
- pure rules, the context loader, and the decision;
- append-only receipts;
- the executor for all 7 action types (SEND_REMINDER writes to the simulated outbox with a live checkout link
  created at execution);
- the inbox API (list, approve, reject).

**Done when** unit tests cover:
- each of the 8 rules passing, failing, and N/A for actions it doesn't apply to;
- BLOCK > ESCALATE > APPROVE precedence, and fail-closed when PayPal is unreachable;
- the demo cases: step 2 ($72 reminder) gives APPROVE; step 4 (second reminder after capture) gives BLOCK with
  "Already paid" as the only FAIL; step 5 (set-aside) gives APPROVE;
- ESCALATE, then owner approves, then the BLOCK rules are re-checked, then the action runs; and the case where the
  re-check blocks;
- a receipt saved for every decision, never edited.

And on Render:
- story steps 2 and 4 show the right referee card and receipt;
- the approved reminder appears in the outbox, labelled "Simulated", with a link a sandbox buyer can pay.

### [ ] P2-4 README (Tue 10 Nov)
- Setup, env keys, run, test, deploy.
- Supabase setup (pooled and direct URLs) and the keep-alive.
- PayPal sandbox setup (app, buyer account, webhook registration).
- Architecture, what's simulated, a link to `DEMO.md`, and P4's AI section.
- A "Built with" section that explains every tool and how we use PayPal and AI (a judging requirement).

**Done when:**
- a teammate follows it on a clean clone and reaches a running app with the demo seed, without asking anyone;
- "Built with" covers every tool in `package.json` that matters.

### [ ] P2-5 CI, keep-alive and daily merging (daily from Mon 2 Nov)
- A GitHub Actions workflow runs `npm run check` on every PR.
- A scheduled daily workflow calls `<APP_URL>/api/health` (keeps Supabase awake).
- P2 merges into `main` daily.

**Done when:**
- PR checks run on every PR;
- the keep-alive has succeeded once by manual trigger and once on its schedule.

And each day:
- CI is green on `main`;
- Render has deployed `main`;
- the story steps finished so far still work on Render.

### [ ] P2-6 Laptop calendar with Bryntum (optional, last)
**a. Licence check (by Tue 3 Nov).** Ask Bryntum whether they offer a hackathon licence (no trial watermark). Ask
early: the build is last, but a reply may take days.
**Done when** the answer is recorded under D11.

**b. Build (Tue 10 Nov, only if M3 is met).** With a licence: a Bryntum calendar for laptop in
`components/calendar/`. Without one: our own richer laptop calendar there, or skip it if P1-4's calendar is
enough. Merge by Wed 11 Nov midday, or drop it.
**Done when:**
- at 1024px and wider, it shows 14 days of money in and out from the forecast module, each day coloured by state
  with a word, and each due item showing how much is ready;
- there is no trial watermark;
- the calendar library is not in the phone bundle.

---

## Person 3: forecast, recovery, demo data, e2e

### [ ] P3-0 Demo numbers (Mon 2 Nov)
Write the demo data plan into `DEMO.md`, for `DEMO_TODAY` Thu 5 Nov 2026:
- opening balance;
- about 8 weeks of sales history with a weekday pattern;
- the owner's regular transfers to their bank;
- Volta's payments and the bills with their dates (Volta and rent both on Thu 12 Nov);
- the abandoned $72 checkout;
- one risky order and one customer who has not consented;
- the expected numbers at every story step.

Until P2 sends the real fee from a sandbox capture, use an estimate and mark it.

**Done when** a hand calculation in `DEMO.md` shows:
- about $90 short on Thu 12 Nov;
- what the $72 payment nets after PayPal's fee, and the gap left;
- a set-aside per day, taken from the owner's bank transfers, that is within the 30% cap with a total of $100 or
  less (so rule 8 doesn't escalate), and that covers the 12th;
- the exact answer to "Can I afford a $200 order on Monday?" (Mon 9 Nov).

And P2 and P4 have agreed the numbers.

### [ ] P3-1 Payment detection and 14-day forecast (Tue 3 to Thu 5 Nov)
- Deterministic recurring-payee detection (Volta, bills, and the owner's bank transfers).
- A forecast from weekday averages (net of fees) minus known money out, with a daily balance, the first shortfall
  and a confidence level.
- Exposes `simulate(action)` for Guard rule 6, `canAfford(amount, date)` for Ask chat, and fix-the-gap inputs.

**Done when** unit tests show:
- the seed history detects Volta at about $300 every 10 days, and the owner's transfers;
- the demo seed's first shortfall is Thu 12 Nov at the `DEMO.md` amount;
- `canAfford($200, Mon 9 Nov)` matches the strip's numbers;
- a sparse-history fixture gives low confidence;
- removing a due moves or clears the shortfall.

### [ ] P3-2 Fix the gap, Recovery agent, per-visitor copies and reset (Thu 5 to Sat 7 Nov)
- **Fix the gap:** up to three fixes with calculated amounts: a set-aside (kept from the owner's transfers, within
  the 30% cap), moving a payment to the first date sales can cover, and a simulated gap loan.
- **Recovery agent:** a deterministic search for abandoned or failed checkouts, then a SEND_REMINDER proposal with
  a draft from P4 (or a template).
- **Seed and copies:** the seed in `lib/demo/`, built relative to `DEMO_TODAY`. Each visitor gets a copy on their
  first visit.
- **Reset:** per visitor, with a new demo run id.
- **Cleanup:** remove copies idle for more than 7 days, to stay within Supabase's free storage.

**Done when:**
- after a reset, Home on Render shows the `DEMO.md` gap on Thu 12 Nov;
- the Recovery agent proposes the $72 reminder;
- fix-the-gap returns at most 3 fixes, with the gap loan labelled simulated;
- after the $72 payment, the gap is recomputed from the net amount;
- a test resets one copy twice and finds identical data apart from the run id;
- a test shows a reset of one copy leaves another copy unchanged;
- a test shows cleanup removes only idle copies.

### [ ] P3-3 DEMO.md judge script and e2e test (Mon 9 to Tue 10 Nov)
- `DEMO.md`: a step-by-step judge script with the sandbox buyer login and the expected numbers at each step.
- Playwright: the 6 story steps with `PAYPAL_FAKE=1`, plus a two-browser check that copies stay separate.

**Done when:**
- `npm run e2e` passes twice in a row, with a reset between runs;
- the manual real-sandbox checklist in `DEMO.md` has been run once on Render and ticked, with the date.

---

## Person 4: AI, risk, dashboard, charts

### [ ] P4-1 AI setup and Ask chat with tools (Mon 2 to Thu 5 Nov)
- `lib/ai/model.ts` (the only provider import), driven by `AI_MODEL`.
- Read-only chat tools backed by `lib/forecast`, for example `canAfford`, `getForecast` and `listDues`.
- A chat route and the `components/ask/` UI.
- A rate limit per visitor, and a calm fallback when AI fails.

**Done when:**
- searching the code finds `@ai-sdk/google` only in `lib/ai/model.ts`;
- on Render, "Can I afford a $200 order on Monday?" answers with exactly the numbers `canAfford` returns for
  Mon 9 Nov (also covered by a unit test with a stubbed model);
- with an invalid API key, chat shows a calm error and every other screen still works;
- switching to OpenRouter by editing only `model.ts` has been shown working locally once.

### [ ] P4-2 AI explanations and reminder drafts (Thu 5 to Sat 7 Nov)
- Structured reminder drafts (zod). Code, not AI, inserts the checkout link.
- Short explanations for the forecast and receipts.
- Voice and amount checks, with a template fallback.

**Done when** unit tests (stubbed model) show:
- drafts validate against the schema and contain the code-inserted link;
- a draft with `!`, emoji, a banned word, or an amount not in the input is replaced by the template;
- with the AI down, the recovery flow still completes using the template.

### [ ] P4-3 Risk check (Sun 8 Nov)
- Flags for an unusual amount, a brand-new buyer with a big order, and repeated failed attempts.
- Each flag creates a HOLD_ORDER proposal through the Guard.
- Held orders don't count as expected money.

**Done when:**
- unit tests cover each flag and a clean order;
- the seeded risky order gets a HOLD_ORDER proposal and a receipt;
- once the order is held, the forecast excludes it.

### [ ] P4-4 Extras (Mon 9 Nov; ship what's done by feature freeze)
- Price-rise alert, quiet when unsure, slow-week warning, setup form logic. The logic lives in `lib/risk/`.
- The minimum balance exists in the seed from day one, because rule 6 needs it. This task adds editing it.

**Done when:**
- each extra has a unit test for when it fires and when it stays quiet;
- a low-confidence forecast produces no alert.

### [ ] P4-5 AG Grid dashboard and AG Charts forecast chart (Sat 7 to Mon 9 Nov)
AG Grid has the biggest sponsor prize, so use it meaningfully:
- **Dashboard:** a laptop dashboard with an orders and payments grid. It has sorting and filtering, plus custom
  cell renderers for money, state words and referee cards. It is styled in our design, not a stock-looking grid.
- **Chart:** a forecast chart with labelled axes, a minimum-balance line and a shortfall marker.

**Done when:**
- `/dashboard` at 1280px shows real module data and looks finished;
- searching the code finds no `ag-grid-enterprise` or `ag-charts-enterprise`;
- the dashboard has empty, loading and error states;
- AG Grid and AG Charts are not in the phone bundle.

### [ ] P4-6 README AI section (Tue 10 Nov)
Written in `lib/ai/README.md`: model choice, how to switch provider, the AI rules, fallbacks, and how AI is used
meaningfully (a judging requirement). P2 merges it into `README.md`.

**Done when** P2 has merged it and a teammate has switched provider by following it.

---

## Team tasks

### [ ] T-1 Devpost entry and video (Tue 10 to Wed 11 Nov; owner: name needed, D10)
- Project description written for the five judging criteria.
- Screenshots, the built-with list, the public repo link and the hosted link.
- The sandbox buyer login for judges.
- A public YouTube demo video under 3 minutes: draft Tue 10 Nov, final Wed 11 Nov.

**Done when:**
- the entry is submitted on Wed 11 Nov before midnight IST;
- the hosted link, the repo (with its licence showing in About) and the video all open in a private browser
  window;
- the video is under 3:00.

### [ ] T-2 Cold test with an outsider (Tue 10 Nov evening; owner: name needed, D10)
Someone outside the team opens the Render link on a laptop and on a phone, and follows `/demo`.

**Done when** they finish all 6 story steps without help, and every problem they hit is either fixed by Wed 11 Nov
midday or written down.

### [ ] T-3 Keep the app running through judging (until judging ends; owner: name needed, D10)
- Move the Render web service to a paid plan before judging starts (by Mon 30 Nov) so it never sleeps.
- Confirm the Supabase keep-alive (P2-5) keeps running.

**Done when:**
- Render shows a paid plan;
- a daily check through the end of judging confirms the hosted link loads and a reset works.
