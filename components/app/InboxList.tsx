"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { Decision, InboxItem, Proposer } from "@/types";
import { formatCents } from "@/lib/shared/money";
import { formatDay } from "@/lib/shared/dates";
import { Button } from "@/components/ui/Button";
import { RefereeCard } from "@/components/ui/RefereeCard";
import { ACTION_WORD } from "@/components/ui/meaning";
import { outcomeLine } from "./receipt-words";

type Outcome =
  | { ok: true; receiptId: string; choice: "approve" | "decline"; decision: Decision | null; message: string }
  | { ok: false; receiptId: string; message: string };

type Decide = (receiptId: string, choice: "approve" | "decline") => Promise<Outcome>;

function proposerWord(p: Proposer): string {
  if (p.kind === "OWNER") return "you";
  return { RECOVERY: "the reminder helper", RISK: "the risky-order check", ASK: "Ask" }[p.agent];
}

/**
 * The approval inbox. Waiting items carry the reason in one plain sentence, with Approve and Decline;
 * after a choice the row says what happened. Decided items show their referee card and a receipt link.
 */
export function InboxList({ items, decide }: { items: InboxItem[]; decide?: Decide }) {
  const [outcomes, setOutcomes] = useState<Record<string, Outcome>>({});
  const [pending, setPending] = useState<{ id: string; choice: "approve" | "decline" } | null>(null);
  const [, startTransition] = useTransition();

  function choose(receiptId: string, choice: "approve" | "decline") {
    if (!decide) return;
    setPending({ id: receiptId, choice });
    startTransition(async () => {
      let outcome: Outcome;
      try {
        outcome = await decide(receiptId, choice);
      } catch {
        outcome = { ok: false, receiptId, message: "Couldn't run the safety check. Nothing has moved. Try again in a minute." };
      }
      setOutcomes((all) => ({ ...all, [receiptId]: outcome }));
      setPending(null);
    });
  }

  return (
    <ul className="divide-y divide-line">
      {items.map(({ receipt, status }) => {
        const outcome = outcomes[receipt.id];
        const done = outcome?.ok ? outcome : null;
        const waiting = status === "WAITING" && !done;
        const { proposal, decision } = receipt;
        return (
          <li key={receipt.id} className="py-5">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <RefereeCard decision={decision.decision} />
              <span className="tabular text-[15px] font-semibold text-ink">{formatCents(proposal.amountCents)}</span>
            </div>
            <p className="mt-2 text-[17px] leading-6 font-semibold text-ink">
              {ACTION_WORD[proposal.type]}: {proposal.target.label}
            </p>
            {proposal.type === "HOLD_ORDER" && proposal.draftText ? <p className="mt-1 text-[15px] leading-6 text-ink">{proposal.draftText}</p> : null}
            <p className="mt-0.5 text-[15px] leading-6 text-ink-muted">
              {waiting ? "Waiting because: " : ""}
              {decision.headlineReason}
            </p>
            {waiting && proposal.type === "HOLD_ORDER" ? (
              <p className="mt-0.5 text-[14px] leading-5 text-ink-muted">Until you decide, its money isn&apos;t counted in your forecast.</p>
            ) : null}
            {!waiting && !done && outcomeLine(receipt) ? <p className="mt-1 text-[15px] leading-6 text-ink">{outcomeLine(receipt)}</p> : null}
            <p className="mt-0.5 text-[13px] leading-5 text-ink-muted">
              Proposed by {proposerWord(proposal.proposedBy)} on {formatDay(proposal.demoDate)}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {waiting && decide ? (
                <>
                  <Button onClick={() => choose(receipt.id, "approve")} disabled={pending !== null}>
                    {pending?.id === receipt.id && pending.choice === "approve" ? "Approving" : proposal.type === "HOLD_ORDER" ? "Hold it" : "Approve"}
                  </Button>
                  <Button variant="secondary" onClick={() => choose(receipt.id, "decline")} disabled={pending !== null}>
                    {pending?.id === receipt.id && pending.choice === "decline" ? "Declining" : proposal.type === "HOLD_ORDER" ? "It's fine, count it" : "Decline"}
                  </Button>
                </>
              ) : null}
              <Link
                href={`/receipts/${receipt.id}`}
                className="ml-auto text-[15px] text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink"
              >
                Receipt No. {String(receipt.number).padStart(4, "0")}
              </Link>
            </div>

            {done ? (
              <div role="status" className="mt-3 flex items-start gap-3 rounded-tile bg-surface p-4">
                {done.decision ? (
                  <RefereeCard decision={done.decision} size="sm" />
                ) : (
                  <span aria-hidden className={`mt-1.5 inline-block size-2.5 shrink-0 rounded-[3px] ${done.choice === "approve" ? "bg-green" : "bg-ink-muted"}`} />
                )}
                <p className="text-[15px] leading-6 text-ink">{done.message}</p>
              </div>
            ) : outcome && !outcome.ok ? (
              <p role="alert" className="mt-3 flex items-start gap-2 text-[15px] leading-6 text-ink">
                <span aria-hidden className="mt-2 inline-block size-2 shrink-0 rounded-full bg-red" />
                {outcome.message}
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
