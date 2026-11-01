import type { Metadata } from "next";
import Link from "next/link";
import { HeadlineSentence, MoneyStrip } from "@/components/ui";
import {
  Banknote,
  CurrencyPaper,
  EngravedVignette,
  ForecastRosette,
  FullNote,
  Halftone,
  LowTide,
  NightMap,
  Radar,
  Ridgelines,
  TickerTape,
} from "@/components/app/design/Backdrops";
import { buildHeadline } from "@/lib/forecast";
import { mockForecast } from "@/mocks/forecast";

export const metadata: Metadata = { title: "Background ideas" };

/**
 * Background explorations for the home screen. Only this page uses them; nothing else in the app changes
 * until the team picks one. Owner: Person 1.
 */
export default function BackgroundsPage() {
  const headline = buildHeadline(mockForecast);
  const content = (inverse: boolean, extra = "") => (
    <div className={`relative mx-auto max-w-[1160px] space-y-8 px-5 py-16 lg:px-12 lg:py-24 ${extra}`}>
      <HeadlineSentence headline={headline} as="p" inverse={inverse} />
      <MoneyStrip days={mockForecast.days} inverse={inverse} />
    </div>
  );

  return (
    <div className="min-h-dvh bg-paper">
      <header className="mx-auto max-w-[1160px] px-5 pt-12 pb-10 lg:px-12 lg:pt-20 lg:pb-14">
        <Link href="/design" className="text-[15px] text-ink-muted underline decoration-ink/25 underline-offset-4 hover:text-ink">
          Design system
        </Link>
        <h1 className="mt-6 max-w-[18ch] font-serif text-[2.75rem] leading-[1.04] tracking-[-0.02em] text-ink lg:text-[4.5rem]">
          Backdrops for the money forecast.
        </h1>
        <p className="mt-5 max-w-[60ch] text-[17px] leading-7 text-ink-muted">
          You picked the banknote, so it comes first, pushed four ways further. Then a new idea, then the earlier
          directions. Everything is live, behind the real headline and strip. Nothing else in the app changes until we
          pick one.
        </p>
      </header>

      <Group title="The banknote, pushed further" />

      <Option letter="A1" title="Banknote" why="The original: guilloché rosettes, a wave band and microprint, with the fortnight as the note's denomination.">
        <Banknote />
        {content(true)}
      </Option>

      <Option letter="A2" title="Full note" why="The whole screen engraved like a real banknote: a fine lathe tint, a rope border with a 14 in every corner, a rosette medallion, the Margin Guard seal, red serials, signatures, and the fine print: this forecast is good for fourteen days.">
        <FullNote />
        {content(true, "px-14 pt-24 pb-28 lg:px-28 lg:pt-[150px] lg:pb-[210px]")}
      </Option>

      <Option letter="A3" title="Forecast rosette" why="The security rosette is your forecast. It has fourteen lobes, one per day clockwise from today, each as full as that day's balance. Thursday's lobe caves in, engraved in red.">
        <ForecastRosette forecast={mockForecast} />
        {content(true)}
      </Option>

      <Option letter="A4" title="Currency paper" why="The light version: banknote paper with red and green fibres, a watermark 14, a windowed security thread and faint engraving. Calm enough to sit behind every screen.">
        <CurrencyPaper />
        {content(false)}
      </Option>

      <Option letter="A5" title="Engraved vignette" why="Every banknote has a little engraved scene. Ours is your next fourteen days: hills where the money is, and Thursday's valley flooding red below your minimum.">
        <EngravedVignette forecast={mockForecast} />
        {content(true)}
      </Option>

      <Group title="Something new" />

      <Option letter="G" title="Ticker tape" why="Market tickers scrolling past on a slant, quoting your days like stocks: green when they're covered, amber when tight, and Thursday in red, down, $90 short.">
        <TickerTape forecast={mockForecast} />
        {content(true)}
      </Option>

      <Group title="Earlier directions" />

      <Option letter="B" title="Ridgelines" why="The next two weeks as a mountain range, thirty ridges deep. Every ridge follows your balance, so Thursday's gap cuts one red valley straight through the range.">
        <Ridgelines forecast={mockForecast} />
        {content(true, "pb-[460px] lg:pb-[470px]")}
      </Option>

      <Option letter="C" title="Radar" why="A weather radar sweeping your fortnight. Each day is a blip spiralling out from today; the short day is the red echo that keeps pinging.">
        <Radar forecast={mockForecast} />
        {content(true)}
      </Option>

      <Option letter="D" title="Low tide" why="Your money as water, gently moving. The dashed red line is your minimum; on Thursday the tide goes out below it. Liquidity, literally.">
        <div aria-hidden className="absolute inset-0 bg-surface" />
        <LowTide forecast={mockForecast} />
        {content(false, "pb-[330px] lg:pb-[340px]")}
      </Option>

      <Option letter="E" title="Halftone" why="A newspaper print of the fortnight: bigger dots where there's more money, and the short day printed in red ink. Editorial and graphic.">
        <Halftone forecast={mockForecast} />
        {content(false, "pb-[380px] lg:pb-[440px]")}
      </Option>

      <Option letter="F" title="Night map" why="The weather map at night: calm high pressure over your best day, a tight red low closing in near Thursday's gap.">
        <NightMap forecast={mockForecast} />
        {content(true)}
      </Option>
    </div>
  );
}

function Group({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-[1160px] px-5 pt-16 lg:px-12 lg:pt-24">
      <p className="border-t border-ink pt-4 text-[15px] font-semibold text-ink">{title}</p>
    </div>
  );
}

function Option({ letter, title, why, children }: { letter: string; title: string; why: string; children: React.ReactNode }) {
  return (
    <section aria-label={`Option ${letter}: ${title}`}>
      <div className="mx-auto flex max-w-[1160px] flex-col gap-1 px-5 pt-10 pb-6 lg:flex-row lg:items-baseline lg:gap-10 lg:px-12">
        <h2 className="shrink-0 font-serif text-[2rem] leading-none text-ink lg:w-[300px]">
          <span className="text-ink-muted">{letter}.</span> {title}
        </h2>
        <p className="max-w-[62ch] text-[16px] leading-7 text-ink-muted">{why}</p>
      </div>
      <div className="@container relative overflow-hidden">{children}</div>
    </section>
  );
}
