import type { Metadata } from "next";
import { EmptyState, ErrorState, PageSentence } from "@/components/ui";
import { Suspense } from "react";
import { DetectedPayees } from "@/components/app/DetectedPayees";
import { ExplainedPayees } from "@/components/app/ExplainedPayees";
import { DuesFilter } from "@/components/app/DuesFilter";
import { TillDrawer } from "@/components/app/TillDrawer";
import { duesInForecast } from "@/components/app/due-state";
import { getVisitorStoreId } from "@/lib/demo";
import { getDues, getForecast, getRecurringPayees } from "@/lib/forecast";
import { formatShortfall } from "@/lib/shared/money";

export const metadata: Metadata = { title: "Dues" };

const COUNT_WORD = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];

async function load() {
  const storeId = await getVisitorStoreId();
  try {
    const [forecast, dues, payees] = await Promise.all([getForecast(storeId), getDues(storeId), getRecurringPayees(storeId)]);
    return { storeId, forecast, dues, payees };
  } catch (error) {
    console.error("[dues] could not load:", error instanceof Error ? error.message : error);
    return null;
  }
}

/** Every payment due in the next 14 days, filterable by Covered / Tight / Short. */
export default async function DuesPage() {
  const data = await load();
  if (!data) {
    return (
      <div className="space-y-10">
        <PageSentence>What you have to pay in the next two weeks.</PageSentence>
        <ErrorState
          title="Couldn't load what you have to pay."
          body="Your money hasn't moved: nothing is paid without passing NeverShort's safety check. Try again in a minute."
          retryHref="/dues"
        />
      </div>
    );
  }

  const items = duesInForecast(data.dues, data.forecast);
  const firstShort = items.find((i) => i.state === "short");
  const detected = data.payees.filter((p) => p.status === "DETECTED");
  const count = COUNT_WORD[items.length] ?? String(items.length);

  return (
    <div className="space-y-12">
      <PageSentence>
        {count} payment{items.length === 1 ? "" : "s"} in the next two weeks.{" "}
        {firstShort
          ? `${firstShort.due.label.charAt(0).toUpperCase()}${firstShort.due.label.slice(1)} is ${formatShortfall(
              firstShort.due.amountCents - firstShort.due.readyCents,
            )} short.`
          : items.length > 0
            ? "Every one is ready."
            : ""}
      </PageSentence>

      <TillDrawer items={items} />

      <div className="grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14">
        <section aria-labelledby="dues-list-title" className="rounded-card bg-paper p-5 ring-1 ring-ink/[0.06] lg:p-6">
          <h2 id="dues-list-title" className="mb-3 text-[20px] leading-7 font-semibold text-ink">
            Next 14 days
          </h2>
          <DuesFilter items={items} />
        </section>

        <section aria-labelledby="detected-title" className="space-y-3">
          <h2 id="detected-title" className="text-[20px] leading-7 font-semibold text-ink">
            Regular payments we found
          </h2>
          <p className="text-[15px] leading-6 text-ink-muted">Confirm each one once and it goes into every forecast.</p>
          {detected.length > 0 ? (
            <Suspense fallback={<DetectedPayees payees={detected} />}>
              <ExplainedPayees storeId={data.storeId} payees={detected} />
            </Suspense>
          ) : (
            <EmptyState title="Nothing new to confirm." body="When a payment repeats at a similar amount and interval, we'll ask you about it here." />
          )}
        </section>
      </div>
    </div>
  );
}
