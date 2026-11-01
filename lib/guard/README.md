# lib/guard/

**Owner:** Person 2. Task P2-3. Rules and semantics: AGENTS.md section 4.

**What goes here:** the Margin Guard (8 deterministic rules, no AI), receipts (append-only), the approval inbox, and
the executor: the only code that carries out actions, and one of the few allowed to import `@/lib/paypal`.

**Must export (from `index.ts`):**
- `evaluateProposal(proposal): Promise<GuardDecision>`: pure decision, all 8 rules, BLOCK > ESCALATE > APPROVE.
- `submitProposal(proposal): Promise<Receipt>`: decide, save the receipt, execute on APPROVE.
- `listInbox(storeId)`, `listReceipts(storeId)`, `getReceipt(storeId, id)`.
- `approveEscalation(storeId, receiptId)`, `rejectEscalation(storeId, receiptId)`: re-check BLOCK rules before executing.

**Now:** stubs returning `mocks/guard.ts` decisions and receipts, marked `TODO(Person 2)`. Suggested layout when real:
`rules.ts` (pure), `context.ts` (loader), `executor.ts`, `receipts.ts`, with `*.test.ts` beside each.
