import type { Metadata } from "next";
import Link from "next/link";
import type { AffordabilityCheck, DemoStoreStatus, Forecast, RecoveryCandidate } from "@/types";
import { ButtonLink, Card, CardTitle, ErrorState, PageSentence, SandboxTag, SimulatedTag } from "@/components/ui";
import { CopyText } from "@/components/app/CopyText";
import { PayPalStatus, paypalSetup } from "@/components/app/PayPalStatus";
import { ResetDemo } from "@/components/app/ResetDemo";
import { getDemoStoreStatus, getVisitorStoreId, paypalFeeCents } from "@/lib/demo";
import { buildHeadline, canAfford, getForecast } from "@/lib/forecast";
import { findRecoveryCandidates } from "@/lib/recovery";
import { today } from "@/lib/shared/clock";
import { isDatabaseConfigured } from "@/lib/shared/db";
import { addDays, formatDay, formatDayWithYear, weekdayIndex } from "@/lib/shared/dates";
import { formatDollars, formatShortfall } from "@/lib/shared/money";
import { resetMyCopy } from "./actions";

export const metadata: Metadata = { title: "Demo guide" };

/**
 * The judges' sandbox buyer login. Only this buyer test account may be published (AGENTS.md section 6).
 * TODO(Person 2): fill in once the judges' sandbox buyer account is created.
 */
const SANDBOX_BUYER: { email: string; password: string } | null = null;

type Uses = "simulated" | "sandbox";

interface Step {
  title: string;
  todo: string;
  see: string;
  uses: Uses[];
  link: { label: string; href: string };
  buyerLogin?: boolean;
}

interface StoryData {
  forecast: Forecast | null;
  candidate: RecoveryCandidate | null;
  afford: AffordabilityCheck | null;
  monday: string;
}

/** The first Monday after today: "Monday" in the story (Mon 9 Nov on the demo date). */
function nextMonday(from: string): string {
  for (let i = 1; i <= 7; i++) {
    const day = addDays(from, i);
    if (weekdayIndex(day) === 1) return day;
  }
  return addDays(from, 7);
}

async function loadStory(storeId: string): Promise<StoryData> {
  const monday = nextMonday(today());
  // Each part is optional: if a module fails, its step falls back to plain words and the guide still works.
  const [forecast, candidates, afford] = await Promise.allSettled([getForecast(storeId), findRecoveryCandidates(storeId), canAfford(storeId, 20_000, monday)]);
  const ok = <T,>(r: PromiseSettledResult<T>): T | null => (r.status === "fulfilled" ? r.value : null);
  const list = ok(candidates) ?? [];
  return { forecast: ok(forecast), candidate: list.find((c) => c.contactConsent) ?? list[0] ?? null, afford: ok(afford), monday };
}

