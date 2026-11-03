import type { Cents } from "@/types";

/**
 * Code checks every piece of AI text before it is shown (AGENTS.md section 5): the voice rules, and no number that
 * wasn't in what the AI was given. A text that fails is replaced by its plain template. Pure.
 */

const BANNED = ["unlock", "seamless", "supercharge", "ai-powered", "game-changer", "revolutionary"];
const EMOJI = /\p{Extended_Pictographic}/u;
const NUMBER = /\$?\d[\d,]*(?:\.\d+)?%?/g;

/** The numbers a text may use: every number written in the facts the AI was given, plus their cent amounts. */
export interface Allowed {
  tokens: Set<string>;
  cents: Set<Cents>;
}

export function allowedFrom(sources: readonly unknown[], cents: readonly Cents[] = []): Allowed {
  const tokens = new Set<string>();
  for (const source of sources) {
    const text = typeof source === "string" ? source : JSON.stringify(source);
    for (const m of text.match(NUMBER) ?? []) tokens.add(normal(m));
  }
  return { tokens, cents: new Set(cents) };
}

function normal(token: string): string {
  return token.replace(/[$,%]/g, "").replace(/\.$/, "");
}

/** Whole-dollar ways the same amount may be written: exact, rounded, rounded up (a shortfall), rounded down. */
function dollarForms(cents: Cents): string[] {
  const abs = Math.abs(cents);
  return [(abs / 100).toFixed(2), String(Math.round(abs / 100)), String(Math.ceil(abs / 100)), String(Math.floor(abs / 100))];
}

/** Why a text can't be shown, or null when it's fine. */
export function problemWith(text: string, allowed: Allowed): string | null {
  if (!text.trim()) return "empty";
  if (text.includes("!")) return "exclamation mark";
  if (EMOJI.test(text)) return "emoji";
  const lower = text.toLowerCase();
  const banned = BANNED.find((w) => lower.includes(w));
  if (banned) return `banned word "${banned}"`;
  const centForms = new Set([...allowed.cents].flatMap(dollarForms));
  for (const raw of text.match(NUMBER) ?? []) {
    const token = normal(raw);
    if (allowed.tokens.has(token) || centForms.has(token)) continue;
    // "$1,200" and "$1200.00" are the same number.
    const asNumber = Number(token);
    if (Number.isFinite(asNumber) && [...allowed.tokens, ...centForms].some((t) => Number(t) === asNumber)) continue;
    return `a number that wasn't given: ${raw}`;
  }
  return null;
}
