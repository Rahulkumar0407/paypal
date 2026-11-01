# prisma/

**Owner:** shared. Created by Person 1 in the foundation; after that, every change goes through Person 2.

**What goes here:**
- `schema.prisma`: every model. Every table carries a `storeId`; deleting a `Store` row deletes that visitor's whole
  copy. Money is `Int` cents, business dates are 'YYYY-MM-DD' strings.
- `migrations/`: generated SQL. Apply with `npm run db:migrate` (uses `DIRECT_URL` from `prisma.config.ts`).
- `seed.ts`: `npm run db:reset`. It only calls `lib/demo` (Person 3 owns the seed logic).

**Changing the schema:** propose the exact change to Person 2. Person 2 edits `schema.prisma`, runs
`npx prisma migrate dev --name <what-changed>` against a dev database, commits the new migration folder, and
everyone runs `npm run db:generate`. Never run `prisma migrate reset` against Supabase.