function buildSteps({ forecast, candidate, afford, monday }: StoryData): Step[] {
  const gap = forecast?.firstShortfall ?? null;
  const gapDay = gap ? formatDay(gap.date) : "Thu 12 Nov";
  const amount = candidate ? formatDollars(candidate.amountCents) : "$72";
  const net = candidate ? formatDollars(candidate.amountCents - paypalFeeCents(candidate.amountCents)) : null;
  const who = candidate ? `${candidate.customerName}'s` : "an";

  return [
    {
      title: "Read the forecast",
      todo: "Open Today and read the sentence at the top of the green note.",
      see: forecast
        ? `“${buildHeadline(forecast).text}” ${gapDay} is the red tile in the 14-day strip.`
        : `A sentence saying you'll be about $90 short on ${gapDay}, and a red tile on that day.`,
      uses: ["simulated"],
      link: { label: "Open Today", href: "/today" },
    },
    {
      title: "Send a payment reminder",
      todo: `Open Approvals. The reminder helper spots ${who} unfinished ${amount} order and drafts a reminder to the customer.`,
      see: "Under Already decided, a green Approved card: the safety check said yes. The reminder appears under Sent reminders, labelled Simulated, with a new PayPal payment link.",
      uses: ["simulated", "sandbox"],
      link: { label: "Open Approvals", href: "/approvals" },
    },
    {
      title: "Pay as the buyer",
      todo: "Under Sent reminders, open the PayPal link and pay with the test buyer login below.",
      see: net
        ? `PayPal confirms the payment. The forecast rises by ${net}: the ${amount} minus PayPal's fee, which is what actually arrives.`
        : "PayPal confirms the payment, and the forecast rises by what actually arrives after PayPal's fee.",
      uses: ["sandbox"],
      link: { label: "Open Sent reminders", href: "/approvals#outbox-title" },
      buyerLogin: true,
    },
    {
      title: "See a second reminder get stopped",
      todo: "Back in Approvals, press Send a follow-up on the reminder: the reminder helper drafts a second one for the same order.",
      see: "A red Blocked card, and a receipt stamped BLOCKED: PayPal shows the order is already paid, so the customer isn't bothered again.",
      uses: ["sandbox"],
      link: { label: "Open Sent reminders", href: "/approvals#outbox-title" },
    },
    {
      title: "Set a little aside each day",
      todo: `Open the ways to cover ${gapDay} and pick “Set aside a little each day”.`,
      see: `A green Approved card. ${gapDay} turns green in the strip and the sentence at the top changes.`,
      uses: ["simulated"],
      link: { label: "Open the fixes", href: "/fix" },
    },
    {
      title: "Ask a question",
      todo: `Open Ask and type: “Can I afford a $200 order on Monday?”`,
      see: afford ? affordAnswer(afford, monday) : `An answer worked out from the store's numbers for ${formatDay(monday)}, not a guess.`,
      uses: ["simulated"],
      link: { label: "Open Ask", href: "/ask" },
    },
  ];
}

/** What step 6 should answer, from the same calculation Ask uses. */
function affordAnswer(afford: AffordabilityCheck, monday: string): string {
  const day = formatDay(monday);
  const after = formatDollars(afford.balanceAfterOnDateCents);
  if (afford.affordable) return `An answer from the store's numbers: yes. ${day} closes at ${after} after the order, and no day drops below the minimum.`;
  const gap = afford.shortfallAfter;
  return gap
    ? `An answer from the store's numbers: not yet. ${day} itself closes at ${after}, but the order leaves ${formatDay(gap.date)} ${formatShortfall(gap.amountCents)} short.`
    : `An answer from the store's numbers: not yet. ${day} closes at ${after} after the order, below the minimum.`;
}

