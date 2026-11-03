import type { ReminderDraft } from "@/types";

/**
 * The reminder template: polite, short, no exclamation marks, no amounts the order didn't have (AGENTS.md section 7).
 * `{checkout_link}` is where code (never AI) puts the fresh PayPal link when the reminder is sent. P1-10 adds an
 * AI draft with this as its fallback.
 */

export interface DraftInput {
  firstName: string;
  orderNumber: number;
  items: string[];
  /** 1 for the first reminder, 2 for a follow-up. */
  sequence: number;
}

function itemWords(items: string[]): string {
  const names = items.map((n, i) => (i === 0 ? n : n.charAt(0).toLowerCase() + n.slice(1)));
  if (names.length === 0) return "your order";
  if (names.length === 1) return `your ${names[0]}`;
  return `your ${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

export function reminderTemplate({ firstName, orderNumber, items, sequence }: DraftInput): ReminderDraft {
  const what = itemWords(items);
  const verb = items.length === 1 ? "is" : "are";
  if (sequence > 1) {
    return {
      subject: `A last reminder about Loop Audio order #${orderNumber}`,
      body: `Hi ${firstName}, just checking in once more: ${what} ${verb} still saved for you. If you'd still like ${items.length === 1 ? "it" : "them"}, you can finish your order here: {checkout_link}. If not, no need to reply. Thanks, Loop Audio`,
      source: "template",
    };
  }
  return {
    subject: `Your Loop Audio order #${orderNumber} is waiting`,
    body: `Hi ${firstName}, ${what} ${verb} still waiting for you. Here's a fresh checkout link if you'd like to finish your order: {checkout_link}. Thanks, Loop Audio`,
    source: "template",
  };
}
