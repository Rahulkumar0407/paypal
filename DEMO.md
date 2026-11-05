# DEMO.md: the demo story's numbers

Every number in the demo story, worked out by hand from the seed, so anyone can check what the app shows.
Everything here is **simulated** (the seed in `lib/demo/seed.ts`). The real forecast (`lib/forecast`) produces exactly
these numbers; `lib/forecast/demo-story.test.ts` checks every one.

- **Today:** Thu 5 Nov 2026 (`DEMO_TODAY=2026-11-05`). "Monday" in the story is Mon 9 Nov.
- **Store:** Loop Audio, USD. Minimum balance **$100**. A day is **tight** below $150 (within $50 of the minimum).
- **PayPal's fee:** 3.49% + $0.49 per capture, PayPal's published US rate. **Confirmed** by a real sandbox capture of
  the $72 order on 3 Nov 2026: gross $72.00, fee $3.00, net $69.00.

The step-by-step judge script is on the demo guide page (`/demo`) and in section 9 below.

---

## 1. The seed

| What | Numbers |
|------|---------|
| History | 90 days, Fri 7 Aug to Wed 4 Nov |
| Opening balance | $3,133.50 on Fri 7 Aug |
| Sales | 257 orders, $21,831.06 after PayPal's fee. Busier at weekends. |
| Volta Audio Parts | every 10 days, last Mon 2 Nov: $304, $294, $312, $300, $291, $307, $300, $297, $305 ($2,710) |
| Transfers to the owner's bank | every other Monday, last Mon 26 Oct: $2,530, $2,480, $2,500, $2,545, $2,500, $2,465 ($15,020) |
| Bills (confirmed) | rent $1,200 on the 12th, store software $99 on the 13th, internet $60 on the 3rd, shipping supplies $240 on the 30th ($4,797 in the history) |
| Loan (confirmed) | equipment loan $150 on the 25th ($450 in the history) |
| Lowest balance in the history | $433.40 on Tue 13 Oct (the day after rent and a transfer) |
| **Balance at the start of today** | **$1,987.56** = 3,133.50 + 21,831.06 − 2,710 − 15,020 − 4,797 − 450 |

Open orders:

| Order | Customer | Status | Total | Why it's there |
|-------|----------|--------|-------|----------------|
| #1258 | Maya Okafor | Abandoned on Tue 3 Nov | $72.00 | The Recovery agent's reminder (story steps 2 to 4). She allowed contact. |
| #1259 | Hana Sato | Abandoned on Wed 4 Nov | $45.00 | She did not allow contact: Guard rule 2 blocks a reminder. |
| #1260 | Jordan Reyes | Pending | $567.00 | Risky: a brand-new buyer, three Studio headphones. Not counted until PayPal captures it. |
| #1261 | Sam Whitfield | Failed, 3 attempts | $119.00 | Risky: repeated failed attempts. |

## 2. Regular payments found from the history

| Found | Status at the start |
|-------|--------------------|
| "We think Volta Audio Parts is paid about $300 every 10 days, next on Thu 12 Nov." | Found, not confirmed |
| "We think you move about $2,500 to your bank every other Monday, next on Mon 9 Nov." | Found, not confirmed |
| Rent $1,200 on the 12th; store software $99 on the 13th; equipment loan $150 on the 25th; shipping supplies $240 on the 30th; internet $60 on the 3rd | Confirmed |

The typical amount is the median of the past payments: exactly $300.00 and $2,500.00. A found payment counts in the
forecast straight away (ignoring it would hide the gap); confirming saves its next payments as dues at the same dates
and amounts, so the numbers don't change. "Not regular" takes it out.

## 3. Expected sales

Average net sales for each weekday over the last 8 weeks (Thu 10 Sep to Wed 4 Nov):

| Sun | Mon | Tue | Wed | Thu | Fri | Sat |
|-----|-----|-----|-----|-----|-----|-----|
| $270.69 | $205.85 | $186.55 | $189.02 | $272.50 | $291.13 | $334.20 |

