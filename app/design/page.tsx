import type { Metadata } from "next";
import Link from "next/link";
import {
  BigAmount,
  Button,
  ButtonLink,
  Card,
  CardTitle,
  EmptyState,
  ErrorState,
  HeadlineSentence,
  LoadingState,
  Money,
  ReadyMeter,
  Receipt,
  RefereeCard,
  SimulatedTag,
} from "@/components/ui";
import { ScreenPreview, StampReplay, StripFixDemo } from "@/components/app/design/DesignDemos";
import { buildHeadline } from "@/lib/forecast";
import { buildMockForecast, mockForecast, mockForecastFixed } from "@/mocks/forecast";
import { mockReceiptGapLoanEscalated, mockReceiptReminderApproved, mockReceiptReminderBlocked } from "@/mocks/guard";

export const metadata: Metadata = { title: "Design system" };

const COLOURS = [
  { name: "Ink", token: "ink", hex: "#14201B", use: "All text. 16.8:1 on white.", swatch: "bg-ink" },
  { name: "Ink, muted", token: "ink-muted", hex: "#56605B", use: "Secondary text. 6.5:1 on white, 5.9:1 on surface.", swatch: "bg-ink-muted" },
  { name: "Brand", token: "brand", hex: "#0E3B2C", use: "Primary buttons, demo banner. White on it is 12.5:1.", swatch: "bg-brand" },
  { name: "Surface", token: "surface", hex: "#F3F5F2", use: "Cards and quiet backgrounds.", swatch: "bg-surface ring-1 ring-line ring-inset" },
  { name: "Line", token: "line", hex: "#DCE1DD", use: "Hairlines and dividers only.", swatch: "bg-line" },
  { name: "Green", token: "green", hex: "#1E9E5E", use: "Covered, approved, ready. A fill: ink on it is 4.9:1.", swatch: "bg-green" },
  { name: "Amber", token: "amber", hex: "#F2A93B", use: "Tight, escalated. A fill: ink on it is 8.4:1.", swatch: "bg-amber" },
  { name: "Red", token: "red", hex: "#E5484D", use: "Short, blocked. A fill: text on it must be 24px+ (ink is 4.3:1).", swatch: "bg-red" },
];

