"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { Decision } from "@/types";
import { Button } from "@/components/ui/Button";
import { RefereeCard } from "@/components/ui/RefereeCard";

type Outcome = { ok: true; decision: Decision; reason: string; receiptId: string; receiptNumber: number } | { ok: false; message: string };

/** "Send a follow-up": the reminder helper drafts a second reminder, and the Margin Guard decides whether it goes. */
export function FollowUp({ orderId, send }: { orderId: string; send: (orderId: string) => Promise<Outcome> }) {
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [pending, startTransition] = useTransition();
  if (outcome?.ok) {
    return (
      <div role="status" className="mt-3 space-y-2 rounded-tile bg-surface p-4">
        <RefereeCard decision={outcome.decision} />
        <p className="text-[15px] leading-6 text-ink">{outcome.reason}</p>
        <Link href={`/receipts/${outcome.receiptId}`} className="text-[15px] text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
          Receipt No. {String(outcome.receiptNumber).padStart(4, "0")}
        </Link>
      </div>
    );
  }
  return (
    <div className="mt-3 space-y-2">
      <Button variant="secondary" disabled={pending} onClick={() => startTransition(async () => setOutcome(await send(orderId)))}>
        {pending ? "Checking" : "Send a follow-up"}
      </Button>
      {outcome && !outcome.ok ? (
        <p role="alert" className="text-[15px] leading-6 text-ink">
          {outcome.message}
        </p>
      ) : null}
    </div>
  );
}
