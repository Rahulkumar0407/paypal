import Image from "next/image";
import Link from "next/link";
import type { LandingStory } from "@/lib/landing";
import { Receipt } from "@/components/ui/Receipt";
import { DECISION_FILL, DECISION_WORD } from "@/components/ui/meaning";
import { weekdayLong } from "@/lib/shared/dates";
import { formatDollars, formatShortfall } from "@/lib/shared/money";
import { InView } from "../InView";
import { ComesBack } from "./ComesBack";
import { DayWord, FixPicker, type PickerDay } from "./FixPicker";
import { HowBlocks } from "./HowBlocks";
import { ShortDayBoard } from "./ShortDayBoard";

/** The public repo (MIT). */
export const REPO_URL = "https://github.com/Rahulkumar0407/paypal";
const REPO_NAME = REPO_URL.replace("https://github.com/", "");
const SHOP = "Dunder Mifflin & Co.";

/** A section of the page: its id is the tab's target; `.h-sec-in` is what dims when another section is lit. */
function Section({ id, label, className = "", children }: { id: string; label: string; className?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-label={label} className={`h-sec ${className}`}>
      <div className="h-sec-in mx-auto w-full max-w-[1200px] px-4 pt-28 pb-20 sm:px-6 lg:px-10 lg:pt-36 lg:pb-28">{children}</div>
    </section>
  );
}

function Heading({ eyebrow, title, lead, dark = false }: { eyebrow: string; title: React.ReactNode; lead?: React.ReactNode; dark?: boolean }) {
  return (
    <InView className="max-w-[760px]">
      <p className="h-eyebrow h-reveal">{eyebrow}</p>
      <h2 className={`h-display h-reveal h-reveal-2 mt-4 text-[2.5rem] sm:text-[3.2rem] lg:text-[4rem] ${dark ? "text-white" : ""}`}>{title}</h2>
      {lead ? <p className="h-lead h-reveal h-reveal-3 mt-5 max-w-[60ch]">{lead}</p> : null}
    </InView>
  );
}

const pickerDays = (story: LandingStory, count: number): PickerDay[] =>
  story.days.slice(0, count).map((d) => ({ date: d.date, label: d.label, weekday: d.weekday, day: d.day }));

/* ------------------------------------------------------------------------------------------------- */

export function Hero({ story }: { story: LandingStory }) {
  return (
    <header id="top" className="h-hero flex flex-col">
      <div className="h-paint h-drift">
        <Image src="/tmrw/scenes/platform-empty.webp" alt="A quiet country railway platform with a street lamp, fields and summer clouds beyond" fill priority sizes="100vw" />
      </div>
      <span aria-hidden className="h-lamp" />
      <div aria-hidden className="h-hero-shade" />

      <div className="relative z-[1] mx-auto flex w-full max-w-[1200px] flex-1 flex-col items-center justify-center gap-5 px-4 pt-24 pb-24 sm:px-6">
        <div className="h-hero-card h-glass w-full max-w-[600px] px-6 pt-9 pb-7 text-center sm:px-10 sm:pt-11">
          <p className="h-wordmark text-[64px] sm:text-[84px]" aria-hidden>
            <span className="text-[var(--h-navy)]">tm</span>
            <span className="text-[var(--h-sky)]">rw</span>
          </p>
          <h1 className="h-display mt-4 text-[1.9rem] sm:text-[2.5rem]">
            <span className="sr-only">tmrw: </span>See the <span className="marker">short day</span> before it arrives.
          </h1>
          <p className="mx-auto mt-4 max-w-[46ch] text-[16.5px] leading-[1.6] text-[var(--h-strong)]">
            A small shop&apos;s month, on one page, inside PayPal. tmrw spots the day two big payments land together, a week early, and helps
            fix it. Money only moves when you tap.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/demo" className="h-btn h-btn-primary">
              Try it now
            </Link>
            <a href="#problem" className="h-btn h-btn-ghost">
              See the problem
            </a>
          </div>
        </div>

        <div className="h-forecast-pill w-full max-w-[600px] px-5 py-4 text-white">
          <p className="flex flex-wrap items-center justify-between gap-2 text-[12.5px] font-semibold text-white/65">
            <span>
              {SHOP} - forecast for today, {story.todayLabel}
            </span>
            <span className="rounded-full bg-white/12 px-2 py-0.5">Simulated shop</span>
          </p>
          <p className="mt-2 flex items-start gap-2.5 text-[16px] leading-6 font-medium">
            <span aria-hidden className={`h-dot mt-[7px] h-dot-${story.headline.tone === "short" ? "short" : story.headline.tone === "tight" ? "tight" : "covered"}`} />
            <span>{story.headline.text}</span>
          </p>
        </div>
      </div>

      <a href="#problem" className="h-scroll-hint relative z-[1] mx-auto mb-7 flex flex-col items-center gap-1 text-[14px] font-medium text-white">
        Scroll to continue
        <svg aria-hidden width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </a>
    </header>
  );
}

