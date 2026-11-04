import type { ActionProposal, Decision, GuardDecision, InboxItem, IsoDate, IsoDateTime, Receipt, ReceiptEvent, StoreId } from "@/types";
import { judge, recheckBlockingRules, type GuardContext } from "./rules";

/**
 * Propose, decide, execute (AGENTS.md section 3). This file is the order of events; it knows nothing about the
 * database or PayPal, so the whole flow is unit-tested with an in-memory store (flow.test.ts).
 *
 *   submit:  rules -> receipt saved -> on APPROVE the executor runs -> EXECUTED or EXECUTION_FAILED is added
 *   approve: (ESCALATE only) OWNER_APPROVED -> BLOCK rules re-checked -> RECHECK_BLOCKED, or the executor runs
 *   reject:  (ESCALATE only) OWNER_REJECTED
 * Receipts only ever gain events; nothing on them is edited.
 */

export type ProposalStatus = "APPROVED" | "ESCALATED" | "BLOCKED" | "OWNER_APPROVED" | "OWNER_REJECTED" | "EXECUTED" | "FAILED";

export interface GuardRepo {
  /** The stored proposal using this idempotency key, if any. */
  findByKey(storeId: StoreId, key: string): Promise<ActionProposal | null>;
  /** Saves a new proposal with its receipt and DECIDED event. Returns null if another proposal took the key meanwhile. */
  saveNew(proposal: ActionProposal, decision: GuardDecision, status: ProposalStatus, event: ReceiptEvent): Promise<Receipt | null>;
  /** A repeat of an action that already exists: its receipt is filed against the stored proposal. */
  saveRepeat(existing: ActionProposal, decision: GuardDecision, event: ReceiptEvent): Promise<Receipt>;
  getReceipt(storeId: StoreId, receiptId: string): Promise<Receipt | null>;
  /** Newest first. */
  listReceipts(storeId: StoreId): Promise<Receipt[]>;
  /** Adds an event to the receipt and, if given, sets the proposal's status. Returns the receipt as it now reads. */
  append(receipt: Receipt, event: ReceiptEvent, status?: ProposalStatus): Promise<Receipt>;
  /** Moves an ESCALATED proposal to the owner's choice. False if it was already decided (a double click). */
  claim(proposalId: string, status: "OWNER_APPROVED" | "OWNER_REJECTED"): Promise<boolean>;
}

export interface ExecutionResult {
  detail: string;
  paypalIds: string[];
}

export interface GuardDeps {
  repo: GuardRepo;
  /** Every fact the rules need except the duplicate check. Anything it can't check comes back as unknown, never thrown. */
  facts(proposal: ActionProposal): Promise<Omit<GuardContext, "duplicate">>;
  /** Carries out an action. Throw an ExecutionError with plain words when it can't. */
  execute(proposal: ActionProposal): Promise<ExecutionResult>;
  clock(): { at: IsoDateTime; demoDate: IsoDate };
}

/** A problem the owner can be told about in plain words. */
export class GuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GuardError";
  }
}

/** The executor couldn't do it. The message is shown to the owner, so it's plain words. */
export class ExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExecutionError";
  }
}

const STATUS: Record<Decision, ProposalStatus> = { APPROVE: "APPROVED", ESCALATE: "ESCALATED", BLOCK: "BLOCKED" };
const DECIDED_WORDS: Record<Decision, string> = { APPROVE: "Approved.", ESCALATE: "Needs your OK.", BLOCK: "Blocked." };

/** Where an item stands in the approval inbox, read from its events. */
export function inboxStatus(receipt: Receipt): InboxItem["status"] {
  const kinds = new Set(receipt.events.map((e) => e.kind));
  if (kinds.has("OWNER_REJECTED")) return "REJECTED";
  if (kinds.has("EXECUTED")) return "DONE";
  if (kinds.has("OWNER_APPROVED")) return "APPROVED";
  return receipt.decision.decision === "ESCALATE" ? "WAITING" : "DONE";
}

