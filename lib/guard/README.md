# lib/guard/

**Owner:** Person 1. Task P1-7 (done). Rules and semantics: AGENTS.md section 4.

**What goes here:** the Margin Guard (9 deterministic rules, no AI), receipts (append-only), the approval inbox, and
the executor: the only code that carries out actions, and one of the few allowed to import `@/lib/paypal`.

## Files

| File | What it does |
|------|--------------|
| `rules.ts` | Pure. The 9 rules, `runRules`, `decide` (BLOCK > ESCALATE > APPROVE), `recheckBlockingRules`. |
| `flow.ts` | The order of events: submit, approve, reject, inbox. No database, so it's tested in memory. |
| `context.ts` | Gathers the facts the rules need: the order, PayPal's status, recent reminders, the forecast before and after. Never throws: a fact it can't get is unknown, and the rule that needs it fails. |
| `executor.ts` | Carries out all 7 action types. PayPal calls go through `lib/paypal` with the idempotency key. |
| `repo.ts` | Proposal, Receipt and ReceiptEvent rows. Receipts are never updated, only given new events. |

Tests: `rules.test.ts` (each rule passing and failing, N/A, precedence, the demo story's decisions),
`flow.test.ts` (the whole flow against an in-memory store), `context.test.ts`.

## Public API (`@/lib/guard`)

- `submitProposal(proposal)`: decide, save the receipt, run the action on APPROVE. The only way an action happens.
- `evaluateProposal(proposal)`: the decision only; saves and runs nothing.
- `listInbox(storeId)`, `listReceipts(storeId)`, `getReceipt(storeId, id)`: newest first; empty without a database.
- `approveEscalation(storeId, receiptId)`, `rejectEscalation(storeId, receiptId)`: throw `GuardError` (plain words)
  if it was already decided.
- `nextProposalKey(storeId, type, targetId)`: `<demo run id>:<action type>:<target id>:<sequence>`, where the sequence
  is 1 + how many times that action was already carried out on that target. Every proposal builder uses it.

## How it works

- **Submit:** the facts are gathered, all 9 rules run, the receipt is saved with a DECIDED event. On APPROVE the
  executor runs and EXECUTED (or EXECUTION_FAILED) is added. ESCALATE waits in the inbox. BLOCK stops.
- **Repeats:** a proposal whose key is already used is BLOCKED by rule 5. Its receipt is filed against the stored
  proposal (the key is unique in the database), and nothing runs twice. A double submit that races is caught the same way.
- **Approve:** only an ESCALATE that nobody has decided yet. OWNER_APPROVED is added, then the BLOCK rules run again
  with fresh facts. If one fails, RECHECK_BLOCKED is added and nothing runs; otherwise the executor runs.
  A double click can't approve twice: the proposal's status moves from ESCALATED only once.
- **Fails closed:** PayPal unreachable, a missing order, a forecast that can't be worked out, a reminder count that
  can't be read: the rule that needs it FAILS.
- **Times:** receipts keep the real time and show it on the demo date. The 48-hour reminder window uses real time,
  because it protects real people.

## What the executor does

| Action | Does |
|--------|------|
| SEND_REMINDER | Creates a PayPal order (fake mode until P1-9), puts the message in the simulated outbox with its checkout link, notes the PayPal order on our order. |
| SET_ASIDE | Saves a `SetAside` row; the forecast keeps its total back from the owner's transfers. |
| MOVE_PAYMENT | Moves the `Due` row (creates it for a payee that's found but not confirmed), marked simulated. |
| GAP_LOAN | Saves a simulated `GapLoan` row: in today, repaid with the fee on the repay date. |
| PAY_SUPPLIER | PayPal Payouts, then a ledger entry today and the due marked paid. |
| REFUND | PayPal refund of the capture, then a ledger entry today and the order marked refunded. |
| HOLD_ORDER | Puts the order on risk hold. |