/** The design system, with fake data, for the team to judge the look before features are built. Owner: Person 1. */
export default function DesignPage() {
  const tightExample = buildHeadline(buildMockForecast({ extraIn: { "2026-11-05": 12_000 } }));

  return (
    <div className="min-h-dvh bg-paper">
      <header className="border-b border-line px-5 py-5 lg:px-12">
        <div className="mx-auto flex max-w-[1240px] items-baseline justify-between gap-4">
          <p className="font-serif text-[26px] leading-none text-ink">NeverShort design system</p>
          <Link href="/" className="text-[15px] text-ink underline decoration-ink/30 underline-offset-4">
            Back to the app
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] space-y-20 px-5 py-12 lg:px-12 lg:py-16">
        <section className="max-w-[60ch] space-y-4">
          <h1 className="font-serif text-[2.5rem] leading-[1.06] text-ink lg:text-[3.5rem]">Money weather for a small shop.</h1>
          <p className="text-[17px] leading-7 text-ink-muted">
            A calm, honest forecast the owner checks every morning. Four signature pieces carry the product; everything else stays
            quiet. All data on this page is fake, from mocks/.
          </p>
        </section>

        <Section title="The headline sentence" note="One plain sentence in Fraunces, built by code templates so the demo replays word for word. Pure ink: no coloured words.">
          <div className="space-y-10">
            <HeadlineSentence headline={buildHeadline(mockForecast)} as="p" />
            <HeadlineSentence headline={tightExample} as="p" />
            <HeadlineSentence headline={buildHeadline(mockForecastFixed)} as="p" />
          </div>
        </Section>

        <Section
          title="The 14-day money strip"
          note="Read like a weather row: the day, a coloured block with the closing balance, the condition. Green covered, amber tight, red short. When a gap is fixed, the tile turns green and the sentence updates. That's one of only two animations."
        >
          <StripFixDemo
            before={mockForecast}
            after={mockForecastFixed}
            headlineBefore={buildHeadline(mockForecast)}
            headlineAfter={buildHeadline(mockForecastFixed)}
          />
        </Section>

        <Section title="Referee cards" note="Every Guard decision holds up a small tilted card, followed by the word. The word is always there, so colour is never the only signal.">
          <div className="space-y-5">
            {(["sm", "md", "lg"] as const).map((size) => (
              <div key={size} className="flex flex-wrap items-center gap-x-8 gap-y-3">
                <RefereeCard decision="APPROVE" size={size} />
                <RefereeCard decision="ESCALATE" size={size} />
                <RefereeCard decision="BLOCK" size={size} />
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Receipts"
          note="Every decision prints as a thermal shop receipt: mono, dashed dividers, zig-zag edges, PASS, FAIL or N/A for each of the 8 rules. A BLOCKED stamp lands on a blocked receipt, the other animation."
        >
          <div className="grid justify-items-center gap-10 rounded-card bg-surface px-4 py-10 md:grid-cols-2 xl:grid-cols-3">
            <Receipt receipt={mockReceiptReminderApproved} />
            <Receipt receipt={mockReceiptGapLoanEscalated} />
            <StampReplay receipt={mockReceiptReminderBlocked} />
          </div>
        </Section>

        <Section title="Colours" note="White background, one ink, one brand green, one surface, and three meaning colours. Tailwind's default palette is switched off, so nothing else can creep in.">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {COLOURS.map((c) => (
              <li key={c.token}>
                <div className={`h-20 rounded-tile ${c.swatch}`} />
                <p className="mt-2 text-[15px] font-semibold text-ink">
                  {c.name} <span className="font-mono text-[13px] font-normal text-ink-muted">{c.hex}</span>
                </p>
                <p className="text-[14px] leading-5 text-ink-muted">{c.use}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Type" note="Fraunces for sentences and big amounts. Inter for the interface, with tabular figures for money. JetBrains Mono only on receipts.">
          <div className="space-y-8">
            <p className="font-serif text-[3.375rem] leading-[1.04] text-ink">Rent&apos;s covered.</p>
            <div className="space-y-2 text-ink">
              <p className="text-[20px] leading-7 font-semibold">Section heading, Inter 20 semibold</p>
              <p className="text-[17px] leading-6 font-semibold">Card heading, Inter 17 semibold</p>
              <p className="text-[16px] leading-6">Body, Inter 16. Short sentences, real amounts, real dates.</p>
              <p className="text-[14px] text-ink-muted">Supporting text, Inter 14, muted ink.</p>
            </div>
            <p className="font-mono text-[12.5px] text-ink">1 Already paid ............ FAIL</p>
          </div>
        </Section>

        <Section title="Money amounts" note="Whole dollars in sentences and tiles, with shortfalls rounded up so a gap is never understated. Exact cents on receipts and tables.">
          <div className="flex flex-wrap items-end gap-x-12 gap-y-6">
            <div>
              <BigAmount cents={159_000} />
              <p className="mt-2 text-[14px] text-ink-muted">Big amount, serif</p>
            </div>
            <div className="space-y-1 text-[16px] text-ink">
              <p>
                Whole: <Money cents={74_500} />
              </p>
              <p>
                Exact: <Money cents={7_200} mode="exact" />
              </p>
              <p>
                Shortfall of 89.20: <Money cents={8_920} mode="shortfall" />
              </p>
              <p>
                Negative: <Money cents={-19_000} />
              </p>
            </div>
          </div>
        </Section>

        <Section title="Buttons" note="One primary action per screen. 44px tall for thumbs. Sentence case, saying exactly what happens.">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Set aside $11 a day</Button>
            <Button variant="secondary">Not quite</Button>
            <ButtonLink href="/receipts" variant="quiet">
              Every receipt
            </ButtonLink>
            <Button disabled>Save answers</Button>
          </div>
        </Section>

        <Section title="Cards and small parts" note="One idea per card, no shadows. Simulated things carry a dashed tag.">
          <div className="grid gap-5 md:grid-cols-2">
            <Card>
              <CardTitle>Surface card</CardTitle>
              <p className="mt-1 text-[15px] text-ink-muted">The default. Sits on white.</p>
            </Card>
            <Card tone="outline">
              <div className="flex items-center gap-2">
                <CardTitle>Gap loan of $150</CardTitle>
                <SimulatedTag />
              </div>
              <div className="mt-4 flex items-center gap-3">
                <div className="w-32">
                  <ReadyMeter readyCents={21_000} amountCents={30_000} />
                </div>
                <p className="text-[14px] font-semibold text-ink">$210 ready, $90 short</p>
              </div>
            </Card>
          </div>
        </Section>

        <Section title="Empty, loading and error states" note="Every screen has all three, in the same voice: say what happened and what to do next.">
          <div className="grid gap-5 lg:grid-cols-3">
            <EmptyState title="Nothing is waiting for you." body="When the Guard escalates something, it waits here for your OK." action={{ label: "See receipts", href: "/receipts" }} />
            <LoadingState label="Working out your forecast." />
            <ErrorState title="Couldn't load your forecast." body="Your money hasn't moved. Check your connection and try again." retryHref="/design" />
          </div>
        </Section>

        <Section title="Screens" note="The real pages, with the module stubs' fake data, framed at phone and laptop widths.">
          <ScreenPreview />
        </Section>
      </main>
    </div>
  );
}

function Section({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <section className="space-y-6 border-t border-line pt-10">
      <div className="max-w-[64ch]">
        <h2 className="text-[22px] leading-7 font-semibold text-ink">{title}</h2>
        <p className="mt-1 text-[15px] leading-6 text-ink-muted">{note}</p>
      </div>
      {children}
    </section>
  );
}
