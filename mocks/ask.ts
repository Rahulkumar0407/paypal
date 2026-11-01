import type { ChatAnswer } from "@/types";
import { formatDollars, formatShortfall } from "@/lib/shared/money";
import { mockAffordability } from "./fixes";

/** FAKE Ask chat answers. Numbers come from the mock affordability check, never typed by hand. */

const a = mockAffordability;
const before = a.shortfallBefore!;
const after = a.shortfallAfter!;

export const MOCK_SUGGESTED_QUESTIONS = [
  "Can I afford a $200 order on Monday?",
  "When is my next shortfall?",
  "How much do I usually pay Volta?",
];

export const mockAffordAnswer: ChatAnswer = {
  question: "Can I afford a $200 order on Monday?",
  answer:
    `Not without making Thursday worse. On Mon 9 Nov you'd still have ${formatDollars(a.balanceAfterOnDateCents)} after paying it, ` +
    `but on Thu 12 Nov you'd be ${formatShortfall(after.amountCents)} short instead of ${formatShortfall(before.amountCents)}.`,
  facts: [
    { label: "Balance on Mon 9 Nov after a $200 order", cents: a.balanceAfterOnDateCents, date: "2026-11-09" },
    { label: "Shortfall on Thu 12 Nov with the order", cents: after.amountCents, date: after.date },
    { label: "Shortfall on Thu 12 Nov without it", cents: before.amountCents, date: before.date },
  ],
  toolsUsed: ["canAfford"],
  source: "ai",
};

export const mockFallbackAnswer: ChatAnswer = {
  question: "Can I afford a $200 order on Monday?",
  answer: "I can't write an answer right now, but here are the numbers from your forecast.",
  facts: mockAffordAnswer.facts,
  toolsUsed: ["canAfford"],
  source: "fallback",
};
