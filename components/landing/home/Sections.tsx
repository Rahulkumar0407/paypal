import Image from "next/image";
import Link from "next/link";
import type { LandingStory } from "@/lib/landing";
import { DAY_FILL } from "@/components/ui/meaning";
import { weekdayLong } from "@/lib/shared/dates";
import { formatDollars, formatShortfall } from "@/lib/shared/money";
import { HeroAnimatedIllustration } from "../HeroAnimatedIllustration";
import { InView } from "../InView";
import { ComesBack } from "./ComesBack";
import { DayLens } from "./DayLens";
import { DayWord, FixPicker, type PickerDay } from "./FixPicker";
import { GuardPicker } from "./GuardPicker";
import { HowBlocks } from "./HowBlocks";
import { DealtDays, ProblemScene } from "./ShortDayBoard";

/** The public repo (MIT). */
export const REPO_URL = "https://github.com/Rahulkumar0407/paypal";
const REPO_NAME = REPO_URL.replace("https://github.com/", "");
const SHOP = "Dunder Mifflin & Co.";
const TWO_WEEKS = 14;

/** A section of the page: its id is the tab's target; `.h-sec-in` is what dims when another section is lit. */
function Section({ id, label, ivory = false, children }: { id: string; label: string; ivory?: boolean; children: React.ReactNode }) {
  return (
    <section id={id} aria-label={label} className={`h-sec ${ivory ? "h-ivory" : ""}`}>
      <div className="h-sec-in mx-auto w-full max-w-[1280px] px-4 pt-20 pb-20 sm:px-6 lg:px-10 lg:pt-28 lg:pb-28">{children}</div>
    </section>
  );
}

function Heading({ eyebrow, title, lead, center = false }: { eyebrow: string; title: React.ReactNode; lead?: React.ReactNode; center?: boolean }) {
  return (
    <InView className={`max-w-[780px] ${center ? "mx-auto text-center" : ""}`}>
      <p className="h-eyebrow h-reveal">{eyebrow}</p>
      <h2 className="h-display h-reveal h-reveal-2 mt-4 text-[2.5rem] sm:text-[3.2rem] lg:text-[3.8rem]">{title}</h2>
      {lead ? <p className="h-lead h-reveal h-reveal-3 mt-5">{lead}</p> : null}
    </InView>
  );
}

function SubHeading({ eyebrow, title, lead }: { eyebrow: string; title: string; lead: React.ReactNode }) {
  return (
    <InView className="max-w-[760px]">
      <p className="h-eyebrow h-reveal">{eyebrow}</p>
      <h3 className="h-display h-reveal h-reveal-2 mt-3 text-[2.1rem] lg:text-[2.8rem]">{title}</h3>
      <p className="h-lead h-reveal h-reveal-3 mt-4 text-[17px]">{lead}</p>
    </InView>
  );
}

const pickerDays = (story: LandingStory): PickerDay[] => story.days.slice(0, TWO_WEEKS).map((d) => ({ date: d.date, label: d.label, weekday: d.weekday, day: d.day }));

/* ------------------------------------------------------------------------------------------------- */

/** The hero's opening, in ms: the headline lands word by word, then the next two weeks tick in and Thursday thumps red. */
const T = { word: 150, wordStep: 90, lead: 900, buttons: 1050, ticks: 1300, tickStep: 55, verdict: 2500, spotted: 2750 };
const delay = (ms: number) => ({ ["--d" as string]: `${ms}ms` }) as React.CSSProperties;

/** One word of the headline, rising in at its turn. */
function Word({ children, i }: { children: string; i: number }) {
  return (
    <span className="h-word" style={delay(T.word + i * T.wordStep)}>
      {children}
    </span>
  );
}

