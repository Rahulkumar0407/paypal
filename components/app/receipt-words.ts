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

/** Newest first: by decision time, then by receipt number. */
export function newestFirst(receipts: Receipt[]): Receipt[] {
  return [...receipts].sort((a, b) => {
    const at = Date.parse(b.decision.decidedAt) - Date.parse(a.decision.decidedAt);
    return at !== 0 && !Number.isNaN(at) ? at : b.number - a.number;
  });
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
