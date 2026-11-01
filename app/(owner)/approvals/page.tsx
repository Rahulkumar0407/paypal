import type { Metadata } from "next";
import Link from "next/link";
import { Card, EmptyState, PageSentence, SimulatedTag } from "@/components/ui";
import { InboxList } from "@/components/app/InboxList";
import { getVisitorStoreId } from "@/lib/demo";
import { listInbox } from "@/lib/guard";
import { listOutbox } from "@/lib/recovery";
import { paypalSetup } from "@/components/app/PayPalStatus";

export const metadata: Metadata = { title: "Approvals" };

const COUNT_WORD = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];

export default async function ApprovalsPage() {
  const storeId = await getVisitorStoreId();
  const [inbox, outbox] = await Promise.all([listInbox(storeId), listOutbox(storeId)]);
  const waiting = inbox.filter((i) => i.status === "WAITING");
  const decided = inbox.filter((i) => i.status !== "WAITING");

  return (
    <div className="space-y-12">
      <PageSentence>
        {waiting.length === 0
          ? "Nothing is waiting for you. The Guard handled everything else."
          : `${COUNT_WORD[waiting.length] ?? waiting.length} decision${waiting.length === 1 ? " is" : "s are"} waiting for you. Everything else, the Guard decided.`}
      </PageSentence>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14">
        <div className="space-y-10">
          <section aria-labelledby="waiting-title" className="rounded-card bg-paper p-5 ring-1 ring-ink/[0.06] lg:p-6">
            <h2 id="waiting-title" className="text-[20px] leading-7 font-semibold text-ink">
              Waiting for you
            </h2>
            {waiting.length > 0 ? (
              <InboxList items={waiting} />
            ) : (
              <div className="mt-3">
                <EmptyState title="All clear." body="When the Guard escalates something, like a gap loan or a payment over $100, it waits here for your OK." />
              </div>
            )}
          </section>

          <section aria-labelledby="decided-title" className="rounded-card bg-paper p-5 ring-1 ring-ink/[0.06] lg:p-6">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="decided-title" className="text-[20px] leading-7 font-semibold text-ink">
                Decided by the Guard
              </h2>
              <Link href="/receipts" className="text-[15px] text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
                Every receipt
              </Link>
            </div>
            {decided.length > 0 ? (
              <InboxList items={decided} />
            ) : (
              <div className="mt-3">
                <EmptyState title="No decisions yet." body="Every proposal from the agents, and every fix you pick, gets a receipt here." />
              </div>
            )}
          </section>
        </div>

        <section aria-labelledby="outbox-title" className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 id="outbox-title" className="text-[20px] leading-7 font-semibold text-ink">
              Outbox
            </h2>
            <SimulatedTag />
          </div>
          <p className="text-[15px] leading-6 text-ink-muted">
            Approved reminders land here instead of a real inbox. Open the link to pay as the sandbox buyer.
          </p>
          {outbox.length > 0 ? (
            outbox.map((m) => (
              <Card key={m.id} tone="outline">
                <p className="text-[13px] text-ink-muted">To {m.to}</p>
                <p className="mt-1 text-[16px] leading-6 font-semibold text-ink">{m.subject}</p>
                <p className="mt-2 text-[15px] leading-6 whitespace-pre-line text-ink">{m.body.replace(m.checkoutUrl, "").trim()}</p>
                {paypalSetup() === "sandbox" ? (
                  <a
                    href={m.checkoutUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex min-h-11 items-center rounded-control bg-brand px-4 text-[15px] font-medium text-white hover:bg-ink"
                  >
                    Open the PayPal checkout
                  </a>
                ) : (
                  <p className="mt-3 rounded-control bg-surface px-3 py-2 text-[14px] leading-5 text-ink-muted">
                    PayPal isn&apos;t set up yet, so this reminder has no live checkout link.
                  </p>
                )}
              </Card>
            ))
          ) : (
            <EmptyState title="No reminders sent yet." body="When the Guard approves a reminder, the message and its PayPal link appear here." />
          )}
        </section>
      </div>
    </div>
  );
}
