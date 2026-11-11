# prisma/


**What goes here:**
- `schema.prisma`: every model. Every table carries a `storeId`; deleting a `Store` row deletes that visitor's whole
  copy. Money is `Int` cents, business dates are 'YYYY-MM-DD' strings.
- `migrations/`: generated SQL. Apply with `npm run db:migrate` (uses `DIRECT_URL` from `prisma.config.ts`).
- `seed.ts`: `npm run db:reset`. It only calls `lib/demo`.

**Changing the schema:** tell the other person first, with the exact change. Then edit `schema.prisma`, run
`npx prisma migrate dev --name <what-changed>` against a dev database, commit the new migration folder, and
both run `npm run db:generate`. Never run `prisma migrate reset` against Supabase.
