"use client";

import { useState, useTransition } from "react";
import type { RecurringPayee } from "@/types";
import { Button } from "@/components/ui/Button";
import { answerRegularPayment } from "@/app/(owner)/dues/actions";

type Answer = "confirm" | "dismiss";

/**
 * "We think Volta is paid about $300 every 10 days, next on Thu 12 Nov." The owner answers once.
 * An answered payee stays on screen with what happened, even after the page's list moves on to the next one.
 */
export function DetectedPayees({ payees, explanations = {} }: { payees: RecurringPayee[]; explanations?: Record<string, string> }) {
  const [answered, setAnswered] = useState<{ payee: RecurringPayee; answer: Answer }[]>([]);
  const [failed, setFailed] = useState<{ id: string; message: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const answer = (payee: RecurringPayee, choice: Answer) => {
    setBusyId(payee.id);
    setFailed(null);
    startTransition(async () => {
      const result = await answerRegularPayment(payee.id, choice);
      if (result.ok) setAnswered((list) => [...list.filter((a) => a.payee.id !== payee.id), { payee, answer: choice }]);
      else setFailed({ id: payee.id, message: result.message });
      setBusyId(null);
    });
  };

  const done = new Map(answered.map((a) => [a.payee.id, a.answer]));
  const shown = [...answered.map((a) => a.payee).filter((p) => !payees.some((x) => x.id === p.id)), ...payees];

  return (
    <ul className="space-y-3">
      {shown.map((p) => {
        const result = done.get(p.id);
        const busy = busyId === p.id;
        return (
          <li key={p.id} className="rounded-tile bg-paper p-4 ring-1 ring-line ring-inset">
            <p className="text-[13px] text-ink-muted">Found from your payments</p>
            <p className="mt-1 text-[17px] leading-6 text-ink">{p.summary}</p>
            {explanations[p.id] ? <p className="mt-1 text-[14px] leading-5 text-ink-muted">{explanations[p.id]}</p> : null}
            {result ? (
              <p role="status" className="mt-3 text-[15px] text-ink">
                {result === "confirm"
                  ? "Confirmed. Its next payments are saved, and every forecast counts them."
                  : "Got it. We won't treat it as a regular payment, so the forecast leaves it out."}
              </p>
            ) : (
              <>
                <div className="mt-3 flex gap-2">
                  <Button onClick={() => answer(p, "confirm")} disabled={busyId !== null} aria-busy={busy}>
                    {busy ? "Saving" : "Confirm"}
                  </Button>
                  <Button variant="secondary" onClick={() => answer(p, "dismiss")} disabled={busyId !== null}>
                    Not regular
                  </Button>
                </div>
                {failed?.id === p.id ? (
                  <p role="alert" className="mt-2 text-[14px] leading-5 text-ink">
                    {failed.message}
                  </p>
                ) : null}
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}
