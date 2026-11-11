import type { Metadata } from "next";
import Link from "next/link";
import type { AffordabilityCheck, DemoStoreStatus, Forecast, RecoveryCandidate } from "@/types";
import { ErrorState } from "@/components/ui";
import { PayPalStatus } from "@/components/app/PayPalStatus";
import { ResetDemo } from "@/components/app/ResetDemo";
import { GuidedDemoWizard, type GuidedStep } from "@/components/app/GuidedDemoWizard";
import { getDemoStoreStatus, getVisitorStoreId, paypalFeeCents } from "@/lib/demo";
import { buildHeadline, canAfford, getForecast } from "@/lib/forecast";
import { findRecoveryCandidates } from "@/lib/recovery";
import { today } from "@/lib/shared/clock";
import { isDatabaseConfigured } from "@/lib/shared/db";
import { addDays, formatDay, formatDayWithYear, weekdayIndex } from "@/lib/shared/dates";
import { formatDollars, formatShortfall } from "@/lib/shared/money";
import { resetMyCopy } from "./actions";

export const metadata: Metadata = { title: "Demo Guide • tmrw" };

interface StoryData {
  forecast: Forecast | null;
  candidate: RecoveryCandidate | null;
  afford: AffordabilityCheck | null;
  monday: string;
}

function nextMonday(from: string): string {
  for (let i = 1; i <= 7; i++) {
    const day = addDays(from, i);
    if (weekdayIndex(day) === 1) return day;
  }
  return addDays(from, 7);
}

async function loadStory(storeId: string): Promise<StoryData> {
  const monday = nextMonday(today());
  const [forecast, candidates, afford] = await Promise.allSettled([
    getForecast(storeId),
    findRecoveryCandidates(storeId),
    canAfford(storeId, 20_000, monday),
  ]);
  const ok = <T,>(r: PromiseSettledResult<T>): T | null => (r.status === "fulfilled" ? r.value : null);
  const list = ok(candidates) ?? [];
  return {
    forecast: ok(forecast),
    candidate: list.find((c) => c.contactConsent) ?? list[0] ?? null,
    afford: ok(afford),
    monday,
  };
}

function buildSteps({ forecast, candidate, afford, monday }: StoryData): GuidedStep[] {
  const gap = forecast?.firstShortfall ?? null;
  const gapDay = gap ? formatDay(gap.date) : "Thu 12 Nov";
  const amount = candidate ? formatDollars(candidate.amountCents) : "$72";
  const net = candidate
    ? formatDollars(candidate.amountCents - paypalFeeCents(candidate.amountCents))
    : null;
  const who = candidate ? `${candidate.customerName}'s` : "an";

  return [
    {
      title: "Read the 30-day cash forecast",
      todo: "Open Overview and review your 30-day balance trajectory.",
      see: forecast
        ? `"${buildHeadline(forecast).text}" — ${gapDay} shows as a critical shortfall in the daily strip.`
        : `A clear forecast indicating a projected shortfall on ${gapDay}.`,
      uses: ["simulated"],
      link: { label: "Open Overview", href: "/today" },
    },
    {
      title: "Send a payment recovery reminder",
      todo: `Open Decisions. The Recovery Co-pilot finds ${who} unfinished ${amount} checkout and drafts a personalized reminder.`,
      see: "Margin Guard evaluates consent and frequency: APPROVE. A simulated outbox entry is created with a live PayPal checkout link.",
      uses: ["simulated", "sandbox"],
      link: { label: "Open Decisions", href: "/approvals" },
    },
    {
      title: "Pay as the customer via PayPal Sandbox",
      todo: "In Sent reminders, open the PayPal Sandbox checkout link and complete test checkout.",
      see: net
        ? `PayPal webhook confirms payment capture. Available cash immediately rises by net ${net} (after PayPal fees).`
        : "PayPal confirms capture and your forecast improves by the net amount received.",
      uses: ["sandbox"],
      link: { label: "Open Sent Reminders", href: "/approvals#outbox-title" },
      buyerLogin: true,
    },
    {
      title: "See repeated reminder get stopped by Margin Guard",
      todo: "In Decisions, click 'Send a follow-up' for the same customer order.",
      see: "Margin Guard Rule 1 (Already Paid) triggers: BLOCK. An immutable audit receipt is stamped BLOCKED. Customer is not disturbed.",
      uses: ["sandbox"],
      link: { label: "Open Decisions Inbox", href: "/approvals#outbox-title" },
    },
    {
      title: "Fix the remaining gap with daily set-aside",
      todo: `Open Recommended Fixes for ${gapDay} and choose 'Set aside a little each day'.`,
      see: `Margin Guard confirms daily set-aside cap <= 30%: APPROVE. ${gapDay} turns green (Covered) across the dashboard.`,
      uses: ["simulated"],
      link: { label: "Compare Fix Options", href: "/fix" },
    },
    {
      title: "Ask the AI Co-pilot: 'Can I afford $200 on Monday?'",
      todo: `Open Ask Co-pilot and query: 'Can I afford a $200 order on Monday?'`,
      see: afford
        ? affordAnswer(afford, monday)
        : `A calculated, deterministic answer for ${formatDay(monday)} grounded in store data.`,
      uses: ["simulated"],
      link: { label: "Ask Co-pilot", href: "/ask" },
    },
  ];
}

