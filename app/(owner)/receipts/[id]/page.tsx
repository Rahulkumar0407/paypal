import type { Metadata } from "next";
import Link from "next/link";
import type { Receipt as ReceiptData, ReceiptEventKind } from "@/types";
import { ButtonLink, Card, CardTitle, EmptyState, ErrorState, PageSentence, Receipt, RefereeCard } from "@/components/ui";
import { ACTION_WORD } from "@/components/ui/meaning";
import { clockTime, proposerName, receiptNo } from "@/components/app/receipt-words";
import { getVisitorStoreId } from "@/lib/demo";
import { getReceipt, listInbox } from "@/lib/guard";
import { formatDay } from "@/lib/shared/dates";
import { formatCents } from "@/lib/shared/money";

export const metadata: Metadata = { title: "Receipt" };

const SENTENCE = {
  APPROVE: "The safety check said yes.",
  ESCALATE: "This needs your OK.",
  BLOCK: "The safety check stopped this.",
} as const;

const EVENT_WORD: Record<ReceiptEventKind, string> = {
  DECIDED: "Safety check ran",
  OWNER_APPROVED: "You approved",
  OWNER_REJECTED: "You declined",
  RECHECK_BLOCKED: "Stopped at the last check",
  EXECUTED: "Done",
  EXECUTION_FAILED: "Didn't go through",
};

/** One receipt: the thermal print on the green counter, the decision as a referee card, what happened, and the PayPal IDs. */
export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const storeId = await getVisitorStoreId();
  const loaded = await Promise.all([getReceipt(storeId, id), listInbox(storeId)]).catch((error: unknown) => {
    console.error("[receipt] could not load:", error instanceof Error ? error.message : error);
    return null;
  });

  if (!loaded) {
    return (
      <div className="space-y-8">
        <BackLink />
        <ErrorState title="Couldn't load this receipt." body="Receipts are never changed or lost: they only gain new lines. Try again in a minute." retryHref={`/receipts/${id}`} />
      </div>
    );
  }

  const [receipt, inbox] = loaded;
  if (!receipt) {
    return (
      <div className="space-y-8">
        <BackLink />
        <EmptyState
          title="No receipt here."
          body="This link doesn't match any receipt in your demo. After a reset, older receipts are gone."
          action={{ label: "See every receipt", href: "/receipts" }}
        />
      </div>
    );
  }

  const waiting = inbox.some((i) => i.receipt.id === receipt.id && i.status === "WAITING");
  const { proposal, decision } = receipt;

  return (
    <div className="space-y-8 lg:space-y-10">
      <div className="space-y-4">
        <BackLink />
        <PageSentence>{SENTENCE[decision.decision]}</PageSentence>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:items-start lg:gap-12">
        <div className="-mx-5 flex justify-center bg-brand px-4 py-10 sm:mx-0 sm:rounded-card sm:px-8 lg:py-12">
          <Receipt receipt={receipt} />
        </div>

        <div className="space-y-5">
          <Card>
            <RefereeCard decision={decision.decision} size="lg" />
            <p className="mt-4 text-[17px] leading-7 text-ink">{decision.headlineReason}</p>
            <dl className="mt-4 space-y-1.5 text-[15px] leading-6">
              <Fact term="Action" value={`${ACTION_WORD[proposal.type]}: ${proposal.target.label}`} />
              <Fact term="Amount" value={formatCents(proposal.amountCents)} />
              <Fact term="Proposed by" value={proposerName(proposal.proposedBy)} />
              <Fact term="Receipt" value={`${receiptNo(receipt)}, ${formatDay(decision.demoDate)} at ${clockTime(decision.decidedAt)}`} />
            </dl>
            {waiting ? (
              <div className="mt-5">
                <ButtonLink href="/approvals">Decide in Approvals</ButtonLink>
              </div>
            ) : null}
          </Card>

          <Card>
            <CardTitle>What happened</CardTitle>
            <ol className="mt-3 space-y-3">
              {receipt.events.map((e) => (
                <li key={`${e.kind}-${e.at}`} className="flex gap-3 text-[15px] leading-6">
                  <span className="w-12 shrink-0 tabular text-ink-muted">{clockTime(e.at)}</span>
                  <span>
                    <span className="font-semibold text-ink">{EVENT_WORD[e.kind]}</span>
                    <span className="block text-ink-muted">{e.detail}</span>
                  </span>
                </li>
              ))}
            </ol>
            {waiting ? <p className="mt-3 text-[15px] leading-6 text-ink-muted">Nothing runs until you approve it.</p> : null}
          </Card>

          <Card>
            <CardTitle>PayPal IDs</CardTitle>
            <PayPalIds receipt={receipt} />
          </Card>
        </div>
      </div>
    </div>
  );
}

function PayPalIds({ receipt }: { receipt: ReceiptData }) {
  const { checked, created } = receipt.paypalIds;
  if (checked.length === 0 && created.length === 0) {
    return <p className="mt-2 text-[15px] leading-6 text-ink-muted">None: this decision didn&apos;t need to check or create anything at PayPal.</p>;
  }
  return (
    <dl className="mt-3 space-y-3 text-[15px] leading-6">
      {checked.length > 0 ? (
        <div>
          <dt className="text-ink-muted">Checked with PayPal</dt>
          {checked.map((pid) => (
            <dd key={pid} className="font-semibold break-all text-ink tabular">
              {pid}
            </dd>
          ))}
        </div>
      ) : null}
      {created.length > 0 ? (
        <div>
          <dt className="text-ink-muted">Created at PayPal</dt>
          {created.map((pid) => (
            <dd key={pid} className="font-semibold break-all text-ink tabular">
              {pid}
            </dd>
          ))}
        </div>
      ) : null}
    </dl>
  );
}

function Fact({ term, value }: { term: string; value: string }) {
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3">
      <dt className="text-ink-muted">{term}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/receipts" className="text-[15px] text-ink-muted underline decoration-ink/30 underline-offset-4 hover:text-ink hover:decoration-ink">
      All receipts
    </Link>
  );
}
