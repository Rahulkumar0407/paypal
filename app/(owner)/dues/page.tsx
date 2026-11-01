import type { Metadata } from "next";
import { PageSentence, EmptyState } from "@/components/ui";
import { DueList } from "@/components/app/DueList";
import { DetectedPayees } from "@/components/app/DetectedPayees";
import { getVisitorStoreId } from "@/lib/demo";
import { getDues, getRecurringPayees } from "@/lib/forecast";
import { addDays, compareDates } from "@/lib/shared/dates";
import { today } from "@/lib/shared/clock";
import { formatShortfall } from "@/lib/shared/money";

export const metadata: Metadata = { title: "Dues" };

const COUNT_WORD = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];

export default async function DuesPage() {
  const storeId = await getVisitorStoreId();
  const [dues, payees] = await Promise.all([getDues(storeId), getRecurringPayees(storeId)]);
  const horizon = addDays(today(), 13);
  const sorted = [...dues].sort((a, b) => compareDates(a.dueOn, b.dueOn));
  const soon = sorted.filter((d) => d.dueOn <= horizon);
  const later = sorted.filter((d) => d.dueOn > horizon);
  const firstShort = soon.find((d) => d.readyCents < d.amountCents);
  const detected = payees.filter((p) => p.status === "DETECTED");
  const count = COUNT_WORD[soon.length] ?? String(soon.length);

  return (
    <div className="space-y-12">
      <PageSentence>
        {count} payment{soon.length === 1 ? "" : "s"} in the next two weeks.{" "}
        {firstShort
          ? `${firstShort.label.charAt(0).toUpperCase()}${firstShort.label.slice(1)} is ${formatShortfall(firstShort.amountCents - firstShort.readyCents)} short.`
          : "Every one is ready."}
      </PageSentence>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14">
        <section aria-labelledby="soon-title">
          <h2 id="soon-title" className="text-[20px] leading-7 font-semibold text-ink">
            Coming up
          </h2>
          {soon.length > 0 ? (
            <DueList dues={soon} />
          ) : (
            <div className="mt-3">
              <EmptyState title="Nothing due in the next two weeks." body="Bills and supplier orders show up here as soon as they're found in your payments." />
            </div>
          )}
          {later.length > 0 ? (
            <>
              <h2 className="mt-10 text-[20px] leading-7 font-semibold text-ink">Later</h2>
              <DueList dues={later} />
            </>
          ) : null}
        </section>

        <section aria-labelledby="detected-title" className="space-y-3">
          <h2 id="detected-title" className="text-[20px] leading-7 font-semibold text-ink">
            Regular payments we found
          </h2>
          <p className="text-[15px] leading-6 text-ink-muted">Confirm each one once and it goes into every forecast.</p>
          {detected.length > 0 ? (
            <DetectedPayees payees={detected} />
          ) : (
            <EmptyState title="Nothing new to confirm." body="When a payment repeats at a similar amount and interval, we'll ask you about it here." />
          )}
        </section>
      </div>
    </div>
  );
}