export function Hero({ story }: { story: LandingStory }) {
  const short = story.shortIndex === null ? null : story.days[story.shortIndex]!;
  const twoWeeks = story.days.slice(0, TWO_WEEKS);
  const shortAt = twoWeeks.findIndex((d) => d.state === "short");
  return (
    <section id="top" aria-label="tmrw" className="h-hero h-ivory overflow-hidden">
      <div className="mx-auto grid w-full max-w-[1280px] items-center gap-6 px-4 pt-10 pb-14 sm:px-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-4 lg:px-10 lg:py-10">
        <div className="relative z-[2] max-w-[520px]">
          <p className="h-eyebrow h-in" style={delay(60)}>
            For small shops that sell with PayPal
          </p>
          <h1 className="h-display mt-4 text-[2.9rem] sm:text-[3.6rem] lg:text-[4.2rem]" aria-label="tmrw: See the short day before it arrives.">
            <Word i={0}>See</Word> <Word i={1}>the</Word>{" "}
            <span className="h-marker">
              <Word i={2}>short</Word> <Word i={3}>day</Word>
            </span>{" "}
            <Word i={4}>before</Word> <Word i={5}>it</Word> <Word i={6}>arrives.</Word>
          </h1>
          <p className="h-lead h-in mt-5 max-w-[46ch]" style={delay(T.lead)}>
            Your shop&apos;s month on one page, inside PayPal. Spot the short day a week early, and fix it in a tap.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/demo" className="h-btn h-btn-primary h-pop" style={delay(T.buttons)}>
              Try the demo <span aria-hidden>→</span>
            </Link>
            <a href="#problem" className="h-btn h-btn-ghost h-pop" style={delay(T.buttons + 110)}>
              See how it works
            </a>
          </div>

          {/* The next two weeks tick in, one day at a time; the short day lands last, in red. */}
          <div className="mt-9">
            <div aria-hidden className="flex max-w-[380px] items-end gap-[3px]">
              {twoWeeks.map((d, i) => (
                <span
                  key={d.date}
                  className={`h-tick ${DAY_FILL[d.state]} ${i === shortAt ? "h-tick-short" : ""}`}
                  style={delay(T.ticks + (i === shortAt ? twoWeeks.length : i) * T.tickStep)}
                />
              ))}
            </div>
            <p className="mt-3 text-[14.5px] leading-6 text-[var(--h-strong)]">
              <strong className="h-verdict inline-block font-extrabold text-[var(--h-ink)]" style={delay(T.verdict)}>
                {short ? `${short.label}: ${formatShortfall(short.shortByCents)} short.` : story.headline.text}
              </strong>{" "}
              <span className="h-in inline-block text-[var(--h-muted)]" style={delay(T.spotted)}>
                Spotted on {story.todayLabel} at {SHOP}, a sample shop.
              </span>
            </p>
          </div>
        </div>
        <div className="h-art h-hero-art relative shadow-[0_0_0_1px_#ece5d6,0_30px_60px_-30px_rgb(0_20_53_/_0.35)] lg:-mr-4">
          <HeroAnimatedIllustration firstShortDay={short ? { label: short.label, flap: short.flap, shortByCents: short.shortByCents } : null} href="#problem" calendarEffects={false} />
        </div>
      </div>
    </section>
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
  const shortIndex = story.shortIndex;
  const bills = clash
    ? [...clash.dues].sort((a, b) => a.amountCents - b.amountCents).map((d) => ({ kind: d.name === "Rent" ? "Shop rent" : "Coffee beans", name: d.name, amountCents: d.amountCents }))
    : [];
  return (
    <Section id="problem" label="The problem">
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-14">
        <div className="order-2 lg:order-1">{clash ? <ProblemScene bills={bills} dueLabel={clash.label} /> : null}</div>
        <div className="order-1 lg:order-2">
          <Heading
            eyebrow="The problem"
            title="Bills don't wait."
            lead="A shop's money lives in five places. So two big bills can land on one day, and nobody sees it coming."
          />
        </div>
      </div>

      <div className="mt-14 grid items-start gap-8 lg:mt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
        <InView>
          <p className="h-eyebrow h-reveal">Where the month lives today</p>
          <ol className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {PLACES.map(([place, line], i) => (
              <li key={place} className={`h-place h-reveal h-reveal-${Math.min(5, i + 1)} flex items-start gap-3 p-4 ${i === PLACES.length - 1 ? "sm:col-span-2" : ""}`}>
                <span className="h-place-n text-[15px]">0{i + 1}</span>
                <span>
                  <span className="block text-[16px] font-extrabold">{place}</span>
                  <span className="block text-[14.5px] leading-6 text-[var(--h-muted)]">{line}</span>
                </span>
              </li>
            ))}
          </ol>
        </InView>

        {clash ? (
          <InView>
            <div className="h-card h-reveal p-6 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <p className="h-display text-[1.9rem]">{clash.label}</p>
                <p className="flex items-center gap-2 rounded-full px-3 py-1.5 text-[15px] font-bold text-[var(--h-out)] shadow-[inset_0_0_0_1.5px_var(--h-out-dot)]">
                  <DayWord state="short" shortByCents={clash.shortByCents} />
                </p>
              </div>
              <ul className="mt-3">
                {clash.dues.map((d) => (
                  <li key={d.name} className="h-row flex items-baseline justify-between gap-3 py-3 text-[16px]">
                    <span className="flex items-center gap-2 font-semibold">
                      <span aria-hidden className="h-dot h-dot-short" />
                      {d.name}
                    </span>
                    <span className="h-num font-bold text-[var(--h-out)]">−{formatDollars(d.amountCents)}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-2 space-y-2 rounded-[16px] bg-[#f8fafc] p-4 text-[15.5px]">
                <div className="flex justify-between gap-3">
                  <dt>Due that day</dt>
                  <dd className="h-num font-bold">{formatDollars(clash.dueCents)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Free above the {formatDollars(story.minimumCents)} safety cushion</dt>
                  <dd className="h-num font-bold">{formatDollars(clash.freeCents)}</dd>
                </div>
                <div className="flex justify-between gap-3 border-t border-[var(--h-line)] pt-2 text-[17px] font-extrabold text-[var(--h-out)]">
                  <dt>Short</dt>
                  <dd className="h-num">{formatShortfall(clash.shortByCents)}</dd>
                </div>
              </dl>
            </div>
          </InView>
        ) : null}
      </div>

      {shortIndex !== null ? (
        <div className="mt-14 lg:mt-20">
          <DealtDays
            days={story.days.slice(0, TWO_WEEKS).map((d, i) => ({ date: d.date, label: i === 0 ? "Today" : `${d.weekday} ${d.day}`, closingCents: d.closingCents, state: d.state, shortByCents: d.shortByCents }))}
            shortIndex={shortIndex}
            headline={story.headline.text}
          />
        </div>
      ) : null}
    </Section>
  );
}

/* ------------------------------------------------------------------------------------------------- */

export function WhatItDoes({ story }: { story: LandingStory }) {
  return (
    <Section id="what" label="What it does" ivory>
      <Heading
        eyebrow="What it does"
        title="Spot. Plan. Steer."
        lead="It reads your PayPal history and puts the month on one page. It never moves money by itself."
      />
      <HowBlocks story={story} />

      <div className="mt-20 lg:mt-28">
        <Heading center eyebrow="The next two weeks" title="See it coming." lead="Tap any day to see what comes in and what goes out." />
        <InView className="mt-10">
          <div className="h-reveal">
            <DayLens days={story.days.slice(0, TWO_WEEKS)} start={story.shortIndex ?? 0} minimumCents={story.minimumCents} />
          </div>
        </InView>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------------------------------------- */

const ALSO: [string, string][] = [
  ["Today panel", "Safe to spend, the biggest day ahead, who owes you."],
  ["Auto-debits, labelled", "No surprise withdrawals."],
  ["Risky orders held", "Not counted as money until they're safe."],
  ["Net money only", "Counts what arrives after PayPal's fee."],
];

export function Features({ story }: { story: LandingStory }) {
  const shortIndex = story.shortIndex;
  const days = story.days.slice(0, TWO_WEEKS);
  return (
    <Section id="features" label="Features">
      <Heading eyebrow="Features" title="Try the real thing, right here." lead="The real forecast and safety rules, on a sample shop." />

      {shortIndex !== null && story.fixes.length > 0 ? (
        <div className="mt-14 lg:mt-20">
          <SubHeading
            eyebrow="Your turn"
            title={`Can you save ${weekdayLong(days[shortIndex]!.date)}?`}
            lead={`${days[shortIndex]!.label} is ${formatShortfall(days[shortIndex]!.shortByCents)} short. Pick a fix and watch what happens.`}
          />
          <div className="mt-8">
            <FixPicker
              days={pickerDays(story)}
              base={{ closings: days.map((d) => d.closingCents), states: days.map((d) => d.state), shortBy: days.map((d) => d.shortByCents) }}
              fixes={story.fixes}
              shortIndex={shortIndex}
              shortWeekday={weekdayLong(days[shortIndex]!.date)}
            />
          </div>
        </div>
      ) : null}

      {story.recovery ? (
        <div className="mt-20 lg:mt-28">
          <SubHeading
            eyebrow="Bring lost payments back"
            title="It chases money the shop is owed."
            lead={`${story.recovery.customer} owes ${formatDollars(story.recovery.grossCents)} for a wedding cake. Pay their reminder and watch the money land.`}
          />
          <div className="mt-8">
            <ComesBack r={story.recovery} shop={SHOP} />
          </div>
        </div>
      ) : null}

      <div className="mt-20 lg:mt-28">
        <SubHeading
          eyebrow="The safety check"
          title="Nothing moves without passing it."
          lead="Every suggestion passes 9 fixed rules and prints a receipt. Tap a real decision."
        />
        <div className="mt-8">
          <GuardPicker receipts={story.receipts} shop={SHOP} />
        </div>
      </div>

      <div className="mt-20 lg:mt-28">
        <InView>
          <h3 className="h-display h-reveal text-[1.8rem] lg:text-[2.2rem]">Also in tmrw</h3>
          <dl className="mt-6 grid gap-x-10 gap-y-6 sm:grid-cols-2">
            {ALSO.map(([title, line], i) => (
              <div key={title} className={`h-reveal h-reveal-${Math.min(5, i + 2)} border-t border-[var(--h-line)] pt-4`}>
                <dt className="text-[17px] font-extrabold">{title}</dt>
                <dd className="mt-1 text-[15.5px] leading-6 text-[var(--h-muted)]">{line}</dd>
              </div>
            ))}
            <div className="h-reveal h-reveal-5 border-t border-[var(--h-line)] pt-4">
              <dt className="text-[17px] font-extrabold">Your own numbers</dt>
              <dd className="mt-1 text-[15.5px] leading-6 text-[var(--h-muted)]">
                See your own short day in a minute.{" "}
                <Link href="/try" className="font-bold text-[var(--h-blue)] hover:underline">
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
  { title: "PayPal history", line: "Orders, fees, webhooks." },
  { title: "The forecast", line: "30 days in plain code. No AI maths." },
  { title: "Pip suggests", line: "Gemini drafts and explains.", kind: "ai" },
  { title: "Margin Guard", line: "9 rules decide. A receipt every time.", kind: "guard" },
  { title: "You tap", line: "Nothing moves without you." },
  { title: "PayPal sandbox", line: "Only then does code call PayPal." },
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

const PROMISES: [string, string][] = [
  ["AI never calculates money.", "Every number comes from tested code."],
  ["AI never calls PayPal.", "Only the Guard's executor does."],
  ["If AI fails, the app still works.", "The numbers don't need it."],
  ["Simulated means labelled.", "And PayPal runs in sandbox only."],
];

export function Tech() {
  return (
    <Section id="tech" label="Tech" ivory>
      <Heading eyebrow="Tech" title="AI suggests. Code decides. You tap." lead="Every money move, the same six steps." />

      <InView>
        <ol className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {FLOW.map((s, i) => (
            <li key={s.title} className={`h-flow-step h-reveal h-reveal-${Math.min(5, i + 1)} p-5 ${s.kind === "ai" ? "h-flow-ai" : s.kind === "guard" ? "h-flow-guard" : ""}`}>
              <p className={`h-step-n ${s.kind === "guard" ? "!text-[#7cc4ff]" : ""}`}>{i + 1}</p>
              <p className="mt-2 text-[17px] font-extrabold tracking-[-0.01em]">{s.title}</p>
              <p className={`mt-1.5 text-[14px] leading-[1.45] ${s.kind === "guard" ? "text-white/78" : "text-[var(--h-muted)]"}`}>{s.line}</p>
            </li>
          ))}
        </ol>
      </InView>

      <div className="mt-14 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        <InView>
          <h3 className="h-display h-reveal text-[1.8rem] lg:text-[2.2rem]">What we promise, in code</h3>
          <ul className="mt-5 space-y-4 text-[16px] leading-6">
            {PROMISES.map(([a, b], i) => (
              <li key={a} className={`h-reveal h-reveal-${i + 2} border-t border-[#e5dfd0] pt-4`}>
                <strong className="font-extrabold">{a}</strong> <span className="text-[var(--h-muted)]">{b}</span>
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
  { what: "Pip edits the page", line: "Snap a bill; tap Keep or Discard.", status: "Next" },
  { what: "Requests inbox", line: "Staff and suppliers ask here, not on WhatsApp.", status: "Next" },
  { what: "Learns from your edits", line: "Move it once; it stays moved.", status: "Planned" },
  { what: "Calendar, Ventures and Insights", line: "The new laptop app's windows.", status: "Planned" },
  { what: "A real PayPal loan offer", line: "A last resort, fee up front.", status: "Planned" },
];

export function NextUp() {
  return (
    <Section id="next" label="Next up">
      <Heading eyebrow="Next up" title="What's next for tmrw." />
      <InView className="mt-12">
        <div className="h-board p-3 sm:p-5">
          <div className="h-board-head hidden grid-cols-[64px_minmax(0,0.9fr)_minmax(0,1.6fr)_110px] gap-4 px-3 pb-3 text-[12px] font-bold tracking-[0.12em] uppercase sm:grid">
            <span>No.</span>
            <span>What</span>
            <span>What it means</span>
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
                <span className="text-[17px] font-bold">{n.what}</span>
                <span className="col-start-2 text-[14.5px] leading-[1.45] text-white/70 sm:col-start-auto">{n.line}</span>
                <span className={`h-board-status col-start-2 sm:col-start-auto sm:text-right ${n.status === "Next" ? "h-board-next" : "h-board-later"}`}>{n.status === "Next" ? "Up next" : "Planned"}</span>
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
  ["lib/guard", "The 9 rules, all unit-tested."],
  ["lib/forecast", "The 30-day forecast."],
  ["lib/paypal/client.ts", "Every PayPal call, in one file."],
  ["lib/ai/model.ts", "The only place AI is set up."],
];

export function GitHub() {
  return (
    <Section id="github" label="GitHub" ivory>
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        <Heading eyebrow="GitHub" title="Open source. Read every rule." lead="MIT licence. Start with these four." />
        <InView>
          <div className="h-reveal rounded-[24px] bg-[var(--h-ink)] p-6 text-white shadow-[0_24px_50px_-28px_rgb(0_20_53_/_0.7)] sm:p-7">
            <p className="text-[13px] font-bold text-white/60">Public repository</p>
            <p className="h-code mt-2 text-[20px] break-all">{REPO_NAME}</p>
            <a href={REPO_URL} className="h-btn h-btn-primary mt-6 w-full sm:w-auto" rel="noopener">
              Open on GitHub
            </a>
          </div>
          <ul className="mt-5">
            {LOOK.map(([path, line], i) => (
              <li key={path} className={`h-reveal h-reveal-${i + 2} border-t border-[#e5dfd0] py-3.5 first:border-t-0`}>
                <a href={`${REPO_URL}/tree/main/${path}`} className="h-code font-bold text-[var(--h-blue)] hover:underline" rel="noopener">
                  {path}
                </a>
                <p className="mt-0.5 text-[15px] leading-6 text-[var(--h-muted)]">{line}</p>
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
    <Section id="try" label="Try it now">
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
        <InView>
          <p className="h-eyebrow h-reveal">Try it now</p>
          <h2 className="h-display h-reveal h-reveal-2 mt-4 text-[2.6rem] sm:text-[3.4rem] lg:text-[4rem]">Make Thursday a calm day.</h2>
          <p className="h-lead h-reveal h-reveal-3 mt-5 max-w-[46ch]">
            Six steps, one real PayPal sandbox checkout. Nothing real moves.
          </p>
          <div className="finale-keys mt-8 flex flex-wrap gap-4">
            <Link href="/demo" className="h-btn h-btn-primary">
              Start the demo <span aria-hidden>→</span>
            </Link>
            <Link href="/try" className="h-btn h-btn-ghost">
              Try your own numbers
            </Link>
          </div>
          <p className="h-reveal h-reveal-5 mt-6 text-[14.5px] text-[var(--h-muted)]">
            Or{" "}
            <Link href="/app" className="font-bold text-[var(--h-blue)] hover:underline">
              peek at the new laptop app
            </Link>{" "}
            (still being built).
          </p>
        </InView>
        <InView>
          <div className="h-art h-reveal relative">
            <div className="h-parallax">
              <Image src="/landing/scene_relaxed_custom.jpg" alt="The shopkeeper leans back, relaxed, with every day on her calendar ticked" width={1376} height={768} unoptimized className="h-auto w-full" />
            </div>
          </div>
        </InView>
      </div>
      <footer className="mt-20 flex flex-wrap items-baseline justify-between gap-3 border-t border-[var(--h-line)] pt-6 text-[13.5px] text-[var(--h-muted)]">
        <span className="h-wordmark text-[22px]">
          <span className="tm">tm</span>
          <span className="rw">rw</span>
        </span>
        <span>Built for the PayPal AI Hackathon 2026. AI never calculates money; code does.</span>
      </footer>
    </Section>
  );
}