/** The judges' guide: what NeverShort is, the sandbox buyer login, the six story steps, and a reset. */
export default async function DemoPage() {
  const storeId = await getVisitorStoreId();
  let status: DemoStoreStatus | null = null;
  let problem: string | null = null;
  if (!isDatabaseConfigured()) {
    problem = "No database is connected, so the pages show sample data and there's nothing to reset. The steps below still work.";
  } else {
    try {
      status = await getDemoStoreStatus(storeId);
    } catch (error) {
      console.error("[demo] could not read the store status:", error instanceof Error ? error.message : error);
      problem = "The database didn't answer, so the shop's details are missing. The steps below still work; try the reset again in a minute.";
    }
  }

  const steps = buildSteps(await loadStory(storeId));
  const startDay = formatDayWithYear(today());

  return (
    <div className="space-y-10 lg:space-y-12">
      <div className="space-y-5">
        <PageSentence>Try NeverShort in six steps. It takes about two minutes.</PageSentence>
        <p className="max-w-[62ch] text-[17px] leading-7 text-ink">
          NeverShort is a money co-pilot for a small online shop: it forecasts the next two weeks and makes sure the shop gets paid and
          never comes up short. AI only suggests. Before any money moves, a safety check called the Margin Guard tests each suggestion against fixed rules.
        </p>
        <p className="max-w-[62ch] text-[15px] leading-6 text-ink-muted">
          You&apos;re running a demo shop called Loop Audio, which sells headphones. It&apos;s yours alone: nobody else sees what you
          click, and Reset puts it back to the start.
        </p>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[15px] leading-6 text-ink-muted">
          <span className="inline-flex items-center gap-2">
            <SimulatedTag /> made up for the demo
          </span>
          <span className="inline-flex items-center gap-2">
            <SandboxTag /> real PayPal checkout, test money only
          </span>
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:items-start lg:gap-12">
        <section aria-labelledby="story-title" className="rounded-card bg-paper p-5 ring-1 ring-ink/[0.06] lg:p-8">
          <h2 id="story-title" className="text-[20px] leading-7 font-semibold text-ink">
            The story, in six steps
          </h2>
          <p className="mt-1 text-[15px] leading-6 text-ink-muted">The demo date is {startDay}. Do them in order; each takes under a minute.</p>
          <ol className="mt-2 divide-y divide-line">
            {steps.map((step, i) => (
              <li key={step.title} className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3 py-6 lg:grid-cols-[3rem_minmax(0,1fr)]">
                <span aria-hidden className="font-serif text-[32px] leading-none text-ink lg:text-[40px]">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <h3 className="text-[18px] leading-7 font-semibold text-ink">
                      <span className="sr-only">Step {i + 1}: </span>
                      {step.title}
                    </h3>
                    <span className="flex gap-1.5">
                      {step.uses.includes("simulated") ? <SimulatedTag /> : null}
                      {step.uses.includes("sandbox") ? <SandboxTag /> : null}
                    </span>
                  </div>
                  <dl className="mt-2 space-y-2 text-[15px] leading-6">
                    <div>
                      <dt className="font-semibold text-ink">Do</dt>
                      <dd className="text-ink">{step.todo}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-ink">You&apos;ll see</dt>
                      <dd className="text-ink-muted">{step.see}</dd>
                    </div>
                  </dl>
                  {step.buyerLogin ? <BuyerLogin /> : null}
                  <div className="mt-4">
                    <ButtonLink href={step.link.href} variant={i === 0 ? "primary" : "secondary"}>
                      {step.link.label}
                    </ButtonLink>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <aside className="space-y-5 lg:sticky lg:top-8">
          <Card>
            <CardTitle>Start again</CardTitle>
            <p className="mt-1 text-[15px] leading-6 text-ink-muted">
              Puts the shop back to {startDay}, before step 1, so the story plays the same way every time. Nobody else&apos;s demo is touched.
            </p>
            <dl className="mt-3 divide-y divide-line text-[15px]">
              <Row label="Demo date" value={startDay} />
              <Row label="Orders" value={status?.exists ? String(status.counts.orders) : status ? "Being set up" : "Not available"} />
              <Row label="Payments in history" value={status?.exists ? String(status.counts.ledgerEntries) : status ? "Being set up" : "Not available"} />

            </dl>
            <div className="mt-5">
              <ResetDemo action={resetMyCopy} startDay={formatDay(today())} disabled={!status} />
            </div>
          </Card>
          {problem ? <ErrorState title="The shop's details aren't available." body={problem} retryHref="/demo" /> : null}
          <PayPalStatus />
          <p className="px-1 text-[15px] leading-6 text-ink-muted">
            The buyer&apos;s side is the{" "}
            <Link href="/store" className="text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
              Loop Audio store
            </Link>
            .
          </p>
        </aside>
      </div>
    </div>
  );
}

function BuyerLogin() {
  const live = paypalSetup() === "sandbox";
  return (
    <div className="mt-4 rounded-tile bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[15px] leading-6 font-semibold text-ink">Test buyer login</p>
        <SandboxTag />
      </div>
      {SANDBOX_BUYER ? (
        <div className="mt-1 divide-y divide-line">
          <CopyText label="Email" value={SANDBOX_BUYER.email} />
          <CopyText label="Password" value={SANDBOX_BUYER.password} />
        </div>
      ) : (
        <p className="mt-1 text-[15px] leading-6 text-ink-muted">The test buyer&apos;s email and password appear here before judging opens.</p>
      )}
      <p className="mt-2 text-[14px] leading-5 text-ink-muted">
        {live ? "A PayPal test account: test money only, nothing real moves." : "Checkout is switched off until PayPal is set up."}
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-right text-ink tabular">{value}</dd>
    </div>
  );
}