export function createGuard(deps: GuardDeps) {
  const { repo } = deps;
  const event = (kind: ReceiptEvent["kind"], detail: string, paypalIds: string[] = []): ReceiptEvent => {
    const { at, demoDate } = deps.clock();
    return { kind, at, demoDate, detail, paypalIds };
  };
  const decidedEvent = (d: GuardDecision) => event("DECIDED", `${DECIDED_WORDS[d.decision]} ${d.headlineReason}`, d.paypalIdsChecked);

  async function decision(proposal: ActionProposal, duplicate: boolean): Promise<{ ctx: GuardContext; decision: GuardDecision }> {
    const ctx: GuardContext = { ...(await deps.facts(proposal)), duplicate };
    const { at, demoDate } = deps.clock();
    return { ctx, decision: judge(proposal, ctx, { decidedAt: at, demoDate }) };
  }

  async function run(receipt: Receipt): Promise<Receipt> {
    try {
      const result = await deps.execute(receipt.proposal);
      return await repo.append(receipt, event("EXECUTED", result.detail, result.paypalIds), "EXECUTED");
    } catch (error) {
      const detail =
        error instanceof ExecutionError ? error.message : "Something went wrong while doing it, so it stopped. Nothing else was changed.";
      if (!(error instanceof ExecutionError)) console.error("[guard] executor failed:", error instanceof Error ? error.message : error);
      return repo.append(receipt, event("EXECUTION_FAILED", detail), "FAILED");
    }
  }

  async function waitingReceipt(storeId: StoreId, receiptId: string): Promise<Receipt> {
    const receipt = await repo.getReceipt(storeId, receiptId);
    if (!receipt) throw new GuardError("That receipt isn't in your demo.");
    if (inboxStatus(receipt) !== "WAITING") throw new GuardError("This one has already been decided.");
    return receipt;
  }

  return {
    /** Runs the 9 rules and returns the decision. Saves nothing and runs nothing. */
    async evaluate(proposal: ActionProposal): Promise<GuardDecision> {
      const existing = await repo.findByKey(proposal.storeId, proposal.idempotencyKey);
      return (await decision(proposal, existing !== null)).decision;
    },

    /** Decides, saves the receipt, and on APPROVE runs the action. The only way an action happens. */
    async submit(proposal: ActionProposal): Promise<Receipt> {
      const existing = await repo.findByKey(proposal.storeId, proposal.idempotencyKey);
      const first = await decision(proposal, existing !== null);
      if (!existing) {
        const saved = await repo.saveNew(proposal, first.decision, STATUS[first.decision.decision], decidedEvent(first.decision));
        if (saved) return first.decision.decision === "APPROVE" ? run(saved) : saved;
      }
      // The key is already used: by an earlier proposal, or by a double submit that won the race just now.
      const taken = existing ?? (await repo.findByKey(proposal.storeId, proposal.idempotencyKey));
      if (!taken) throw new GuardError("Couldn't save the safety check. Nothing has moved.");
      const repeat = existing ? first : await decision(proposal, true);
      return repo.saveRepeat(taken, { ...repeat.decision, proposalId: taken.id }, decidedEvent(repeat.decision));
    },

    /** The owner approves an escalation. Only ESCALATE rules are cleared: the BLOCK rules run again first. */
    async approve(storeId: StoreId, receiptId: string): Promise<Receipt> {
      const receipt = await waitingReceipt(storeId, receiptId);
      if (!(await repo.claim(receipt.proposal.id, "OWNER_APPROVED"))) throw new GuardError("This one has already been decided.");
      const approved = await repo.append(receipt, event("OWNER_APPROVED", "You approved it. The safety rules ran once more before doing it."));
      const existing = await repo.findByKey(storeId, approved.proposal.idempotencyKey);
      const ctx: GuardContext = { ...(await deps.facts(approved.proposal)), duplicate: existing !== null && existing.id !== approved.proposal.id };
      const blocked = recheckBlockingRules(approved.proposal, ctx);
      if (blocked) {
        const checked = ctx.paypal.kind === "CHECKED" || ctx.paypal.kind === "UNREACHABLE" ? [ctx.paypal.paypalOrderId] : [];
        return repo.append(approved, event("RECHECK_BLOCKED", `Rule ${blocked.number}, ${blocked.name}: ${blocked.reason}`, checked), "BLOCKED");
      }
      return run(approved);
    },

    /** The owner declines an escalation. Nothing runs. */
    async reject(storeId: StoreId, receiptId: string): Promise<Receipt> {
      const receipt = await waitingReceipt(storeId, receiptId);
      if (!(await repo.claim(receipt.proposal.id, "OWNER_REJECTED"))) throw new GuardError("This one has already been decided.");
      return repo.append(receipt, event("OWNER_REJECTED", "You declined it, so nothing was done."));
    },

    /** Escalations waiting for the owner first, then everything else, newest first. */
    async inbox(storeId: StoreId): Promise<InboxItem[]> {
      const items = (await repo.listReceipts(storeId)).map((receipt) => ({ receipt, status: inboxStatus(receipt) }));
      return [...items.filter((i) => i.status === "WAITING"), ...items.filter((i) => i.status !== "WAITING")];
    },
  };
}

export type Guard = ReturnType<typeof createGuard>;
