import type { Decision, Forecast, Headline, IsoDate } from "@/types";
import { buildHeadline, yourFix, type YourNumbers } from "@/lib/forecast";
import { judge } from "@/lib/guard";

/**
 * /try: the visitor tries one of the fix ideas on their own numbers. The two weeks are worked out again with the fix in
 * place, and the real Margin Guard judges it, exactly as it would in the app, from a context filled in here (no
 * database): a fix touches no order and no PayPal, nothing has been spent in the last 7 days, and nothing is a repeat.
 */
export interface YourFixVerdict {
  fixId: string;
  title: string;
  after: Forecast;
  headline: Headline;
  decision: Decision;
  /** The deciding rule's plain reason, or "Every check passed." */
  reason: string;
  ruleNumber: number | null;
}

export function judgeYourFix(numbers: YourNumbers, fixId: string, today: IsoDate): YourFixVerdict | null {
  const tried = yourFix(numbers, fixId, today);
  if (!tried) return null;
  const decision = judge(
    tried.proposal,
    {
      order: null,
      orderMissing: false,
      paypal: { kind: "NOT_NEEDED" },
      remindersLast48h: null,
      duplicate: false,
      spentLast7DaysCents: 0,
      forecast: { kind: "READY", before: tried.before, after: tried.after },
    },
    { decidedAt: `${today}T09:00:00.000+00:00`, demoDate: today },
  );
  const rule = decision.rules.find((r) => r.id === decision.headlineRule);
  return {
    fixId,
    title: tried.fix.title,
    after: tried.after,
    headline: buildHeadline(tried.after),
    decision: decision.decision,
    reason: decision.decision === "APPROVE" ? "Every check passed." : decision.headlineReason,
    ruleNumber: rule?.number ?? null,
  };
}
