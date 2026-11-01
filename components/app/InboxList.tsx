"use client";

import Link from "next/link";
import { useState } from "react";
import type { InboxItem } from "@/types";
import { formatCents } from "@/lib/shared/money";
import { Button } from "@/components/ui/Button";
import { RefereeCard } from "@/components/ui/RefereeCard";
import { ACTION_WORD } from "@/components/ui/meaning";

/**
 * The approval inbox: escalations wait for the owner; decided items show their referee card.
 * TODO(Person 2, P2-3): Approve and Decline call the Guard's inbox API. The foundation version
 * only remembers the choice on this screen.
 */
export function InboxList({ items }: { items: InboxItem[] }) {
  const [choices, setChoices] = useState<Record<string, "approved" | "declined">>({});
  return (
    <ul className="divide-y divide-line">
      {items.map(({ receipt, status }) => {
        const choice = choices[receipt.id];
        const waiting = status === "WAITING" && !choice;
        return (
          <li key={receipt.id} className="py-5">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <RefereeCard decision={receipt.decision.decision} />
              <span className="tabular text-[15px] font-semibold text-ink">{formatCents(receipt.proposal.amountCents)}</span>
            </div>
            <p className="mt-2 text-[17px] leading-6 font-semibold text-ink">
              {ACTION_WORD[receipt.proposal.type]}: {receipt.proposal.target.label}
            </p>
            <p className="mt-0.5 text-[15px] leading-6 text-ink-muted">{receipt.decision.headlineReason}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {waiting ? (
                <>
                  <Button onClick={() => setChoices((c) => ({ ...c, [receipt.id]: "approved" }))}>Approve</Button>
                  <Button variant="secondary" onClick={() => setChoices((c) => ({ ...c, [receipt.id]: "declined" }))}>
                    Decline
                  </Button>
                </>
              ) : choice ? (
                <p role="status" className="text-[15px] text-ink">
                  {choice === "approved" ? "Approved by you. The Guard re-checks before anything runs." : "Declined. Nothing will happen."}
                </p>
              ) : null}
              <Link href={`/receipts#${receipt.id}`} className="ml-auto text-[15px] text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
                Receipt No. {String(receipt.number).padStart(4, "0")}
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
