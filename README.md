<div align="center">

<img src="public/tmrw/brand/logo-light.png" alt="tmrw" width="230" />

### See the short day before it arrives.

**A small shop's money month on one page, inside PayPal.**<br/>
tmrw spots the day two big payments land together, a week early, and helps fix it.<br/>
AI suggests. Code decides. The owner taps. Nothing moves without passing the **Margin Guard**.

![Next.js 16](https://img.shields.io/badge/Next.js-16.4-000?logo=nextdotjs)
![PayPal sandbox](https://img.shields.io/badge/PayPal-sandbox-003087?logo=paypal&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-AI%20SDK%207-1a73e8?logo=googlegemini&logoColor=white)
![AG Grid](https://img.shields.io/badge/AG%20Grid-36-0e4491)
![AG Charts](https://img.shields.io/badge/AG%20Charts-14-0e4491)
![Tests](https://img.shields.io/badge/unit%20tests-244%20passing-1e9e5e)
![License: MIT](https://img.shields.io/badge/license-MIT-blue)

Built for the **PayPal AI Hackathon 2026** ("Build What's Next")

[**Run it**](#-run-it-yourself) &nbsp;|&nbsp; [**Watch the tour (video)**](docs/media/landing-tour.webm) &nbsp;|&nbsp; [**Judge's walkthrough**](#-the-judges-walkthrough) &nbsp;|&nbsp; [**How it works**](#-how-it-works)

<br/>

<img src="docs/media/hero-opening.gif" alt="The tmrw landing page opening: the headline lands word by word, the next 14 days tick in, and Thursday thumps in red" width="880" />

</div>

---

## Contents

- [The problem](#-the-problem)
- [What tmrw does](#-what-tmrw-does-spot-plan-steer)
- [See it move](#-see-it-move)
- [The judge's walkthrough](#-the-judges-walkthrough)
- [Every screen](#-every-screen)
- [The new laptop app](#-the-new-laptop-app-the-train)
- [How it works](#-how-it-works)
- [The Margin Guard](#-the-margin-guard-9-rules-in-plain-code)
- [PayPal integration](#-paypal-integration)
- [AI, with guardrails](#-ai-with-guardrails-gemini)
- [Tech stack](#-tech-stack)
- [Run it yourself](#-run-it-yourself)
- [Tests and quality](#-tests-and-quality)
- [Security and privacy](#-security-and-privacy)
- [What's simulated](#-whats-simulated)
- [What's next](#-whats-next)
- [Team and credits](#-team-and-credits)

---

## 💸 The problem

A small shop's money month lives in five places:

| | Where | What hides there |
|---|---|---|
| 01 | **The PayPal app** | Sales trickle in, one by one. |
| 02 | **Auto-debits** | Set up once, then forgotten. |
| 03 | **WhatsApp** | Suppliers and staff asking to be paid. |
| 04 | **A paper calendar** | Rent, supplier orders, staff pay. |
| 05 | **The owner's head** | Everything else. |

So two big bills land on the same day and nobody notices until that day. PayPal already holds most of this
data. tmrw puts it on one page that actually helps.

**The demo shop** is *Dunder Mifflin & Co.*, a small café-bakery that sells through PayPal (a sample shop with
made-up sales). Today in the demo is **Thu 5 Nov 2026**, and tmrw has already spotted the problem:

```
Thu 12 Nov       Rent                                  $1,500
                 Bean There (coffee beans)               $400
                 ───────────────────────────────────────────
                 Due that day                          $1,900
                 Free above the $200 safety cushion    $1,780
                 Short                                   $120
```

> "Clear until Wednesday. On Thu 12 Nov you'll be $120 short: the bean order and rent land the same day."
> *(the app's own headline, built by code from the forecast)*

---

## 🧭 What tmrw does: Spot. Plan. Steer.

<img src="docs/media/landing-blocks.png" alt="Spot, Plan, Steer: three colour blocks" width="880" />

| | | |
|---|---|---|
| **1. Spot** | Reads PayPal history, finds every regular payment (supplier orders, bills, auto-debits) and works out the next **30 days**, day by day. | Finds the short day a week early: Thu 12 Nov, $120 short, *because the bean order and rent land the same day.* |
| **2. Plan** | Lays the month out on one page: **Must pay** $4,839, **Coming in** about $6,939, **Want to do** (a second oven, $1,200), and a **focus line** ("Second oven before Christmas"). | Plans only fit in after every must-pay is safe. |
| **3. Steer** | Offers fixes for the short day: remind a customer who owes, move a payment, or a small short-term loan. **Every one goes through the Margin Guard**, and money only moves when the owner taps. | 9 fixed rules, a receipt every time. |

---

## 🎬 See it move

Everything below runs **tmrw's real forecast and real Guard rules** on the sample shop. It's straight from the
landing page, with no mock numbers.

<table>
<tr>
<td width="50%" valign="top">

**Can you save Thursday?**<br/>
Pick a fix. The two weeks re-run, the tickets that change flip over, money drops into Thursday's ticket, and the
shopkeeper reacts.

- *Remind Ivory & Vow*: Thu 12 ends at **$311, Covered**
- *Move Bean There to Sat 14 Nov*: **$480, Covered**
- *Borrow $120* ($122.40 back on Sat 14 Nov): **$200, Tight**

Each one: *Safety check: Needs your OK* (rule 8).

</td>
<td width="50%"><img src="docs/media/save-thursday.gif" alt="Picking fixes for Thursday" /></td>
</tr>
<tr>
<td width="50%" valign="top">

**Bring lost payments back**<br/>
Ivory & Vow, a wedding planner, owes **$240** for a tiered cake. tmrw drafts a reminder with a fresh PayPal link.
Pay it and watch the money land:

**+$231.13** arrives ($240.00 minus PayPal's $8.87 fee). tmrw counts what *arrives*, never the price on the
order. Bean There's $400 goes from **$280 ready** to **$400 ready, Covered**.

</td>
<td width="50%"><img src="docs/media/money-comes-back.gif" alt="The customer pays and the money arrives" /></td>
</tr>
<tr>
<td width="50%" valign="top">

**Nothing moves without passing it**<br/>
Three real decisions from the Guard, each with its thermal receipt:

- 🟨 **Needs your OK**: a $240 reminder is over $100.
- 🟥 **Blocked**: Hana Sato never agreed to be contacted (rule 2).
- 🟥 **Blocked**: Ivory & Vow already paid. PayPal says the order is captured (rule 1).

</td>
<td width="50%"><img src="docs/media/margin-guard.gif" alt="The Margin Guard's three decisions" /></td>
</tr>
</table>

🎥 **Full landing page tour:** [docs/media/landing-tour.webm](docs/media/landing-tour.webm) (about 60 seconds, opens in your browser)

---

## 🧑‍⚖️ The judge's walkthrough

The real app, end to end, on your own private copy of the shop. Open **`/demo`** (the demo guide) for the
step-by-step version.

**PayPal sandbox buyer login** (a test account with play money, for step 4):

| Email | Password |
|---|---|
| `sb-awbkq53701713@personal.example.com` | `Rahul1234` |

<img src="docs/media/owner-flow.gif" alt="Today, Decisions, the sent reminder, PayPal sandbox checkout, a receipt, and Ask" width="880" />

| # | Where | Do | What you'll see |
|---|---|---|---|
| 1 | **Overview** `/today` | Read the top card. | *"Short by $120 on Thu 12 Nov"*: $1,780 free above the $200 minimum, but rent ($1,500) and the bean order ($400) come to $1,900. Thu 12 is the red bar in the 30-day chart. |
| 2 | **Decisions** `/approvals` | Open it. The reminder helper and the risk check run, and the Guard decides each proposal. | Sam Whitfield's **$64** reminder: **Approved** and sent (simulated outbox). Ivory & Vow's **$240** reminder: **Needs your OK** (over $100). Risky orders wait as holds: Jordan Reyes $432, Isla Moreno $320. |
| 3 | **Decisions** | Press **Approve** on Ivory & Vow's reminder. | The Guard re-checks its blocking rules, then the executor creates a **real PayPal sandbox order**. *Sent reminders* shows the drafted message with a **Pay in PayPal Sandbox** link (`sandbox.paypal.com/checkoutnow?token=…`). |
| 4 | **PayPal sandbox** | Open the link and log in with the sandbox buyer above. Pay. | PayPal captures it. The return page and the signed webhook record the gross, PayPal's fee and the net: at 3.49% + $0.49 that's **$240.00, $8.87 fee, $231.13 net**. Whichever arrives second changes nothing. |
| 5 | **Overview** | Look again. | The net amount lands in today's ledger. Thu 12 Nov is no longer short. |
| 6 | **Decisions** | Press **Send a follow-up** on the same reminder. | **Blocked** by rule 1: PayPal shows the order already paid. The receipt says why. |
| 7 | **Fix the gap** `/fix` | On a fresh copy, compare the fixes. | *Move Bean There's $400 to Sat 14 Nov* (Thu 12 becomes $480, covered) or *a $120 short-term loan* ($122.40 back on Sat 14 Nov, Thu 12 becomes $200, tight). Both simulated, both need your OK. |
| 8 | **Ask** `/ask` | Press *"Can I afford a $200 order on Monday?"* | **No.** Mon 9 Nov would end at $1,233, but Thu 12 Nov would be **$320 short** (it's $120 short without the order). Every number comes from a tool, never from the model. |

**Reset** on `/demo` restores your copy exactly and starts a new demo run. Other visitors' copies are never
touched.

> ✅ **Verified while writing this README:** every step was run on a fresh copy in a headless browser and matches
> the table. That includes a **real PayPal sandbox payment** with the buyer above: PayPal captured $240.00, took an
> $8.87 fee and $231.13 arrived. Overview then read *"Your cash is covered for the next 30 days"* (Thu 12 Nov's
> lowest balance is $311), and the follow-up reminder was **Blocked**: *"PayPal shows order #1760 already paid"*.

---

## 🖥 Every screen

<table>
<tr>
<td width="50%"><b>Overview</b> <code>/today</code><br/><img src="docs/media/app-today.png" alt="Overview" /></td>
<td width="50%"><b>Decisions</b> <code>/approvals</code><br/><img src="docs/media/app-approvals.png" alt="Decisions" /></td>
</tr>
<tr>
<td><b>Sent reminders</b> (real PayPal sandbox links)<br/><img src="docs/media/app-sent.png" alt="Sent reminders" /></td>
<td><b>PayPal sandbox checkout</b><br/><img src="docs/media/paypal-sandbox.png" alt="PayPal sandbox checkout" /></td>
</tr>
<tr>
<td><b>One receipt</b> <code>/receipts/[id]</code><br/><img src="docs/media/app-receipt.png" alt="A Margin Guard receipt" /></td>
<td><b>Every decision</b> <code>/receipts</code><br/><img src="docs/media/app-receipts.png" alt="Receipts" /></td>
</tr>
<tr>
<td><b>Fix the gap</b> <code>/fix</code><br/><img src="docs/media/app-fix.png" alt="Fix the gap" /></td>
<td><b>Ask</b> <code>/ask</code><br/><img src="docs/media/app-ask.png" alt="Ask" /></td>
</tr>
<tr>
<td><b>Forecast</b> <code>/dashboard</code>, with <b>AG Charts</b><br/><img src="docs/media/app-agcharts.png" alt="The 30-day forecast drawn with AG Charts" /></td>
<td><b>Forecast</b> <code>/dashboard</code>, with <b>AG Grid</b><br/><img src="docs/media/app-aggrid.png" alt="Upcoming payments in AG Grid" /></td>
</tr>
<tr>
<td><b>Payments</b> <code>/dues</code><br/><img src="docs/media/app-dues.png" alt="Payments" /></td>
<td><b>Tech, on the landing page</b><br/><img src="docs/media/landing-tech.png" alt="Landing page tech section" /></td>
</tr>
<tr>
<td><b>Settings</b> <code>/settings</code><br/><img src="docs/media/app-settings.png" alt="Settings" /></td>
<td><b>The shop's storefront</b> <code>/store</code><br/><img src="docs/media/app-store.png" alt="Storefront" /></td>
</tr>
<tr>
<td><b>Demo guide</b> <code>/demo</code><br/><img src="docs/media/app-demo.png" alt="Demo guide" /></td>
<td></td>
</tr>
</table>

<p align="center">
<img src="docs/media/phone-today.png" alt="Overview on a phone" width="270" />&nbsp;&nbsp;&nbsp;
<img src="docs/media/phone-landing.png" alt="Landing page on a phone" width="270" /><br/>
<sub>Phone-first: every screen is built at 390px first, and finished at 1280px.</sub>
</p>

| Route | What it is |
|---|---|
| `/` | Landing page: one page in tabs (Problem, What it does, Features, Tech, Next up, GitHub, Try it now), with a spotlight on the section you're reading |
| `/today` | Overview: the warning card, cash today, the lowest day ahead, the 30-day chart |
| `/dashboard` | 30-day forecast: the AG Charts balance chart and AG Grid tables of upcoming payments and recent orders on laptop (light versions on a phone) |
| `/dues` | Every payment in the next 30 days and how ready it is |
| `/fix` | Ways to cover the short day, each sent to the Margin Guard |
| `/approvals` | Decisions: what needs your OK, the history, and the sent reminders (simulated outbox) |
| `/receipts`, `/receipts/[id]` | Every Guard decision, filterable; one receipt printed in full |
| `/ask` | Plain questions, answered only from the shop's own numbers |
| `/settings` | Minimum balance, warning zone and three questions about the shop |
| `/data`, `/onboarding` | For a real merchant: opening balance, transactions, upcoming bills, CSV import, and setup |
| `/demo` | The judges' guide: the story steps, the sandbox buyer login, and Reset |
| `/store` | The buyer's side: Dunder Mifflin & Co.'s shop with PayPal checkout |
| `/try` | Try tmrw on your own numbers: no login, nothing saved |
| `/app` | The new laptop app (the train), in progress |
| `/login`, `/register` | Merchant accounts |

---

## 🚆 The new laptop app (the train)

The next version of tmrw is a calm, painted world. You log in, answer the setup questions (10 short steps, each
pre-filled from PayPal history), and the morning starts at a country station. Scroll, and the train rolls in, stops
and opens its doors. Scroll again, and you're in a window seat: **Calendar**, **Ventures** and **Insights** pass by,
with a dock for Settings, Daily brief, Requests and Pro. There's a day and night mode.

<p align="center"><img src="docs/media/train-app.gif" alt="The train app: login, setup, the station, the train arriving, the window seats" width="760" /></p>

<table>
<tr>
<td width="33%"><img src="docs/media/train-station.jpg" alt="The station" /></td>
<td width="33%"><img src="docs/media/train-doors.jpg" alt="The train with its doors open" /></td>
<td width="33%"><img src="docs/media/train-seat.jpg" alt="The window seat with the Calendar" /></td>
</tr>
</table>

> **Status:** the journey, login and setup work, and setup saves its answers on the shop. The windows themselves
> (Calendar, Ventures, Insights, and the dock's items) are still **"Coming soon"** placeholders. That's why the
> landing page's main buttons go to `/demo`, where everything works.

---

## 🧩 How it works

```mermaid
flowchart LR
    subgraph PayPal["PayPal (sandbox only)"]
        H[(Order and payment history)]
        API[Orders v2, Payments, Payouts]
        WH[Signed webhooks]
    end

    H --> F["Forecast (lib/forecast)<br/>plain code: 30 days, regular payments,<br/>net after PayPal's fee"]
    F --> AG["Agents propose<br/>reminder helper, risk check, owner's fixes"]
    AI["Gemini via AI SDK<br/>drafts and explains only"] -. words, never numbers .-> AG
    AG --> G{"Margin Guard<br/>9 deterministic rules"}
    G -- APPROVE --> X[Executor]
    G -- ESCALATE --> O[Owner's inbox] -- Approve --> R[Re-check BLOCK rules] --> X
    G -- BLOCK --> S[Stop + receipt]
    X --> API
    API --> WH --> L[(Ledger: net amount)] --> F
    G --> RC[(Append-only receipts)]
```

**The safety model (non-negotiable):**

1. **Propose, decide, execute.** Agents and the owner's choices create *proposals*. The Margin Guard decides.
   Only the Guard's executor carries anything out.
2. **No money moves without passing the Guard.** All 7 action types go through it: `SEND_REMINDER`,
   `SET_ASIDE`, `MOVE_PAYMENT`, `GAP_LOAN`, `PAY_SUPPLIER`, `REFUND`, `HOLD_ORDER`.
3. **AI never calculates money.** Every amount, date and forecast comes from tested code.
4. **AI never calls PayPal.** ESLint enforces it: only the Guard's executor, the store checkout routes and the
   webhook route may import `lib/paypal`.
5. **AI failure is not app failure.** Every AI feature has a plain fallback.
6. **Simulated means labelled.** Seeded history, loans, moved dates and the reminder outbox all say "Simulated".
7. **PayPal sandbox only.** `lib/paypal` refuses any base URL except `https://api-m.sandbox.paypal.com`.

**The forecast** (`lib/forecast`, pure code, no AI):

- **Money in:** the average net sales (after PayPal's fee) for each weekday over the last 8 weeks.
- **Money out:** scheduled bills plus the next payments of regular payees found from history.
- **Found from history:** at least 3 payments within 15% of the median amount, at a steady interval (every N
  days, every N weeks on the same weekday, or monthly).
- **Day state:** *short* below the minimum balance, *tight* just above it, otherwise *covered*. Each day says how
  much of each payment is **ready**.
- **Confidence:** from how much weekly sales swing.
- **What-ifs:** the forecast re-runs with a proposed action applied. That's how the Guard's rule 6 and the fixes
  work.

---

## 🛡 The Margin Guard: 9 rules in plain code

`lib/guard/rules.ts` holds pure functions: `(proposal, context) → PASS | FAIL | N/A`, each with a plain reason. A
separate loader gathers the facts first (database rows, the forecast before and after, PayPal's order status), so
every rule is unit-tested.

| # | Rule | Applies to | Fails when | On fail |
|---|---|---|---|---|
| 1 | Already paid | Reminders | PayPal shows the order captured | 🟥 Block |
| 2 | Consent | Reminders | The customer hasn't allowed contact | 🟥 Block |
| 3 | Contact frequency | Reminders | 2 reminders already sent for this order in 48 hours | 🟥 Block |
| 4 | Risk hold | Reminders, refunds | The order is on risk hold | 🟨 Needs your OK |
| 5 | Duplicate action | All | The same idempotency key already exists | 🟥 Block |
| 6 | Minimum balance | Pay supplier, refund, move, loan, set-aside | Some day in the forecast drops below the minimum **and** lower than before | 🟥 Block |
| 7 | Set-aside cap | Set-aside | More than 30% of that day's expected sales | 🟥 Block |
| 8 | Owner approval | Loans, moves, refunds always; anything over **$100** | Always, when it applies | 🟨 Needs your OK |
| 9 | Total spending | Pay supplier, refund, loan | Over **$500** in 7 days, counting this one | 🟨 Needs your OK |

- **Decision:** Block if any failing rule blocks, otherwise Needs your OK if any escalates, otherwise Approved.
  The headline reason is the lowest-numbered failing rule.
- **Fails closed:** a rule that can't be checked (PayPal unreachable, a missing order, a forecast that can't run)
  **fails**.
- **Owner approval clears escalations only.** Just before executing, the BLOCK rules run again with fresh facts. If
  one now fails, nothing runs and the receipt says why. A double click can't approve twice.
- **Idempotency:** every proposal carries `<demo run id>:<action>:<target>:<sequence>`. A retry reuses its key, so
  rule 5 blocks it. A genuinely new attempt gets the next sequence, so rule 3 judges it. PayPal's
  `PayPal-Request-Id` comes from the same key.
- **Receipts are append-only.** Each holds the request, all 9 rule results with reasons, the decision, every
  PayPal ID checked or created, the key, both timestamps (demo date and real time), and later the owner's
  decision and the execution result. Printed as a thermal shop receipt, with a BLOCKED stamp when blocked.

---

## 💳 PayPal integration

All PayPal HTTP calls live in **one file**, `lib/paypal/client.ts`: a small typed REST wrapper, with responses
parsed by zod.

| PayPal API | Used for | Where |
|---|---|---|
| **Orders v2**: create, get, capture | Storefront checkout; a **fresh checkout link** in each approved reminder; the Guard's "already paid?" check | `app/store/checkout`, `app/store/return`, Guard executor and context loader |
| **Webhooks**, with signature verification | `CHECKOUT.ORDER.APPROVED`, `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`, `PAYMENT.CAPTURE.REFUNDED` | `app/api/paypal/webhook` |
| **Payments**: refund | The `REFUND` action | Guard executor |
| **Payouts** | The `PAY_SUPPLIER` action | Guard executor |

- **Right copy, every time:** each PayPal order carries the visitor's `storeId` in `custom_id`, so a webhook
  updates the right shop.
- **Net money in:** a capture records gross, fee and **net**, and only the net reaches the forecast. In the demo,
  PayPal's fee is 3.49% + $0.49: $240.00 gives a $8.87 fee and $231.13 net.
- **Webhooks:** verify the signature first (a bad one changes nothing), store each event id once (repeats are
  ignored), handlers are idempotent, and the route returns 2xx quickly. The buyer's return and the webhook can
  arrive in either order, or twice, with the same result.
- **Fresh links:** checkout links are created when a reminder is approved, never in the seed, because approval
  links expire.
- **Three modes, no code change:**
  - **sandbox** when `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` are set;
  - **fake** with `PAYPAL_FAKE=1`, a clearly labelled stand-in page for tests and offline demos (refused in
    production);
  - **off** otherwise, where screens say "PayPal isn't set up yet" and nothing calls PayPal.

  [`SWITCH-ON.md`](SWITCH-ON.md) has the exact steps: the sandbox app, accounts, webhook registration and one real
  test payment.
- **Agent Toolkit:** deliberately not used. Our calls are a handful of plain endpoints, and a typed wrapper keeps
  PayPal away from any AI code. The toolkit's tool-calling design would invite exactly that.

---

## 🤖 AI, with guardrails (Gemini)

AI is used for **words, never numbers**. All AI setup lives in one file, `lib/ai/model.ts`: Google Gemini through
the Vercel **AI SDK** (`ai` + `@ai-sdk/google`). The default model is `gemini-3.5-flash-lite`. Switching to
OpenRouter means editing only that file.

| Feature | What the AI does | What code does |
|---|---|---|
| **Ask** (`/ask`) | Answers questions in plain words, **only through 4 read-only tools**: `getForecast`, `listDues`, `canAfford(amountDollars, date)`, `listRecentPayments` | Every tool returns numbers calculated by `lib/forecast`. Code checks the answer, and the facts shown under it are built by code. |
| **Reminder drafts** | Drafts the message to a customer (structured output, zod-validated, exactly one `{checkout_link}`, no amounts) | The Guard decides whether it's sent at all. |
| **Explanations** | One line under the headline on *why* the short day is short; one line under each found payment on what it was found from; one line on why an order looks risky | Templates are the fallback. |

**Guardrails:**

- **Checked drafts** (`lib/ai/checks.ts`): no `!`, no emoji, no banned words ("unlock", "seamless", "AI-powered"…),
  and **no number that wasn't in the input**. A failing draft falls back to a template.
- **Untrusted text** (customer names, notes) goes into prompts as data, never as instructions.
- **Never down:** a 20-second limit per call, one retry, then the plain fallback. With no key, every AI feature still works
  from code.
- **Free-tier friendly** (`lib/ai/pool.ts`):
  - several keys and models can be pooled, each with its own budget (8 a minute, 200 a day by default);
  - each visitor is limited too (8 answers in 10 minutes, 40 a day);
  - AI texts are remembered by the facts they were written from, so visitors at the same story step cost no new
    requests.
- **Honest labels:** "Written for you from your forecast, and checked", never "AI-powered".

---

## 🛠 Tech stack

| Layer | What we use |
|---|---|
| App | **Next.js 16.4** (App Router, `proxy.ts`), **React 19.3**, **TypeScript 6** (strict, no `any`) |
| UI | **Tailwind CSS 4.3** (CSS-first, locked palette), plain CSS animations (no animation library), PWA manifest |
| Data | **PostgreSQL on Supabase** (Paris) + **Prisma 7.10** via `@prisma/adapter-pg` |
| Payments | **PayPal sandbox**: Orders v2, Webhooks, Payments, Payouts (typed REST wrapper) |
| AI | **Google Gemini** through the **AI SDK 7** (`ai`, `@ai-sdk/google`), zod-validated structured output and tool calling |
| Tables | **AG Grid Community 36**: upcoming payments (with "ready on the day" bars) and recent orders, laptop-only, loaded on demand |
| Charts | **AG Charts Community 14**: the Forecast page's 30-day balance chart, with each day coloured covered, tight or short, the minimum balance as a dashed line, the short day banded, and each day's money in and out on hover. Laptop-only, loaded on demand; a light SVG version on a phone |
| Validation | **zod 4** for every request, env var, AI output and PayPal response |
| Tests | **Vitest 5** (unit), **Playwright 1.64** (end to end) |
| Quality | **ESLint 9** with import-boundary rules (who may import PayPal, the database, AI) |
| Hosting | **Render** web service (Frankfurt), `render.yaml` blueprint; `/api/health` (one `SELECT 1`) and `/api/ping` for uptime |

**Money is integer cents** (a `Cents` type), never floats. **"Today" comes from one clock**
(`lib/shared/clock`), which honours `DEMO_TODAY=2026-11-05`, so the demo replays identically every time.

<details>
<summary><b>Project structure</b></summary>

```
app/
  (landing)/        landing page (/) and /try
  (owner)/          the owner's app: today, dashboard, dues, fix, approvals, receipts, ask, settings, data, demo
  (tmrw)/app        the new laptop app (the train)
  (auth)/           login, register, verify email
  store/            the buyer's storefront and PayPal checkout routes
  api/              paypal/webhook, health, ping, forecast, guard, ai, demo/reset, auth
lib/                each module exposes its public API from index.ts
  forecast/         30-day forecast, regular-payment detection, fixes, month page (pure code)
  guard/            the Margin Guard: 9 rules, context loader, executor, append-only receipts
  paypal/           the ONE place that talks to PayPal (client.ts, webhook.ts)
  ai/               the ONE place that talks to a model (model.ts), Ask tools, drafts, checks, budgets
  recovery/         the reminder helper: finds unfinished checkouts, proposes reminders
  risk/             risk check (unusual amount, new buyer's big order, repeated failures) and alerts
  demo/             the simulated sample shop, one private copy per visitor, reset
  store/            catalogue, orders, payment attempts, webhook transitions
  auth/             accounts, sessions, rate limits, tenant isolation
  finance/          real-merchant data entry and CSV import
  landing/          the landing page's story, from the real forecast and Guard
  shared/           money (cents), dates, the demo clock, env (zod), db
components/         ui (design system), app, landing, dashboard (AG Grid), charts (AG Charts), tmrw (the train)
prisma/             schema and migrations
tests/e2e/          Playwright: smoke tests, real-merchant journey
```

</details>

---

## 🚀 Run it yourself

**You need:** Node 22 (`.nvmrc`) and npm. Supabase, PayPal sandbox keys and a Gemini key are all **optional**: the
app runs without them.

```bash
git clone https://github.com/Rahulkumar0407/paypal.git && cd paypal
nvm use                  # Node 22
npm ci
cp .env.example .env     # fill in what you have (see below)
npm run db:migrate       # only with a database
npm run db:reset         # only with a database: loads the sample shop
npm run dev              # http://localhost:3000
```

Then open **http://localhost:3000** (landing page) and **http://localhost:3000/demo** (the guided story).

<details>
<summary><b>Environment variables</b> (every key is in <code>.env.example</code>)</summary>

| Key | What it's for | Without it |
|---|---|---|
| `DATABASE_URL` | Supabase pooled connection (the app) | Pages fall back to the in-memory sample shop |
| `DIRECT_URL` | Supabase direct/session connection (migrations) | No migrations |
| `DEMO_TODAY` | The fixed "today": `2026-11-05` | |
| `APP_URL` | Public base URL for PayPal return links and reminders | `http://localhost:3000` |
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` | The PayPal **sandbox** app | "PayPal isn't set up yet", checkout off |
| `PAYPAL_WEBHOOK_ID` | The webhook registered for `APP_URL/api/paypal/webhook` | Webhooks can't be verified |
| `PAYPAL_API_BASE` | Must be `https://api-m.sandbox.paypal.com` | |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | Same as the client id, for the store page | |
| `PAYPAL_FAKE` | `1` for the fake PayPal mode (tests, offline; refused in production) | |
| `AI_MODEL` | Gemini model(s), comma-separated, tried in order. Default `gemini-3.5-flash-lite` | Every AI feature uses its plain fallback |
| `GOOGLE_GENERATIVE_AI_API_KEY` | One key, or several comma-separated | Same |
| `AI_MAX_REQUESTS_PER_MINUTE`, `AI_MAX_REQUESTS_PER_DAY` | The app's own budget per key and model (8 and 200) | |

</details>

| Command | What it does |
|---|---|
| `npm run dev` | Start the app on http://localhost:3000 |
| `npm run build` / `npm start` | Generate the Prisma client, build, and run for production |
| `npm run check` | **Lint + typecheck + unit tests.** Run before every push. |
| `npm test` | Vitest unit tests |
| `npm run e2e` | Playwright end-to-end tests (starts the dev server) |
| `npm run db:migrate` | Apply migrations (`prisma migrate deploy`) |
| `npm run db:reset` | Delete every demo copy and recreate the local one from the seed |
| `npm run db:generate` | Regenerate the Prisma client |

**Deploy:** `render.yaml` is a Render blueprint (Frankfurt, Node 22). It runs `npm ci && npm run build`, applies
migrations before each release, and health-checks `/api/health`. Secrets are entered once in Render's dashboard,
never in the file.

---

## ✅ Tests and quality

- **244 unit tests in 32 files** (Vitest), all passing. Highlights:
  - `lib/guard/rules.test.ts`: every rule passing and failing, N/A, precedence, the story's decisions;
    `flow.test.ts` covers the whole propose, decide, approve, re-check and execute flow in memory.
  - `lib/forecast/demo-story.test.ts`: the seed produces the story's exact numbers.
  - `lib/landing/story.test.ts`: the landing page's numbers come from the real forecast and Guard (Thu 12 Nov $120
    short; Ivory & Vow nets $231.13; the three real decisions).
  - `lib/paypal/*.test.ts`: request ids, sandbox-only, fake mode refused in production, capture breakdown, a bad
    webhook signature changes nothing, each event applied once.
  - `lib/ai/*.test.ts`: Ask answers kept only when their numbers come from the tools, the voice checks, key pools
    and budgets (with the AI SDK's mock model, so no network).
  - `lib/auth/security-gate.test.ts` and `tenant.test.ts`: two merchants can't read or decide each other's data.
- **End to end** (Playwright, phone and laptop sizes): smoke tests of the main pages, *each visitor gets their own
  store*, and a real-merchant journey.
- **CI** (`.github/workflows/check.yml`): on every push and pull request, `npm ci`, then lint, typecheck, unit
  tests and a **production build**.
- **ESLint import boundaries:** only allowed modules may import PayPal, the database client or an AI provider.

---

## 🔒 Security and privacy

- **PayPal sandbox only.** Live URLs are refused in code, and fake mode is refused in production.
- **Secrets** only in `.env` (gitignored) and Render's dashboard. The only login that may ever be published is a
  sandbox *buyer* account.
- **Accounts:** passwords hashed with scrypt and a random salt, compared in constant time. Sessions are HTTP-only,
  `sameSite=lax` cookies (secure in production). Login and registration are rate-limited.
- **Tenant isolation:** each merchant only sees and decides their own store, enforced and tested.
- **One copy per visitor:** a cookie maps each browser to its own copy of the sample shop, so judges never see each
  other's actions. Reset only touches your own copy.
- **Webhooks:** signature verified before anything changes, and every event processed once.
- **Prompt safety:** customer text is passed to the model as data, never as instructions.

---

## 🎭 What's simulated

Honesty is part of the product. Anything simulated says **Simulated** on screen.

| Real | Simulated |
|---|---|
| The forecast engine, the Margin Guard, receipts, the AI features | **Dunder Mifflin & Co.**: 90 days of made-up sales history |
| **PayPal sandbox** orders, capture, webhooks (and refunds and payouts, through the Guard) | **The reminder outbox**: messages aren't really emailed |
| Accounts, sessions, per-visitor copies, reset | **Moved payment dates** and **short-term loans**: nothing real changes |
| | **The demo clock**: today is always Thu 5 Nov 2026 |

---

## 🗺 What's next

| | | |
|---|---|---|
| **Up next** | **Pip edits the page** | Snap a bill or type an instruction; changes show dashed; tap Keep or Discard. |
| **Up next** | **Requests inbox** | Staff and suppliers ask in the app, not on WhatsApp. Repeats are grouped, then code checks the money and timing. |
| Planned | **Learns from your edits** | Move the bean order to Monday once; next month it's on Mondays. |
| Planned | **Calendar, Ventures and Insights** | The windows of the new laptop app, fully designed. |
| Planned | **A real PayPal loan offer** | As a last resort, with the fee shown up front. |

---

## 👥 Team and credits

| | |
|---|---|
| **Diwakar Mishra** | Foundation, forecast, Margin Guard, PayPal integration, owner app, landing page |
| **Rahul Kumar** ([@Rahulkumar0407](https://github.com/Rahulkumar0407)) | Accounts and security, real-merchant onboarding and data import, the owner app's redesign, the v2 illustrated landing page |
| **Ashima Arora** | The tmrw product and story, the month page, the new laptop app (the train) and its design |

**Built with AI coding agents:** Claude Code (Anthropic) and Gemini (Google), as development tools. Inside the
app, Gemini is the runtime model behind the AI features. The rules every agent followed are in
[`AGENTS.md`](AGENTS.md).

**Design:**
- The landing page's look and its shopkeeper illustrations come from the v2 page (`public/landing`).
- The paintings, logo and app icons of the new laptop app come from the design handoff in `design/tmrw-handoff/`.
- Fonts: Inter, Plus Jakarta Sans, Fraunces and JetBrains Mono.

**Docs in this repo:** [`AGENTS.md`](AGENTS.md) (product rules), [`SWITCH-ON.md`](SWITCH-ON.md) (turning on the
PayPal sandbox), [`DEMO.md`](DEMO.md) (the demo story's numbers, worked by hand), and a `README.md` inside each `lib/`
module.

---

<div align="center">

**MIT licensed** &nbsp;|&nbsp; PayPal sandbox only &nbsp;|&nbsp; Dunder Mifflin & Co. is a sample shop with made-up sales

*AI never calculates money. Code does.*

</div>
