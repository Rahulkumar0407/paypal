# Contributing to NeverShort

Four people, four different AI coding agents, one set of rules. The rules live in `AGENTS.md`; the tasks live in
`PLAN.md`. This page is the short version.

## Start every agent session with

> Read AGENTS.md and PLAN.md. I am Person N.

Then name the task (for example "P3-1"). Agents work on one task at a time.

## The rules

1. **One branch per person and task.** Name it `p<person>/<task-id>-<short-name>`, for example
   `p3/P3-1-forecast`. Open a pull request to `main`. Never push to `main` directly; Person 2 merges daily.
2. **Only change your own folders.** The ownership table is in `AGENTS.md` section 10. If you need a change
   somewhere else, write down exactly what and why, and ask the owner.
3. **Never change `types/` or `prisma/` without Person 2.** They are the contract between everyone's modules.
   Propose the exact change in your pull request description and let Person 2 make it.
4. **Run `npm run check` before pushing.** It runs lint (including the import boundaries), the type check and the
   unit tests. GitHub runs the same check on every pull request, and `main` must stay green.
5. **No co-authors.** No `Co-authored-by` trailers, "Generated with" lines or other tool attribution in commits
   or pull requests.

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

## Replacing a stub

Every module in `lib/` starts as a stub that returns fake data from `mocks/` and is marked `TODO(Person N)`.
Replace the body, keep the signature, add `*.test.ts` beside your code, and keep `mocks/mocks.test.ts` passing if
you touch a mock. See the README in your folder for the functions it must export.