**Confidence: high.** A usual week lands within about 12% of the 8-week average.

## 4. Story step 1: about $90 short on Thu 12 Nov

By hand, from the start of today to the end of Thu 12 Nov:

```
  Balance at the start of Thu 5 Nov                         1,987.56
+ Sales Thu 5 to Thu 12 (Thu, Fri, Sat, Sun, Mon, Tue, Wed, Thu)
    272.50 + 291.13 + 334.20 + 270.69 + 205.85 + 186.55 + 189.02 + 272.50
                                                          + 2,022.44
− Transfer to your bank, Mon 9 Nov                        − 2,500.00
− Rent, Thu 12 Nov                                        − 1,200.00
− Volta Audio Parts, Thu 12 Nov                             − 300.00
= Thu 12 Nov closes at                                         10.00
  Minimum balance                                             100.00
= Short by                                                     90.00
```

On the 12th, $1,410.00 is above the minimum ($1,237.50 opening + $272.50 sales − $100). Rent is paid first and is
fully ready; Volta gets the remaining $210.00 of its $300.00. "Rent's covered. Volta's order is $90 short."

The 14-day strip:

| Day | Starts | In | Out | Ends | State |
|-----|-------:|---:|----:|-----:|-------|
| Thu 5 Nov | 1,987.56 | 272.50 | | 2,260.06 | Covered |
| Fri 6 Nov | 2,260.06 | 291.13 | | 2,551.19 | Covered |
| Sat 7 Nov | 2,551.19 | 334.20 | | 2,885.39 | Covered |
| Sun 8 Nov | 2,885.39 | 270.69 | | 3,156.08 | Covered |
| Mon 9 Nov | 3,156.08 | 205.85 | 2,500.00 transfer | 861.93 | Covered |
| Tue 10 Nov | 861.93 | 186.55 | | 1,048.48 | Covered |
| Wed 11 Nov | 1,048.48 | 189.02 | | 1,237.50 | Covered |
| **Thu 12 Nov** | 1,237.50 | 272.50 | 1,200.00 rent, 300.00 Volta | **10.00** | **$90 short** |
| Fri 13 Nov | 10.00 | 291.13 | 99.00 software | 202.13 | Covered |
| Sat 14 Nov | 202.13 | 334.20 | | 536.33 | Covered |
| Sun 15 Nov | 536.33 | 270.69 | | 807.02 | Covered |
| Mon 16 Nov | 807.02 | 205.85 | | 1,012.87 | Covered |
| Tue 17 Nov | 1,012.87 | 186.55 | | 1,199.42 | Covered |
| Wed 18 Nov | 1,199.42 | 189.02 | | 1,388.44 | Covered |

Headline: "Clear until Wednesday. On Thu 12 Nov you'll be $90 short: the supplier order and rent land the same day."

## 5. Story step 3: the $72 order is paid

```
  Order #1258                                                 72.00
− PayPal's fee (estimate): 3.49% of 72.00 = 2.51, + 0.49     − 3.00
= Arrives in PayPal today                                     69.00

  Thu 12 Nov closes at 10.00 + 69.00 =                        79.00
  Short by 100.00 − 79.00 =                                   21.00
```

Headline: "Clear until Wednesday. On Thu 12 Nov you'll be $21 short: the supplier order and rent land the same day."

## 6. Story step 5: set aside $11 a day

```
  To be covered, Thu 12 Nov must close at 150.00 or more: 150.00 − 79.00 = 71.00 more
  Days from today to the day before: Thu 5 to Wed 11 Nov = 7 days
  71.00 / 7 = 10.14 a day, so the smallest whole-dollar amount is 11.00 a day
  11.00 × 7 = 77.00, kept back from Monday's transfer: 2,500.00 − 77.00 = 2,423.00
  Thu 12 Nov closes at 79.00 + 77.00 =                        156.00   Covered
```

