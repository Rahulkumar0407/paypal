import type { LandingStory } from "@/lib/landing";
import { DAY_FILL } from "@/components/ui/meaning";
import { formatDollars } from "@/lib/shared/money";
import { CountUp } from "../CountUp";
import { InView } from "../InView";

const TICK_MS = 45;

/**
 * Spot, Plan, Steer as three big blocks. Each block's colour is its meaning (red for the short day, ink for the plain
 * month, green for the safe fix), and each acts out its step when it comes into view: the short day flips in, its gap
 * counts up and SHORT is stamped; the month's 30 days are worked out one by one; then 9 rules tick, the card turns
 * amber for Penny's OK, and turns white when she taps it.
 */
export function HowBlocks({ story }: { story: LandingStory }) {
  const short = story.shortIndex === null ? null : story.days[story.shortIndex]!;
  const states = story.days.map((d) => d.state);
  const shortAt = states.indexOf("short");
  const m = story.month;
  return (
    <InView threshold={0.25} className="how-row mt-12">
      <ol className="grid gap-5 lg:grid-cols-3">
        <li className="how-block how-red relative">
          <span className="how-num">1</span>
          <p className="mt-5 text-[13px] font-bold tracking-[0.14em] uppercase">Spot</p>
          <h3 className="h-display mt-2 text-[1.9rem] lg:text-[2.1rem]">It spots the short day, a week early.</h3>
          {short ? (
            <>
              <p className="how-flip h-display mt-auto pt-8 text-[3rem] lg:text-[3.3rem]">{short.label}</p>
              <p className="h-display text-[2.1rem]" aria-label={`${formatDollars(short.shortByCents)} short`}>
                <CountUp cents={short.shortByCents} kind="shortfall" delayMs={1100} /> short
              </p>
              <p className="mt-4 text-[18px] leading-7 font-bold">Because {story.clash?.reason ?? "two payments land together"}.</p>
              <span aria-hidden className="how-stamp">
                Short
              </span>
            </>
          ) : null}
        </li>

        <li className="how-block how-ink">
          <span className="how-num">2</span>
          <p className="mt-5 text-[13px] font-bold tracking-[0.14em] text-white/70 uppercase">Plan</p>
          <h3 className="h-display mt-2 text-[1.9rem] lg:text-[2.1rem]">It lays the month out on one page.</h3>
          <dl className="mt-6 space-y-2 text-[15.5px]">
            <div className="flex justify-between gap-3 border-b border-white/12 pb-2">
              <dt className="text-white/75">Must pay</dt>
              <dd className="tabular font-semibold">{formatDollars(m.mustPayCents)}</dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-white/12 pb-2">
              <dt className="text-white/75">Coming in</dt>
              <dd className="tabular font-semibold">about {formatDollars(m.comingInCents)}</dd>
            </div>
            {m.goal ? (
              <div className="flex justify-between gap-3 border-b border-white/12 pb-2">
                <dt className="text-white/75">Want to do</dt>
                <dd className="font-semibold">
                  {m.goal.title}, {formatDollars(m.goal.amountCents)}
                </dd>
              </div>
            ) : null}
            {m.focusLine ? (
              <div className="flex justify-between gap-3">
                <dt className="text-white/75">Focus</dt>
                <dd className="h-focus text-right">&ldquo;{m.focusLine}&rdquo;</dd>
              </div>
            ) : null}
          </dl>
          <div aria-hidden className="mt-auto flex items-end gap-[3px] pt-8">
            {states.map((s, i) => (
              <span key={i} className={`how-tick !h-[30px] ${DAY_FILL[s]} ${i === shortAt ? "how-tick-short" : ""}`} style={{ animationDelay: `${500 + (i === shortAt ? states.length : i) * TICK_MS}ms` }} />
            ))}
          </div>
          <p className="mt-2 text-[13px] text-white/65">{m.name}, day by day: covered, tight or short</p>
        </li>

        <li className="how-block how-green">
          <span className="how-num">3</span>
          <p className="mt-5 text-[13px] font-bold tracking-[0.14em] uppercase">Steer</p>
          <h3 className="h-display mt-2 text-[1.9rem] lg:text-[2.1rem]">It helps fix it, safely.</h3>
          <p className="mt-4 text-[16.5px] leading-7">Pip suggests. 9 rules check. Penny taps.</p>
          <div className="mt-auto pt-8">
            <ol aria-label="9 safety rules, all checked" className="flex gap-1.5">
              {Array.from({ length: 9 }, (_, i) => (
                <li key={i} className="rule-box" style={{ animationDelay: `${1300 + i * 110}ms` }}>
                  <span aria-hidden>✓</span>
                </li>
              ))}
            </ol>
            <div className="mt-4 flex items-center gap-3">
              <span aria-hidden className="h-steer-card" />
              <span className="relative block h-[30px] flex-1 text-[21px] font-semibold">
                <span className="h-steer-wait absolute inset-0">Needs Penny&apos;s OK</span>
                <span className="h-steer-ok absolute inset-0">Approved by Penny</span>
              </span>
            </div>
          </div>
        </li>
      </ol>
    </InView>
  );
}
