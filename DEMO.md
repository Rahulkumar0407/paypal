# DEMO.md: the demo story's numbers

Every number in the demo story, worked out by hand from the seed, so anyone can check what the app shows.
Everything here is **simulated** (the seed in `lib/demo/seed.ts`). The real forecast (`lib/forecast`) produces exactly
these numbers; `lib/forecast/demo-story.test.ts` checks them.

- **Today:** Thu 5 Nov 2026 (`DEMO_TODAY=2026-11-05`). "Monday" in the story is Mon 9 Nov.
- **Shop:** Dunder Mifflin & Co., a small café-bakery that takes orders through PayPal. USD. Penny is the owner.
- **Minimum balance:** **$200**. A day is **tight** below $300 (within $100 of the minimum), **short** below $200.
- **PayPal's fee:** 3.49% + $0.49 per capture. **Confirmed** by a real sandbox capture of Ivory & Vow's $240 order
  on 12 Nov 2026: gross $240.00, fee $8.87, net $231.13.

The step-by-step judge script is on the demo guide page (`/demo`) and in section 9 below.

---

## 1. The seed

| What | Numbers |
|------|---------|
| History | 90 days, Fri 7 Aug to Wed 4 Nov |
| Opening balance | $2,057.91 on Fri 7 Aug |
| Sales | 759 orders, $19,881.17 after PayPal's fee. Busier at weekends. |
| Bean There (coffee beans) | 9 payments, about $400 every 10 days, last Mon 2 Nov ($3,601 in all) |
| Oat of Office (oat milk) | 3 payments, monthly on the 15th ($495 in all) |
| Bills | rent $1,500 on the 12th, staff pay $1,600 on the 28th, internet $60 on the 3rd, card machine $49 on the 13th (3 months each: $9,627) |
| Loan | oven loan $250 on the 25th ($750 in the history) |
| Transfers to the owner's bank | 4 in the history ($7,200). None is due in the next 30 days. |
| **Balance at the start of today** | **$266.08** = 2,057.91 + 19,881.17 − 9,627 − 4,096 − 7,200 − 750 |

Open orders:

| Order | Customer | Status | Total | Why it's there |
|-------|----------|--------|-------|----------------|
| #1760 | Ivory & Vow | Unpaid since Tue 3 Nov, due Wed 18 Nov | $240.00 | A tiered wedding cake. The reminder story (steps 2 to 4). They allowed contact. |
| #1761 | Hana Sato | Abandoned on Wed 4 Nov | $24.00 | She did not allow contact: Guard rule 2 blocks a reminder. |
| #1762 | Jordan Reyes | Pending | $432.00 | Risky: a brand-new buyer with a big order. Not counted until it's cleared. |
| #1763 | Sam Whitfield | Failed, 3 attempts | $64.00 | Risky: repeated failed attempts. |
| #1764 | Isla Moreno | Pending | $320.00 | Risky: an unusual amount for a regular customer. Not counted until it's cleared. |