/* ------------------------------------------------------------------------------------------------- */

const PLACES: [string, string][] = [
  ["The PayPal app", "Sales trickle in, one by one."],
  ["Auto-debits", "Set up once, then forgotten."],
  ["WhatsApp", "Suppliers and staff asking to be paid."],
  ["A paper calendar", "Rent, bean orders, staff pay."],
  ["The owner's head", "Everything else."],
];

export function Problem({ story }: { story: LandingStory }) {
  const clash = story.clash;
  const shortIndex = story.shortIndex ?? 0;
  return (
    <section id="problem" aria-label="The problem" className="h-sec h-night relative overflow-hidden">
      <div aria-hidden className="h-night-paint">
        <Image src="/tmrw/scenes/platform-empty-night.webp" alt="" fill sizes="100vw" className="object-cover" />
      </div>
      <div className="h-sec-in relative mx-auto w-full max-w-[1200px] px-4 pt-28 pb-20 sm:px-6 lg:px-10 lg:pt-36 lg:pb-28">
        <Heading
          dark
          eyebrow="The problem"
          title="A shop's money is scattered across five places."
          lead="PayPal already holds most of it. But nobody puts it on one page, so the owner finds out on the day."
        />

        <InView>
          <ol className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {PLACES.map(([place, line], i) => (
              <li key={place} className={`h-place h-reveal h-reveal-${Math.min(5, i + 1)} p-5`}>
                <p className="h-place-n text-[15px]">0{i + 1}</p>
                <p className="mt-3 text-[17px] font-semibold">{place}</p>
                <p className="mt-1 text-[15px] leading-6 text-white/72">{line}</p>
              </li>
            ))}
          </ol>
        </InView>

        {clash && story.shortIndex !== null ? (
          <ShortDayBoard
            days={story.days.slice(0, 14).map((d, i) => ({ date: d.date, label: i === 0 ? "Today" : `${d.weekday} ${d.day}`, closingCents: d.closingCents, state: d.state, shortByCents: d.shortByCents }))}
            shortIndex={shortIndex}
            shortWeekday={weekdayLong(story.days[shortIndex]!.date)}
            headline={story.headline.text}
          >
            <InView>
              <div className="h-reveal">
                <h3 className="h-display text-[2rem] text-white sm:text-[2.5rem]">So two big payments land on the same day, and nobody notices until that day.</h3>
                <p className="h-lead mt-4 max-w-[52ch]">
                  At {SHOP}, a small café-bakery, that day is {clash.label}: {clash.reason}. tmrw saw it on {story.todayLabel}, a week early.
                </p>
              </div>
              <div className="h-card h-reveal h-reveal-2 mt-7 p-6 text-[var(--h-ink)] sm:p-7">
                <div className="flex items-center justify-between gap-3">
                  <p className="h-display text-[1.9rem]">{clash.label}</p>
                  <p className="flex items-center gap-2 rounded-full px-3 py-1.5 text-[15px] font-semibold text-[var(--h-out)] shadow-[inset_0_0_0_1.5px_var(--h-out-dot)]">
                    <DayWord state="short" shortByCents={clash.shortByCents} />
                  </p>
                </div>
                <ul className="mt-4">
                  {clash.dues.map((d) => (
                    <li key={d.name} className="h-row flex items-baseline justify-between gap-3 py-3 text-[16px]">
                      <span className="flex items-center gap-2">
                        <span aria-hidden className="h-dot h-dot-short" />
                        {d.name}
                        {d.autoDebit ? <span className="h-tag">Auto-debit</span> : null}
                      </span>
                      <span className="h-num font-semibold text-[var(--h-out)]">−{formatDollars(d.amountCents)}</span>
                    </li>
                  ))}
                </ul>
                <dl className="mt-2 space-y-2 rounded-[16px] bg-[var(--h-bg)] p-4 text-[15.5px]">
                  <div className="flex justify-between gap-3">
                    <dt>Due that day</dt>
                    <dd className="h-num font-semibold">{formatDollars(clash.dueCents)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>Free above the {formatDollars(story.minimumCents)} safety cushion</dt>
                    <dd className="h-num font-semibold">{formatDollars(clash.freeCents)}</dd>
                  </div>
                  <div className="flex justify-between gap-3 border-t border-[var(--h-line)] pt-2 text-[17px] font-semibold text-[var(--h-out)]">
                    <dt>Short</dt>
                    <dd className="h-num">{formatShortfall(clash.shortByCents)}</dd>
                  </div>
                </dl>
              </div>
            </InView>
          </ShortDayBoard>
        ) : null}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------------------------------- */

export function WhatItDoes({ story }: { story: LandingStory }) {
  return (
    <Section id="what" label="What it does">
      <Heading
        eyebrow="What it does"
        title="Spot. Plan. Steer."
        lead="tmrw reads the shop's PayPal history, lays the month out on one page, and guides the owner past the short days. It never moves money by itself."
      />

      <HowBlocks story={story} />
    </Section>
  );
}

/* ------------------------------------------------------------------------------------------------- */

const ALSO: [string, string][] = [
  ["Today panel", "What the owner checks each morning: safe to spend now, the biggest day ahead and how ready it is, who owes the shop, and goal progress."],
  ["Auto-debits, labelled", "Payments that leave by themselves are marked Auto-debit, so they're never a surprise."],
  ["Risky orders held", "A brand-new buyer with a big order, or repeated failed attempts, is held and not counted as money coming in."],
  ["Net money only", "A sale counts for what arrives after PayPal's fee, never the price on the order."],
];

export function Features({ story }: { story: LandingStory }) {
  const shortIndex = story.shortIndex;
  return (
    <Section id="features" label="Features">
      <Heading
        eyebrow="Features"
        title="Try the real thing, right here."
        lead={`Everything below runs tmrw's own forecast and safety rules on ${SHOP}, a sample shop with made-up sales.`}
      />

      {shortIndex !== null && story.fixes.length > 0 ? (
        <InView className="mt-12">
          <div className="h-reveal">
            <FixPicker
              days={pickerDays(story, 14)}
              base={{
                closings: story.days.slice(0, 14).map((d) => d.closingCents),
                states: story.days.slice(0, 14).map((d) => d.state),
                shortBy: story.days.slice(0, 14).map((d) => d.shortByCents),
              }}
              fixes={story.fixes}
              shortIndex={shortIndex}
              shortWeekday={weekdayLong(story.days[shortIndex]!.date)}
            />
          </div>
        </InView>
      ) : null}

      {story.recovery ? (
        <div className="mt-20 lg:mt-28">
          <InView className="max-w-[760px]">
            <p className="h-eyebrow h-reveal">Bring lost payments back</p>
            <h3 className="h-display h-reveal h-reveal-2 mt-3 text-[2.1rem] lg:text-[2.8rem]">It chases money the shop is owed.</h3>
            <p className="h-lead h-reveal h-reveal-3 mt-4 max-w-[58ch] text-[17px]">
              {story.recovery.customer}, a wedding planner, owes {formatDollars(story.recovery.grossCents)} for a {story.recovery.what}. tmrw drafts a
              reminder with a fresh PayPal link. Pay it for them and watch where the money goes.
            </p>
          </InView>
          <div className="mt-8">
            <ComesBack r={story.recovery} shop={SHOP} />
          </div>
        </div>
      ) : null}

      <div className="mt-20 lg:mt-28">
        <InView className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end lg:gap-14">
          <div>
            <p className="h-eyebrow h-reveal">The safety check</p>
            <h3 className="h-display h-reveal h-reveal-2 mt-3 text-[2.1rem] lg:text-[2.8rem]">Nothing moves without passing it.</h3>
          </div>
          <p className="h-lead h-reveal h-reveal-3 text-[17px]">
            AI suggests. Code decides. The owner taps. Every suggestion runs through 9 fixed rules, the Margin Guard, and prints a receipt saying why.
          </p>
        </InView>
        <p className="mt-6 text-[14px] text-[var(--h-muted)] md:hidden">Swipe to see all three.</p>
        <InView
          threshold={0.15}
          className="-mx-4 mt-6 flex snap-x snap-mandatory items-start gap-5 overflow-x-auto px-4 pt-4 pb-4 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0"
        >
          {story.receipts.map(({ receipt, caption }, i) => (
            <figure key={receipt.id} className="receipt-drop relative w-[300px] shrink-0 snap-center md:w-auto" style={{ animationDelay: `${300 + i * 650}ms` }}>
              <span className="ref-chip" style={{ animationDelay: `${1500 + i * 650}ms` }}>
                <span aria-hidden className={`ref-chip-card ${DECISION_FILL[receipt.decision.decision]}`} />
                {DECISION_WORD[receipt.decision.decision]}
              </span>
              <Receipt receipt={receipt} storeName={SHOP} compact />
              <figcaption className="receipt-caption mt-3 max-w-[36ch] text-[15px] leading-[1.45]" style={{ animationDelay: `${1800 + i * 650}ms` }}>
                {caption}
              </figcaption>
            </figure>
          ))}
        </InView>
      </div>

      <div className="mt-20 lg:mt-28">
        <InView>
          <h3 className="h-display h-reveal text-[1.8rem] lg:text-[2.2rem]">Also in tmrw</h3>
          <dl className="mt-6 grid gap-x-10 gap-y-6 sm:grid-cols-2">
            {ALSO.map(([title, line], i) => (
              <div key={title} className={`h-reveal h-reveal-${Math.min(5, i + 2)} border-t border-[var(--h-line)] pt-4`}>
                <dt className="text-[17px] font-semibold">{title}</dt>
                <dd className="mt-1 text-[15.5px] leading-6 text-[var(--h-strong)]">{line}</dd>
              </div>
            ))}
            <div className="h-reveal h-reveal-5 border-t border-[var(--h-line)] pt-4">
              <dt className="text-[17px] font-semibold">Your own numbers</dt>
              <dd className="mt-1 text-[15.5px] leading-6 text-[var(--h-strong)]">
                Type a balance, a normal day&apos;s sales and a few payments, and see your own short day.{" "}
                <Link href="/try" className="font-semibold text-[var(--h-blue)] hover:underline">
                  Find yours
                </Link>
              </dd>
            </div>
          </dl>
        </InView>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------------------------------------- */

const FLOW: { title: string; line: string; kind?: "ai" | "guard" }[] = [
  { title: "PayPal history", line: "Orders, captures, fees and signed webhooks." },
  { title: "The forecast", line: "30 days, worked out in plain code. No AI does the maths." },
  { title: "Pip suggests", line: "Gemini drafts reminders and explains. It never touches money or PayPal.", kind: "ai" },
  { title: "Margin Guard", line: "9 fixed rules decide: Approved, Needs your OK, or Blocked. A receipt every time.", kind: "guard" },
  { title: "The owner taps", line: "Nothing moves without it." },
  { title: "PayPal sandbox", line: "Only now does code call PayPal, with a repeat-proof request id." },
];

const TOOLS: [string, string][] = [
  ["PayPal Orders v2", "checkout links, capture"],
  ["PayPal Webhooks", "signed payment events"],
  ["PayPal Payouts", "paying a supplier"],
  ["PayPal Payments", "refunds"],
  ["Gemini, AI SDK", "drafts and explains only"],
  ["Margin Guard", "9 rules in plain code"],
  ["AG Grid, AG Charts", "tables and the forecast chart"],
  ["Next.js 16, React 19", "one app, pages and API"],
  ["Prisma 7, Supabase", "Postgres, one copy per visitor"],
  ["Render", "hosting"],
];

export function Tech() {
  return (
    <Section id="tech" label="Tech">
      <Heading eyebrow="Tech" title="AI suggests. Code decides. You tap." lead="Every action that touches money goes through the same six steps." />

      <InView>
        <ol className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {FLOW.map((s, i) => (
            <li key={s.title} className={`h-flow-step h-reveal h-reveal-${Math.min(5, i + 1)} p-5 ${s.kind === "ai" ? "h-flow-ai" : s.kind === "guard" ? "h-flow-guard" : ""}`}>
              <p className={`h-step-n ${s.kind === "guard" ? "!text-[#7cc4ff]" : ""}`}>{i + 1}</p>
              <p className="mt-2 text-[17px] font-semibold tracking-[-0.01em]">{s.title}</p>
              <p className={`mt-1.5 text-[14px] leading-[1.45] ${s.kind === "guard" ? "text-white/78" : "text-[var(--h-strong)]"}`}>{s.line}</p>
            </li>
          ))}
        </ol>
      </InView>

      <div className="mt-14 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        <InView>
          <h3 className="h-display h-reveal text-[1.8rem] lg:text-[2.2rem]">What we promise, in code</h3>
          <ul className="mt-5 space-y-4 text-[16px] leading-6">
            {[
              ["AI never calculates money.", "Every amount, date and forecast comes from tested code. Pip only finds patterns, explains and drafts."],
              ["AI never calls PayPal.", "Only the Guard's executor does, after an approval. A lint rule enforces it."],
              ["If AI fails, the app still works.", "The numbers are code, so they're always there."],
              ["Simulated means labelled.", "Sample history, loans and moved dates say Simulated. PayPal runs in sandbox only."],
            ].map(([a, b], i) => (
              <li key={a} className={`h-reveal h-reveal-${i + 2} border-t border-[var(--h-line)] pt-4`}>
                <strong className="font-semibold">{a}</strong> <span className="text-[var(--h-strong)]">{b}</span>
              </li>
            ))}
          </ul>
        </InView>

        <InView>
          <div className="tools-receipt receipt-paper on-paper mx-auto max-w-[460px] px-5 pt-8 pb-9 font-mono text-[12.5px] leading-[1.7] text-[var(--h-ink)] sm:px-7 sm:text-[13px]">
            <p className="text-center font-semibold tracking-[0.2em]">TMRW</p>
            <p className="text-center text-[var(--h-muted)]">Built with</p>
            <div aria-hidden className="my-3 border-t border-dashed border-black/40" />
            <ul>
              {TOOLS.map(([name, what], i) => (
                <li key={name} className="tools-line flex flex-wrap gap-x-2 sm:flex-nowrap" style={{ animationDelay: `${600 + i * 140}ms` }}>
                  <span className="shrink-0">{name}</span>
                  <span aria-hidden className="hidden min-w-4 flex-1 translate-y-[-4px] border-b border-dotted border-black/35 sm:block" />
                  <span className="w-full pl-4 text-[var(--h-muted)] sm:w-auto sm:shrink-0 sm:pl-0 sm:text-right">{what}</span>
                </li>
              ))}
            </ul>
            <div aria-hidden className="my-3 border-t border-dashed border-black/40" />
            <p className="text-center">PayPal sandbox only - MIT licence</p>
          </div>
        </InView>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------------------------------------- */

const NEXT: { what: string; line: string; status: "Next" | "Planned" }[] = [
  { what: "Pip edits the page", line: "Type an instruction or upload a bill (photo, PDF or WhatsApp screenshot). Changes show dashed; tap Keep or Discard.", status: "Next" },
  { what: "Requests inbox", line: "Staff and suppliers ask in the app, not on WhatsApp. Repeats are grouped, then code checks the money and timing.", status: "Next" },
  { what: "Learns from your edits", line: "Move the bean order to Monday once, and next month it's on Mondays.", status: "Planned" },
  { what: "Calendar, Ventures and Insights", line: "The three window seats on the train, fully designed.", status: "Planned" },
  { what: "A real PayPal loan offer", line: "As a last resort, with the fee shown up front.", status: "Planned" },
];

export function NextUp() {
  return (
    <Section id="next" label="Next up">
      <Heading eyebrow="Next up" title="Next departures." lead="What we're building after the hackathon, in the order it leaves the station." />
      <InView className="mt-12">
        <div className="h-board p-3 sm:p-5">
          <div className="h-board-head hidden grid-cols-[64px_minmax(0,0.9fr)_minmax(0,1.6fr)_110px] gap-4 px-3 pb-3 text-[12px] font-semibold tracking-[0.12em] uppercase sm:grid">
            <span>Plat.</span>
            <span>Destination</span>
            <span>Calling at</span>
            <span className="text-right">Status</span>
          </div>
          <ol>
            {NEXT.map((n, i) => (
              <li
                key={n.what}
                className="h-board-row grid grid-cols-[48px_minmax(0,1fr)] gap-x-3 gap-y-1 px-3 py-4 sm:grid-cols-[64px_minmax(0,0.9fr)_minmax(0,1.6fr)_110px] sm:items-center sm:gap-4"
                style={{ animationDelay: `${i * 140}ms` }}
              >
                <span className="h-board-flap text-[15px]">{i + 1}</span>
                <span className="text-[17px] font-semibold">{n.what}</span>
                <span className="col-start-2 text-[14.5px] leading-[1.45] text-white/70 sm:col-start-auto">{n.line}</span>
                <span className={`h-board-status col-start-2 sm:col-start-auto sm:text-right ${n.status === "Next" ? "h-board-next" : "h-board-later"}`}>{n.status === "Next" ? "Boarding" : "Planned"}</span>
              </li>
            ))}
          </ol>
        </div>
      </InView>
    </Section>
  );
}

/* ------------------------------------------------------------------------------------------------- */

const LOOK: [string, string][] = [
  ["lib/guard", "The Margin Guard: 9 rules as pure functions, every one unit-tested."],
  ["lib/forecast", "The 30-day forecast, regular-payment detection and the fixes."],
  ["lib/paypal/client.ts", "Every PayPal call, in one file. Sandbox only."],
  ["lib/ai/model.ts", "The only place AI is set up."],
];

export function GitHub() {
  return (
    <Section id="github" label="GitHub">
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        <Heading eyebrow="GitHub" title="Open source. Read every rule." lead="The whole app is public under the MIT licence. Start with the four places that matter most." />
        <InView>
          <div className="h-repo h-card h-reveal p-6 sm:p-7">
            <p className="text-[13px] font-semibold text-white/60">Public repository</p>
            <p className="h-code mt-2 text-[20px] break-all text-white">{REPO_NAME}</p>
            <a href={REPO_URL} className="h-btn h-btn-primary mt-6 w-full sm:w-auto" rel="noopener">
              Open on GitHub
            </a>
          </div>
          <ul className="mt-5">
            {LOOK.map(([path, line], i) => (
              <li key={path} className={`h-row h-reveal h-reveal-${i + 2} py-3.5`}>
                <a href={`${REPO_URL}/tree/main/${path}`} className="h-code font-semibold text-[var(--h-blue)] hover:underline" rel="noopener">
                  {path}
                </a>
                <p className="mt-0.5 text-[15px] leading-6 text-[var(--h-strong)]">{line}</p>
              </li>
            ))}
          </ul>
        </InView>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------------------------------------- */

export function TryNow() {
  return (
    <section id="try" aria-label="Try it now" className="h-sec h-train flex flex-col">
      <div className="h-paint">
        <Image src="/tmrw/scenes/train-open.webp" alt="A cream and green local train stopped at the platform, doors open" fill sizes="100vw" />
      </div>
      <div aria-hidden className="h-train-shade" />
      <div className="h-sec-in relative z-[1] mx-auto flex w-full max-w-[1200px] flex-1 items-center justify-center px-4 pt-28 pb-16 sm:px-6">
        <InView className="w-full max-w-[600px]">
          <div className="h-glass h-reveal rounded-[28px] px-6 pt-9 pb-8 text-center sm:px-10">
            <p className="h-eyebrow">Try it now</p>
            <h2 className="h-display mt-3 text-[2.4rem] sm:text-[3rem]">Your train is here.</h2>
            <p className="mx-auto mt-4 max-w-[44ch] text-[16.5px] leading-[1.6] text-[var(--h-strong)]">
              Walk through {SHOP}&apos;s short Thursday in six steps, and pay a real PayPal sandbox checkout yourself. It&apos;s a sample shop
              with made-up sales, so nothing real moves.
            </p>
            <div className="finale-keys mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/demo" className="h-btn h-btn-primary">
                Start the demo
              </Link>
              <Link href="/try" className="h-btn h-btn-ghost">
                Try your own numbers
              </Link>
            </div>
            <p className="mt-5 text-[14px] text-[var(--h-muted)]">
              Want a peek at what&apos;s next? The new laptop app is still being built:{" "}
              <Link href="/app" className="font-semibold text-[var(--h-blue)] hover:underline">
                step onto the train
              </Link>
              .
            </p>
          </div>
        </InView>
      </div>
      <footer className="relative z-[1] mx-auto flex w-full max-w-[1200px] flex-wrap items-baseline justify-between gap-3 px-4 pb-6 text-[13.5px] text-white/80 sm:px-6 lg:px-10">
        <span className="h-wordmark text-[22px] text-white">tmrw</span>
        <span>Built for the PayPal AI Hackathon 2026. AI never calculates money; code does. Illustrations: Open Peeps by Pablo Stanley (CC0).</span>
      </footer>
    </section>
  );
}