function affordAnswer(afford: AffordabilityCheck, monday: string): string {
  const day = formatDay(monday);
  const after = formatDollars(afford.balanceAfterOnDateCents);
  if (afford.affordable) {
    return `Calculated from store ledger: Yes. ${day} closes at ${after} post-expenditure, preserving your minimum balance threshold.`;
  }
  const gap = afford.shortfallAfter;
  return gap
    ? `Calculated from store ledger: No. While ${day} closes at ${after}, the expenditure triggers a ${formatShortfall(gap.amountCents)} deficit on ${formatDay(gap.date)}.`
    : `Calculated from store ledger: No. ${day} would drop below your required minimum balance.`;
}

export default async function DemoPage() {
  const storeId = await getVisitorStoreId();
  let status: DemoStoreStatus | null = null;
  let problem: string | null = null;

  if (!isDatabaseConfigured()) {
    problem =
      "Database persistence is running in mock mode. Sample data is active and the interactive walkthrough steps below work seamlessly.";
  } else {
    try {
      status = await getDemoStoreStatus(storeId);
    } catch (error) {
      console.error("[demo] could not read store status:", error instanceof Error ? error.message : error);
      problem = "Could not fetch active store state. The steps below remain operational.";
    }
  }

  const steps = buildSteps(await loadStory(storeId));
  const startDay = formatDayWithYear(today());

  return (
    <div className="space-y-8 max-w-[960px] mx-auto">
      {/* ── Welcome Hero ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-600">
            Interactive Walkthrough
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-black text-slate-900 tracking-tight">
          See how tmrw works.
        </h1>
        <p className="max-w-[75ch] text-sm sm:text-base text-slate-600 leading-relaxed">
          tmrw acts as a money co-pilot for small businesses: it forecasts a 30-day cashflow runway, prevents risky overdrafts, and automates checkout recovery. AI agents only propose actions; every financial movement must pass deterministic <strong>Margin Guard</strong> safety rules.
        </p>
        <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-500">
          <span>Demo store: <strong className="text-slate-900">Dunder Mifflin & Co.</strong></span>
          <span>•</span>
          <span>Demo baseline: <strong className="text-slate-900">{startDay}</strong></span>
          <span>•</span>
          <span>Sandbox mode: <strong className="text-emerald-700 font-semibold">Active</strong></span>
        </div>
      </div>

      {/* ── Main Stepper & Sidebar Layout ── */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] items-start">
        {/* Left: Guided Step Wizard */}
        <section aria-labelledby="story-title" className="space-y-6">
          <GuidedDemoWizard steps={steps} startDay={startDay} />
        </section>

        {/* Right: Environment & Control Center */}
        <aside className="space-y-6 lg:sticky lg:top-8">
          {/* Reset Control Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Reset Demo Instance
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Restores your private Dunder Mifflin & Co. copy to {startDay}. Other visitors&apos; sandboxes remain completely unaffected.
              </p>
            </div>

            <dl className="divide-y divide-slate-100 text-xs">
              <Row label="Demo Clock" value={startDay} />
              <Row
                label="Orders in Database"
                value={status?.exists ? String(status.counts.orders) : "Active"}
              />
              <Row
                label="Ledger Records"
                value={status?.exists ? String(status.counts.ledgerEntries) : "Active"}
              />
            </dl>

            <div className="pt-2">
              <ResetDemo action={resetMyCopy} startDay={formatDay(today())} disabled={!status} />
            </div>
          </div>

          {/* Try Your Own Scenario */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-3">
            <h3 className="text-base font-semibold text-slate-900">
              Try Your Own Numbers
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Test custom initial balances, daily sales volume, and scheduled recurring bills in our what-if financial model.
            </p>
            <div className="pt-1">
              <Link
                href="/try"
                className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-semibold transition-colors"
              >
                Open Cash Flow Simulator →
              </Link>
            </div>
          </div>

          {problem && (
            <ErrorState
              title="Demo Database Status"
              body={problem}
              retryHref="/demo"
            />
          )}

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <PayPalStatus />
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-500 flex items-center justify-between">
            <span>Customer storefront view:</span>
            <Link
              href="/store"
              className="text-blue-600 font-semibold hover:underline"
            >
              Dunder Mifflin & Co. Store →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 text-xs">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-mono font-semibold text-slate-900">{value}</dd>
    </div>
  );
}