Goals (the month page's *Want to do*): a second oven, $1,200 ($320 saved), by Sat 21 Nov; a stall at the Winter
Makers' Market, $300, Sun 6 Dec; Christmas cookie boxes, $450, Sat 12 Dec. Focus line: *"Second oven before
Christmas"*.

## 2. Regular payments found from the history

| Found | Status at the start |
|-------|--------------------|
| "Bean There, about $400 every 10 days, next on Thu 12 Nov." | Found, not confirmed |
| "Card machine, $49 on the 13th, next on Fri 13 Nov." (an auto-debit nobody wrote down) | Found, not confirmed |
| Rent $1,500 on the 12th; Oat of Office $180 on the 15th; oven loan $250 on the 25th; staff pay $1,600 on the 28th; internet $60 on the 3rd | Confirmed |

A found payment counts in the forecast straight away (ignoring it would hide the gap); confirming saves its next
payments at the same dates and amounts, so the numbers don't change. **November's must-pays come to $4,839.**

## 3. Expected sales

Average net sales for each weekday over the last 8 weeks:

| Sun | Mon | Tue | Wed | Thu | Fri | Sat |
|-----|-----|-----|-----|-----|-----|-----|
| $292.87 | $206.18 | $188.92 | $184.16 | $173.60 | $178.25 | $316.34 |

**Confidence: high.** A usual week lands within about 8% of the 8-week average.

## 4. Story step 1: $120 short on Thu 12 Nov

By hand, from the start of today to the end of Thu 12 Nov:

```
  Balance at the start of Thu 5 Nov                           266.08
+ Sales Thu 5 to Thu 12 (Thu, Fri, Sat, Sun, Mon, Tue, Wed, Thu)
    173.60 + 178.25 + 316.34 + 292.87 + 206.18 + 188.92 + 184.16 + 173.60
                                                          + 1,713.92
− Rent, Thu 12 Nov                                        − 1,500.00
− Bean There, Thu 12 Nov                                    − 400.00
= Thu 12 Nov closes at                                         80.00
  Minimum balance                                             200.00
= Short by                                                    120.00
```

On the 12th, $1,780.00 is above the minimum ($1,806.40 opening + $173.60 sales − $200). Rent is paid first and is
fully ready; Bean There gets the remaining $280.00 of its $400.00: **"$1,780 of $1,900 ready."**

The first 14 days:

| Day | Starts | In | Out | Ends | State |
|-----|-------:|---:|----:|-----:|-------|
| Thu 5 Nov | 266.08 | 173.60 | | 439.68 | Covered |
| Fri 6 Nov | 439.68 | 178.25 | | 617.93 | Covered |
| Sat 7 Nov | 617.93 | 316.34 | | 934.27 | Covered |
| Sun 8 Nov | 934.27 | 292.87 | | 1,227.14 | Covered |
| Mon 9 Nov | 1,227.14 | 206.18 | | 1,433.32 | Covered |
| Tue 10 Nov | 1,433.32 | 188.92 | | 1,622.24 | Covered |
| Wed 11 Nov | 1,622.24 | 184.16 | | 1,806.40 | Covered |
| **Thu 12 Nov** | 1,806.40 | 173.60 | 1,500.00 rent, 400.00 Bean There | **80.00** | **$120 short** |
| Fri 13 Nov | 80.00 | 178.25 | 49.00 card machine | 209.25 | Tight |
| Sat 14 Nov | 209.25 | 316.34 | | 525.59 | Covered |
| Sun 15 Nov | 525.59 | 292.87 | 180.00 Oat of Office | 638.46 | Covered |
| Mon 16 Nov | 638.46 | 206.18 | | 844.64 | Covered |
| Tue 17 Nov | 844.64 | 188.92 | | 1,033.56 | Covered |
| Wed 18 Nov | 1,033.56 | 184.16 | | 1,217.72 | Covered |

Headline: "Clear until Wednesday. On Thu 12 Nov you'll be $120 short: the bean order and rent land the same day."

## 5. Story step 3: Ivory & Vow pays the $240

```
  Order #1760                                                240.00
− PayPal's fee: 3.49% of 240.00 = 8.38, + 0.49               − 8.87
= Arrives in PayPal today                                    231.13

  Thu 12 Nov closes at 80.00 + 231.13 =                      311.13   Covered
```

Every one of the 30 days is now covered. Headline: "Clear for the next 30 days. Thu 12 Nov is covered too, when rent
and the bean order go out."

## 6. Fix the gap: the other ways

Worked out by `lib/forecast/fixes.ts` from the forecast, each one checked by running the forecast with it. Asked before
anyone pays (straight after a reset):

| Fix | Thu 12 Nov after | Guard |
|---|---|---|
| Move Bean There's $400 to Sat 14 Nov (simulated) | closes at $480: covered | Always needs your OK (rule 8) |
| A $120 short-term loan, 2% fee, $122.40 back on Sat 14 Nov (simulated) | closes at $200: tight | Always needs your OK (rule 8) |

There's no "set aside a little each day" fix in this story: it keeps money back from the owner's transfers to their
bank, and none is due before Thu 12 Nov.

## 7. Story step 6: "Can I afford a $200 order on Monday?"

Asked straight after a reset:

```
  Mon 9 Nov closes at 1,433.32; with the order:   1,433.32 − 200.00 = 1,233.32
  Thu 12 Nov closes at 80.00; with the order:          80.00 − 200.00 = −120.00
  Short by 200.00 − (−120.00) =                                         320.00
```

**Answer: no.** Monday itself is fine ($1,233.32 after the order), but Thu 12 Nov would be $320 short.

Asked after Ivory & Vow has paid: Mon 9 Nov closes at $1,464.45 after the order, and Thu 12 Nov at
311.13 − 200.00 = 111.13, so it would still be **$89 short** (exactly $88.87).

## 8. The month page (November)

| | |
|---|---|
| Must pay | $4,839 |
| Coming in | about $6,939 |
| Left for plans | about $2,100 |
| Verdict | "The month adds up. The 12th doesn't." |

## 9. Judge script

The judges' PayPal **sandbox buyer** login (a test account with play money; it's also on `/demo`):

| Email | Password |
|-------|----------|
| `sb-awbkq53701713@personal.example.com` | `Rahul1234` |

| Step | Where | Do | Expect |
|------|-------|----|--------|
| 1 | Overview (`/today`) | Read the top card. | "Short by $120 on Thu 12 Nov": $1,780 free above the $200 minimum, but rent ($1,500) and the bean order ($400) come to $1,900. |
| 2 | Decisions (`/approvals`) | Open it. The reminder helper checks unpaid and abandoned orders and the risk check checks pending ones; the Guard decides each. | Ivory & Vow's $240 reminder: **Needs your OK** (over $100). Sam Whitfield's $64 reminder: **Approved**, in Sent reminders (Simulated). Hana Sato's: **Blocked** (no consent). Holds on Jordan Reyes's $432 and Isla Moreno's $320 orders wait for your OK. |
| 3 | Decisions | Press **Approve** on Ivory & Vow's reminder, then open **Sent reminders**. | The reminder, with a **Pay in PayPal Sandbox** link to a fresh sandbox order. |
| 4 | PayPal sandbox | Open the link, log in as the sandbox buyer above, and press **Complete Purchase**. | The shop's paid page: you paid $240.00, PayPal's fee $8.87, $231.13 arrives. Overview: "Your cash is covered for the next 30 days." |
| 5 | Decisions → Sent reminders | Press **Send a follow-up** on Ivory & Vow's reminder. | **Blocked**: "PayPal shows order #1760 already paid". |
| 6 | Ask (`/ask`) | Press "Can I afford a $200 order on Monday?" | No. After the payment, Thu 12 Nov would be $89 short. (Straight after a reset: $320 short.) |

To try the other fixes, **Reset** on `/demo`, then open Fix the gap (`/fix`) before paying.

Reset (on `/demo`) puts your copy back at step 1 with a new demo run id. Other visitors' copies are never touched.
