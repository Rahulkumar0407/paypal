import type { Decision, Proposer, Receipt } from "@/types";

/** Display helpers shared by the receipts list and the single receipt view. No money maths. */

export const FILTERS = [
  { key: "all", label: "All", decision: null },
  { key: "approved", label: "Approved", decision: "APPROVE" },
  { key: "escalated", label: "Needs your OK", decision: "ESCALATE" },
  { key: "blocked", label: "Blocked", decision: "BLOCK" },
] as const satisfies readonly { key: string; label: string; decision: Decision | null }[];

export type FilterKey = (typeof FILTERS)[number]["key"];

export function filterFrom(value: string | string[] | undefined): FilterKey {
  const v = Array.isArray(value) ? value[0] : value;
  return FILTERS.some((f) => f.key === v) ? (v as FilterKey) : "all";
}

/** Newest first. Receipt numbers only ever go up, so they order receipts even across real days on the fixed demo date. */
export function newestFirst(receipts: Receipt[]): Receipt[] {
  return [...receipts].sort((a, b) => b.number - a.number);
}

/** What happened after the decision, in one plain line. Null while nothing has (an escalation waiting, a block). */
export function outcomeLine(receipt: Receipt): string | null {
  const last = receipt.events.at(-1);
  const owner = receipt.decision.decision === "ESCALATE";
  switch (last?.kind) {
    case "EXECUTED":
      return owner ? `You approved it, and it's done. ${last.detail}` : `Done. ${last.detail}`;
    case "OWNER_REJECTED":
      return "You declined it, so nothing was done.";
    case "RECHECK_BLOCKED":
      return `You approved it, but the last safety check stopped it. ${last.detail}`;
    case "EXECUTION_FAILED":
      return `It didn't go through. ${last.detail}`;
    default:
      return null;
  }
}

/** The receipt page's sentence: where the decision stands now. */
export function standingSentence(receipt: Receipt): string {
  switch (receipt.events.at(-1)?.kind) {
    case "EXECUTED":
      return receipt.decision.decision === "ESCALATE" ? "You approved this, and it's done." : "The safety check said yes, and it's done.";
    case "OWNER_REJECTED":
      return "You declined this. Nothing was done.";
    case "RECHECK_BLOCKED":
      return "You approved this, but the safety check stopped it.";
    case "EXECUTION_FAILED":
      return "This was approved, but it didn't go through.";
    default:
      return { APPROVE: "The safety check said yes.", ESCALATE: "This needs your OK.", BLOCK: "The safety check stopped this." }[receipt.decision.decision];
  }
}

export function receiptNo(receipt: Receipt): string {
  return `No. ${String(receipt.number).padStart(4, "0")}`;
}

/** The time of day from an ISO timestamp with offset, as the store's clock showed it: "10:48". */
export function clockTime(iso: string): string {
  return iso.slice(11, 16);
}

export function proposerName(p: Proposer): string {
  if (p.kind === "OWNER") return "You";
  return { RECOVERY: "Reminder helper", RISK: "Risky-order check", ASK: "Ask" }[p.agent];
}
