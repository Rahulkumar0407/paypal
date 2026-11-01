import type { Metadata } from "next";
import Link from "next/link";
import { Button, Card, ErrorState, PageSentence } from "@/components/ui";
import { PayPalStatus, paypalSetup } from "@/components/app/PayPalStatus";
import { getDemoStoreStatus, getVisitorStoreId } from "@/lib/demo";
import { isDatabaseConfigured } from "@/lib/shared/db";
import { formatDayWithYear } from "@/lib/shared/dates";
import { today } from "@/lib/shared/clock";
import type { DemoStoreStatus } from "@/types";

export const metadata: Metadata = { title: "Demo controls" };

const STORY = [
  { title: "Read the forecast", body: "Today's sentence says you'll be about $90 short on Thu 12 Nov: the supplier order and rent land the same day.", href: "/" },
  { title: "Approve the recovery reminder", body: "The Recovery agent found Maya's abandoned $72 order. The Guard approves the reminder.", href: "/approvals" },
  { title: "Pay as the buyer", body: "Open the reminder in the outbox and pay with the sandbox buyer login below. The forecast improves.", href: "/approvals" },
  { title: "Watch the Guard block a repeat", body: "A second reminder for the same order is blocked: PayPal shows it's already paid.", href: "/receipts" },
  { title: "Set a little aside each day", body: "Pick the set-aside fix for the remaining gap. Thursday turns green.", href: "/" },
  { title: "Ask a question", body: "Ask “Can I afford a $200 order on Monday?” and check the numbers.", href: "/ask" },
];

export default async function DemoPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const storeId = await getVisitorStoreId();
  let status: DemoStoreStatus | null = null;
  let problem: string | null = null;
  if (!isDatabaseConfigured()) {
    problem = "No database is connected yet, so the pages show sample data. Add the Supabase connection strings to .env (see README).";
  } else {
    try {
      status = await getDemoStoreStatus(storeId);
    } catch (error) {
      problem = `The database didn't answer: ${error instanceof Error ? error.message : "unknown error"}.`;
    }
  }

  return (
    <div className="space-y-12">
      <PageSentence>This is your own copy of Loop Audio. Reset it whenever you like and the story starts again.</PageSentence>

      {params.reset === "done" ? (
        <p role="status" className="rounded-control bg-paper px-4 py-3 text-[15px] text-ink ring-1 ring-ink/[0.06]">
          Reset done. Your copy is back to the start of the story.
        </p>
      ) : null}
      {params.reset === "failed" ? (
        <ErrorState title="The reset didn't finish." body="Nothing was half-changed: the reset runs in one transaction. Check the database connection and try again." />
      ) : null}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
        <div className="space-y-5">
          <Card>
            <h2 className="text-[20px] leading-7 font-semibold text-ink">Your copy</h2>
            <dl className="mt-3 divide-y divide-line text-[15px]">
              <Row label="Demo date" value={formatDayWithYear(today())} />
              <Row label="Store" value={storeId} mono />
              <Row label="Run" value={status?.demoRunId ?? "Not created yet"} mono />
              <Row label="Orders" value={status?.exists ? String(status.counts.orders) : "None yet"} />
              <Row label="Payments in history" value={status?.exists ? String(status.counts.ledgerEntries) : "None yet"} />
            </dl>
            <form action="/api/demo/reset" method="post" className="mt-5">
              <Button type="submit" disabled={!status}>
                Reset my copy
              </Button>
            </form>
          </Card>
          {problem ? <ErrorState title="The demo database isn't ready." body={problem} retryHref="/demo" /> : null}

          <PayPalStatus />
          {paypalSetup() === "sandbox" ? (
            <Card tone="outline">
              <h2 className="text-[17px] leading-6 font-semibold text-ink">Sandbox buyer login</h2>
              <p className="mt-1 text-[15px] leading-6 text-ink-muted">
                Added with the PayPal checkout task. Use it to pay a reminder as the buyer: sandbox money only, nothing real moves.
              </p>
            </Card>
          ) : null}
        </div>

        <section aria-labelledby="story-title" className="rounded-card bg-paper p-5 ring-1 ring-ink/[0.06] lg:p-6">
          <h2 id="story-title" className="text-[20px] leading-7 font-semibold text-ink">
            The demo story, in order
          </h2>
          <ol className="mt-3 divide-y divide-line">
            {STORY.map((step, i) => (
              <li key={step.title} className="grid grid-cols-[2rem_1fr] gap-x-3 py-4">
                <span className="font-serif text-[26px] leading-none text-ink">{i + 1}</span>
                <div>
                  <Link href={step.href} className="text-[16px] font-semibold text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink">
                    {step.title}
                  </Link>
                  <p className="mt-0.5 text-[15px] leading-6 text-ink-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-[15px] text-ink-muted">
            The buyer&apos;s side is the{" "}
            <Link href="/store" className="text-ink underline decoration-ink/30 underline-offset-4">
              Loop Audio store
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-ink-muted">{label}</dt>
      <dd className={`text-right text-ink ${mono ? "font-mono text-[13px] break-all" : ""}`}>{value}</dd>
    </div>
  );
}