- Within the 30% cap (Guard rule 7): the lowest expected day in the window is Tue 10 Nov, $186.55, so the cap is
  $55.96 a day. $11 is well inside it.
- The total, $77, is under $100.
- Every one of the 14 days is now covered. Headline: "Clear for the next two weeks. Thu 12 Nov is covered too, when
  rent and the supplier order go out."

## 7. Story step 6: "Can I afford a $200 order on Monday?"

Asked after steps 1 to 5, as in the story:

```
  Mon 9 Nov closes at 1,007.93; with the order:     1,007.93 − 200.00 =  807.93
  Thu 12 Nov closes at 156.00; with the order:        156.00 − 200.00 = −44.00
  Short by 100.00 − (−44.00) =                                          144.00
```

**Answer: no.** Monday itself is fine ($807.93 after the order), but Thu 12 Nov would be $144 short.

Asked before any fix (straight after a reset): Monday closes at $661.93 after the order, and Thu 12 Nov would be
$290 short (10.00 − 200.00 = −190.00, which is 290.00 below the minimum).

## 8. Fix the gap: the three options

Worked out by `lib/forecast/fixes.ts` from the forecast, each one checked by running the forecast with it.

| | At step 1 ($90 short) | At step 5 ($21 short) | Guard |
|---|---|---|---|
| Set aside a little each day (from the owner's transfer on Mon 9 Nov) | $20 a day for 7 days, $140: Thu 12 Nov closes at $150, covered | $11 a day for 7 days, $77: closes at $156, covered | $140: needs your OK (over $100). $77: approved |
| Move a payment to the first later day the forecast covers (simulated) | Volta's $300 to Fri 13 Nov: Thu 12 Nov closes at $310 | Volta's $300 to Fri 13 Nov: closes at $379 | Always needs your OK |
| Short-term loan for the exact gap (simulated, 2% fee) | $90 today, $91.80 back on Fri 13 Nov: closes at $100, tight | $21 today, $21.42 back on Fri 13 Nov | Always needs your OK |

## 9. Judge script

The judges' sandbox buyer login: _P2 adds it here and on `/demo` (task P2-1)._

| Step | Where | Do | Expect |
|------|-------|----|--------|
| 1 | Today (`/today`) | Read the sentence on the green note. | "Clear until Wednesday. On Thu 12 Nov you'll be $90 short: the supplier order and rent land the same day." Thu 12 is the red $10 tile. |
| 2 | Approvals | Open it. The reminder helper checks unfinished checkouts and the risk check checks pending orders; the Guard decides each. | Maya's $72 reminder: **Approved**, and it appears under Sent reminders (Simulated) with a payment link. Hana's: **Blocked** (she didn't agree to contact). Waiting for your OK: Sam's $119 reminder, and holds on Jordan's $567, Isla's $894 and Sam's $119 orders (the risky ones, not counted in the forecast until you decide). |
| 3 | Sent reminders | Open the payment link and pay as the test buyer. | The order is paid. $72.00 minus PayPal's $3.00 fee: $69.00 arrives. Today's sentence says Thu 12 Nov is $21 short. |
| 4 | Sent reminders | Press **Send a follow-up** on Maya's reminder. | **Blocked**: "PayPal shows order #1258 already paid". Only rule 1 fails on its receipt. |
| 5 | Fix the gap (`/fix`) | Pick **Set aside $11 a day**. | **Approved**. Thu 12 Nov closes at $156 and turns green; the sentence says clear for two weeks. |
| 6 | Ask | Press "Can I afford a $200 order on Monday?" | No: Mon 9 Nov ends at $808 (exactly $807.93), but Thu 12 Nov would be $144 short. The facts under it list both. |

Reset (on `/demo`) puts the copy back at step 1 with a new demo run id. Other visitors' copies are never touched.
