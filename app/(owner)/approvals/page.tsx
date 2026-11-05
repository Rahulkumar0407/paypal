import type { Metadata } from "next";
import Link from "next/link";
import { Card, EmptyState, ErrorState, PageSentence, SimulatedTag } from "@/components/ui";
import { InboxList } from "@/components/app/InboxList";
import { getVisitorStoreId } from "@/lib/demo";
import { listInbox } from "@/lib/guard";
import { listOutbox } from "@/lib/recovery";
import { after } from "next/server";
import { agentsHaveRun, runAgents } from "../agents";
import { FollowUp } from "@/components/app/FollowUp";
import { paypalSetup } from "@/components/app/PayPalStatus";
import { decideEscalation, sendFollowUp } from "./actions";

export const metadata: Metadata = { title: "Approvals" };

const COUNT_WORD = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];

export default async function ApprovalsPage() {
  const storeId = await getVisitorStoreId();
  // The reminder helper looks for unfinished checkouts first, so its proposals (and the Guard's decisions) show below.
  // If it fails, the page still works: AI and agent failures are never app failures.
  // The reminder helper and the risk check start in the background on the first visit. If they haven't finished their
  // first round yet, wait for it; after that, they look again quietly once the page is sent (a new unfinished
  // checkout shows up on the next visit). Their failures are logged, never shown as a broken page.
  if (agentsHaveRun(storeId)) after(() => runAgents(storeId));
  else await runAgents(storeId);
  const loaded = await Promise.all([listInbox(storeId), listOutbox(storeId)]).catch((error: unknown) => {
    console.error("[approvals] could not load the inbox:", error instanceof Error ? error.message : error);
    return null;
  });
  if (!loaded) {
    return (
      <div className="space-y-8">
        <PageSentence>Your approvals.</PageSentence>
        <ErrorState
          title="Couldn't load your approvals."
          body="Nothing that needs your OK has gone ahead. Try again in a minute."
          retryHref="/approvals"
        />
      </div>
    );
  }
  const [inbox, outbox] = loaded;
  const waiting = inbox.filter((i) => i.status === "WAITING");
  const decided = inbox.filter((i) => i.status !== "WAITING");

  return (
    <div className="space-y-12">
      <PageSentence>
        {waiting.length === 0
          ? "Nothing needs your OK right now. The safety check handled everything else."
          : `${COUNT_WORD[waiting.length] ?? waiting.length} ${waiting.length === 1 ? "thing needs" : "things need"} your OK. The safety check handled the rest.`}
      </PageSentence>
      <p className="-mt-6 max-w-[62ch] text-[16px] leading-7 text-ink-muted">
        NeverShort never moves money on its own. Every suggestion goes through the Margin Guard, a set of fixed safety rules:
        small, safe things go ahead, bigger ones wait here for you, and risky ones are stopped.
      </p>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14">
        <div className="space-y-10">
          <section aria-labelledby="waiting-title" className="rounded-card bg-paper p-5 ring-1 ring-ink/[0.06] lg:p-6">
            <h2 id="waiting-title" className="text-[20px] leading-7 font-semibold text-ink">
              Waiting for you
            </h2>
            {waiting.length > 0 ? (
              <InboxList items={waiting} decide={decideEscalation} />
            ) : (
              <div className="mt-3">
                <EmptyState title="All clear." body="Anything bigger, like a loan or a payment over $100, waits here for your OK before it happens." />
              </div>
            )}
          </section>

          <section aria-labelledby="decided-title" className="rounded-card bg-paper p-5 ring-1 ring-ink/[0.06] lg:p-6">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="decided-title" className="text-[20px] leading-7 font-semibold text-ink">
                Already decided
              </h2>
              <Link href="/receipts" className="shrink-0 text-[15px] whitespace-nowrap text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
                Every receipt
              </Link>
            </div>
            {decided.length > 0 ? (
              <InboxList items={decided} />
            ) : (
              <div className="mt-3">
                <EmptyState title="No decisions yet." body="Every suggestion, and every fix you pick, gets a receipt here." />
              </div>
            )}
          </section>
        </div>

        <section aria-labelledby="outbox-title" className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 id="outbox-title" className="text-[20px] leading-7 font-semibold text-ink">
              Sent reminders
            </h2>
            <SimulatedTag />
          </div>
          <p className="text-[15px] leading-6 text-ink-muted">
            Reminders land here instead of a real email inbox, so you can see exactly what the customer gets. Open the link to pay as the test buyer.
          </p>
          {outbox.length > 0 ? (
            outbox.map((m, i) => (
              <Card key={m.id} tone="outline">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[13px] text-ink-muted">To {m.to}</p>
                  <SimulatedTag />
                </div>
                <p className="mt-1 text-[16px] leading-6 font-semibold text-ink">{m.subject}</p>
                <p className="mt-2 text-[15px] leading-6 whitespace-pre-line text-ink">{m.checkoutUrl ? m.body.replace(m.checkoutUrl, "(link below)") : m.body}</p>
                {m.checkoutUrl && paypalSetup() !== "not-configured" ? (
                  <a
                    href={m.checkoutUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex min-h-11 items-center rounded-control bg-brand px-4 text-[15px] font-medium text-white hover:bg-ink"
                  >
                    {paypalSetup() === "fake" ? "Open the checkout (fake PayPal)" : "Open the PayPal checkout"}
                  </a>
                ) : (
                  <p className="mt-3 rounded-control bg-surface px-3 py-2 text-[14px] leading-5 text-ink-muted">
                    PayPal isn&apos;t set up yet, so this reminder has no live checkout link.
                  </p>
                )}
                {outbox.findIndex((x) => x.orderId === m.orderId) === i ? <FollowUp orderId={m.orderId} send={sendFollowUp} /> : null}
              </Card>
            ))
          ) : (
            <EmptyState title="No reminders sent yet." body="When a reminder is approved, the message and its PayPal link appear here." />
          )}
        </section>
      </div>
    </div>
  );
}
