"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { Decision } from "@/types";
import { Button } from "@/components/ui/Button";
import { RefereeCard } from "@/components/ui/RefereeCard";

type Outcome =
  | { ok: true; fixId: string; decision: Decision; reason: string; receiptId: string; receiptNumber: number }
  | { ok: false; fixId: string; message: string };

export interface FixChoiceItem {
  id: string;
  /** The card's body, drawn on the server: what the fix does and its effect. */
  content: React.ReactNode;
  /** Words for the button, e.g. "Set aside $20 a day". */
  actionLabel: string;
}

const NEXT_STEP: Record<Decision, string> = {
  APPROVE: "Done. Your forecast now counts it.",
  ESCALATE: "It's waiting for your OK in Approvals. Nothing moves until you decide.",
  BLOCK: "Nothing has moved.",
};

/**
 * The fix-the-gap options. Choosing one sends it to the Margin Guard and shows the decision as a referee card.
 * Once one is approved, the others step back: the gap is already covered.
 */
export function FixChooser({ items, forDay, action }: { items: FixChoiceItem[]; forDay: string; action: (fixId: string) => Promise<Outcome> }) {
  const [outcomes, setOutcomes] = useState<Record<string, Outcome>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const approved = Object.values(outcomes).find((o) => o.ok && o.decision === "APPROVE");

  function choose(id: string) {
    setPendingId(id);
    startTransition(async () => {
      let outcome: Outcome;
      try {
        outcome = await action(id);
      } catch {
        outcome = { ok: false, fixId: id, message: "Couldn't run the safety check. Nothing has moved. Try again in a minute." };
      }
      setOutcomes((all) => ({ ...all, [id]: outcome }));
      setPendingId(null);
    });
  }

  return (
    <ol className="grid gap-5 lg:grid-cols-3 lg:gap-6">
      {items.map((item) => {
        const outcome = outcomes[item.id];
        const pending = pendingId === item.id;
        const decided = outcome?.ok ? outcome : null;
        const steppedBack = approved !== undefined && !decided;
        return (
          <li key={item.id} id={item.id} className="flex scroll-mt-24 flex-col rounded-card bg-paper p-5 ring-1 ring-ink/[0.06] lg:p-6">
            <div className="flex-1">{item.content}</div>

            <div className="mt-5 border-t border-line pt-5" aria-live="polite">
              {decided ? (
                <div role="status" className="space-y-2">
                  <RefereeCard decision={decided.decision} size="lg" />
                  <p className="text-[15px] leading-6 text-ink">{decided.reason}</p>
                  <p className="text-[15px] leading-6 text-ink-muted">{NEXT_STEP[decided.decision]}</p>
                  <p className="flex flex-wrap gap-x-5 gap-y-1 pt-1 text-[15px]">
                    <Link href={`/receipts/${decided.receiptId}`} className="text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
                      Receipt No. {String(decided.receiptNumber).padStart(4, "0")}
                    </Link>
                    {decided.decision === "ESCALATE" ? (
                      <Link href="/approvals" className="text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
                        Open Approvals
                      </Link>
                    ) : null}
                  </p>
                </div>
              ) : steppedBack ? (
                <p className="text-[15px] leading-6 text-ink-muted">Not needed now: {forDay} is covered by the fix you picked.</p>
              ) : (
                <div className="space-y-3">
                  {outcome && !outcome.ok ? (
                    <p role="alert" className="flex items-start gap-2 text-[15px] leading-6 text-ink">
                      <span aria-hidden className="mt-2 inline-block size-2 shrink-0 rounded-full bg-red" />
                      {outcome.message}
                    </p>
                  ) : null}
                  <Button className="w-full" onClick={() => choose(item.id)} disabled={pendingId !== null}>
                    {pending ? "Checking" : item.actionLabel}
                  </Button>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
