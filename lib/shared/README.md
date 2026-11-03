# lib/shared/

**Owner:** Person 1.

**What goes here:** small utilities every module needs. There is **no index.ts**: import each file directly
(`import { formatDollars } from "@/lib/shared/money"`). That keeps the database client out of browser bundles.

| File | Exports | Notes |
|------|---------|-------|
| `env.ts` | `getEnv()`, `requireEnv(key)` | The only place that reads `process.env`. zod-validated. |
| `clock.ts` | `today()`, `now()`, `nowIso()`, `zonedInstant()`, `toZonedIso()`, `STORE_TIME_ZONE` | The demo clock. `today()` is `DEMO_TODAY`. Never use `new Date()` for business dates. |
| `dates.ts` | `addDays`, `daysBetween`, `eachDay`, `weekdayIndex`, `formatDay` ("Thu 12 Nov"), `formatDayWithYear`, ... | Date-only maths on 'YYYY-MM-DD'. |
| `money.ts` | `formatCents` ($72.00), `formatDollars` ($1,590), `formatShortfall` (rounds up), `dollarsToCents`, `sumCents`, `assertCents` | Integer cents only. |
| `db.ts` | `getDb()`, `isDatabaseConfigured()`, `DatabaseNotConfiguredError` | Server only. Prisma 7 + `@prisma/adapter-pg` on `DATABASE_URL`. |
| `visitor.ts` | `STORE_COOKIE`, `newStoreId()`, `isStoreId()`, `LOCAL_STORE_ID` | The per-visitor cookie. No database access (the proxy imports it). |

Tests: `shared.test.ts`.
