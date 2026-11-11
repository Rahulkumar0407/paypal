# lib/demo/


**What goes here:** the SIMULATED Loop Audio demo store, one private copy per visitor, and reset.

**Must export (from `index.ts`):**
- `getVisitorStoreId()`: the calling visitor's store id, from the `ns_store` cookie set by `proxy.ts`.
- `ensureStore(storeId)`: create the visitor's copy on first visit (the owner layout calls it).
- `resetStore(storeId)`: restore one copy exactly, with a new demo run id. Used by `POST /api/demo/reset`.
- `resetAllStores()`: wipe every copy and recreate `st_local`. Used by `npm run db:reset`.
- `cleanupIdleStores(days)`: delete copies nobody opened for `days` days.
- `getDemoStoreStatus(storeId)`, `buildDemoSeed(storeId, today, runId)`, `paypalFeeCents(gross)`, `DEMO_CATALOG`.

**How the seed works (`seed.ts`):** pure and deterministic (seeded random), so a reset gives identical rows; only
`demoRunId` changes. It builds 8 products, 90 days of simulated sales (257 orders, more at weekends, net of PayPal's
3.49% + $0.49 fee), Volta Audio Parts about $300 every 10 days (last Mon 2 Nov), rent ($1,200 on the 12th), store
software, internet, shipping supplies, the loan, the owner's transfers to their bank (about $2,500 every other Monday,
last Mon 26 Oct), Maya's abandoned $72 order, a no-consent abandoned order, and two risky orders. Only confirmed
payees (the bills) get future dues; Volta and the owner's transfers are found by lib/forecast. The opening balance is
worked back so the balance at the start of `DEMO_TODAY` is $1,987.56, which makes Thu 12 Nov exactly $90 short.
`DEMO.md` has every number.

Tests: `seed.test.ts` (determinism, store ids, the story's rows, a balance that never goes negative).
