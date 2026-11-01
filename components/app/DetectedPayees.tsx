"use client";

import { useState } from "react";
import type { RecurringPayee } from "@/types";
import { Button } from "@/components/ui/Button";

/**
 * "We think Volta is paid ~$300 every 10 days." The owner confirms once.
 * TODO(Person 3): call the confirm API (lib/forecast confirmRecurringPayee). The foundation
 * version only remembers the answer on this screen.
 */
export function DetectedPayees({ payees }: { payees: RecurringPayee[] }) {
  const [answers, setAnswers] = useState<Record<string, "yes" | "no">>({});
  return (
    <ul className="space-y-3">
      {payees.map((p) => {
        const answer = answers[p.id];
        return (
          <li key={p.id} className="rounded-tile bg-paper p-4 ring-1 ring-line ring-inset">
            <p className="text-[13px] text-ink-muted">Found from your payments</p>
            <p className="mt-1 text-[17px] leading-6 text-ink">{p.summary}</p>
            {answer ? (
              <p role="status" className="mt-3 text-[15px] text-ink">
                {answer === "yes" ? "Confirmed. It's in your forecast." : "Noted. We'll leave it out until you add it yourself."}
              </p>
            ) : (
              <div className="mt-3 flex gap-2">
                <Button onClick={() => setAnswers((a) => ({ ...a, [p.id]: "yes" }))}>Yes, that&apos;s right</Button>
                <Button variant="secondary" onClick={() => setAnswers((a) => ({ ...a, [p.id]: "no" }))}>
                  Not quite
                </Button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
