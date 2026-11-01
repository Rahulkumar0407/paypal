import type { DayState, Decision } from "@/types";

/**
 * The only mapping from meaning to colour (AGENTS.md section 7). Full class names so Tailwind sees them.
 * Every colour always travels with a word: colour is never the only signal.
 */

export const DAY_FILL: Record<DayState, string> = {
  covered: "bg-green",
  tight: "bg-amber",
  short: "bg-red",
};

export const DAY_WORD: Record<DayState, string> = {
  covered: "Covered",
  tight: "Tight",
  short: "Short",
};

export const DECISION_FILL: Record<Decision, string> = {
  APPROVE: "bg-green",
  ESCALATE: "bg-amber",
  BLOCK: "bg-red",
};

export const DECISION_WORD: Record<Decision, string> = {
  APPROVE: "Approved",
  ESCALATE: "Escalated",
  BLOCK: "Blocked",
};

/** Owner-facing wording for each action type. */
export const ACTION_WORD: Record<string, string> = {
  SEND_REMINDER: "Send reminder",
  SET_ASIDE: "Set aside",
  MOVE_PAYMENT: "Move payment",
  GAP_LOAN: "Gap loan",
  PAY_SUPPLIER: "Pay supplier",
  REFUND: "Refund",
  HOLD_ORDER: "Hold order",
};
