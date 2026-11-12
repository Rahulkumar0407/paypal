# lib/demo/


**What goes here:** the SIMULATED Dunder Mifflin & Co. sample shop (a café-bakery), one private copy per visitor, and reset.

**Must export (from `index.ts`):**
- `getVisitorStoreId()`: the calling visitor's store id, from the `ns_store` cookie set by `proxy.ts`.
- `ensureStore(storeId)`: create the visitor's copy on first visit (the owner layout calls it).
- `resetStore(storeId)`: restore one copy exactly, with a new demo run id. Used by `POST /api/demo/reset`.
- `resetAllStores()`: wipe every copy and recreate `st_local`. Used by `npm run db:reset`.
- `cleanupIdleStores(days)`: delete copies nobody opened for `days` days.
- `getDemoStoreStatus(storeId)`, `buildDemoSeed(storeId, today, runId)`, `paypalFeeCents(gross)`, `DEMO_CATALOG`.

**How the seed works (`seed.ts`):** pure and deterministic (seeded random), so a reset gives identical rows; only
`demoRunId` changes. It builds 8 products, 90 days of simulated sales (759 orders, more at weekends, net of PayPal's
3.49% + $0.49 fee), Bean There's coffee beans about $400 every 10 days (last Mon 2 Nov), rent ($1,500 on the 12th),
staff pay ($1,600 on the 28th), Oat of Office ($180 on the 15th), internet, the card machine's $49 auto-debit, the oven
loan, a few transfers to the owner's bank, Ivory & Vow's unpaid $240 wedding cake, a no-consent abandoned order, three
risky orders, and the month page's goals. Bean There and the card machine are found from the history by lib/forecast;
the rest are confirmed. The opening balance is worked back so the balance at the start of `DEMO_TODAY` is $266.08,
which makes Thu 12 Nov exactly $120 short. `DEMO.md` has every number.

Tests: `seed.test.ts` (determinism, store ids, the story's rows, a balance that never goes negative).
