# Contributing to NeverShort

Two people, any AI coding agent, one set of rules. The rules live in `AGENTS.md`; the tasks live in
`PLAN.md`. This page is the short version.

## Start every agent session with

> Read AGENTS.md and PLAN.md. I am Person 1 (or Person 2).

Then name the task (for example "P1-6"). Agents work on one task at a time.

## The rules

1. **One after the other, straight to `main`.** We never work at the same time, so there are no branches or pull
   requests.
   - Before starting any work: `git pull` on `main`.
   - Before pushing: run `npm run check`, and push only if it passes.
   - Never force-push, and never rewrite `main`'s history.
   - If a push is rejected because the other person pushed first: pull, fix any conflict, run `npm run check`
     again, then push.
   - Say in chat when you start and when you've pushed.
2. **Only change your own folders.** The ownership table is in `AGENTS.md` section 10. If you need a change
   somewhere else, write down exactly what and why, and ask the other person.
3. **`types/` and `prisma/` are shared.** They are the contract between modules. Whoever changes one tells the other
   person first, with the exact change and why.
4. **Run `npm run check` before pushing.** It runs lint (including the import boundaries), the type check and the
   unit tests. GitHub runs the same check on every push to `main`, and `main` must stay green.
5. **No co-authors.** No `Co-authored-by` trailers, "Generated with" lines or other tool attribution in commits.

## Setting up

```bash
nvm use                 # Node 22 (see .nvmrc)
npm ci
cp .env.example .env    # then fill in the Supabase URLs (see README)
npm run db:migrate      # create the tables
npm run db:reset        # load the demo store
npm run dev             # http://localhost:3000
```

Without a database the app still runs on the stubs' fake data, and `/demo` says the database isn't connected.

**Use your own dev database.** Each developer creates their own free Supabase project (or runs `npx prisma dev`
for a local Postgres) and puts its URLs in their own `.env`. Never point your `.env` at the shared database the
hosted app uses: `npm run db:reset` deletes every demo copy in the database it runs against.

**PayPal keys are optional.** Until Person 2 switches PayPal on (`SWITCH-ON.md`), leave the `PAYPAL_*` keys empty. The app
runs, `/demo` says "PayPal isn't set up yet", and checkout is switched off. Tests use `PAYPAL_FAKE=1`.

## Replacing a stub

Every module in `lib/` starts as a stub that returns fake data from `mocks/` and is marked `TODO(Person N)`.
Replace the body, keep the signature, add `*.test.ts` beside your code, and keep `mocks/mocks.test.ts` passing if
you touch a mock. See the README in your folder for the functions it must export.
