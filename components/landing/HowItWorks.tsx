import type { DayState } from "@/types";
import { DAY_FILL, DAY_WORD } from "@/components/ui/meaning";
import { formatShortfall } from "@/lib/shared/money";
import { CountUp } from "./CountUp";
import { InView } from "./InView";

const TICK_MS = 70;

/**
 * "How it works": the three things NeverShort does, as three big blocks. Each block's colour is its meaning (ink
 * for looking ahead, red for the short day, green for the fix), and each acts out its step when it comes into view:
 * the 14 days are worked out one by one, the short day's amount counts up and is stamped, then 9 rules tick and the
 * referee card turns over.
 */
export function HowItWorks({ shortLabel, shortByCents, why, states }: { shortLabel: string; shortByCents: number; why: string; states: DayState[] }) {
  const shortAt = states.indexOf("short");
  return (
    <section id="how" aria-labelledby="how-title" className="mx-auto w-full max-w-[1240px] px-5 py-20 lg:px-10 lg:py-28">
      <InView className="reveal">
        <h2 id="how-title" className="display text-[2.6rem] leading-[0.98] text-ink lg:text-[3.8rem]">
          How it works
        </h2>
      </InView>
      <InView threshold={0.3} className="how-row mt-10">
        <ol className="grid gap-5 lg:grid-cols-3">
          <li className="how-block how-ink">
            <span className="how-num">1</span>
            <h3 className="display mt-6 text-[2rem] leading-[1.02] lg:text-[2.3rem]">It looks two weeks ahead.</h3>
            <p className="mt-4 text-[17px] leading-7 text-white/85">
              From your PayPal sales and your bills, it works out how much money you&apos;ll have on each of the next 14
              days.
            </p>
            <div aria-hidden className="mt-auto flex items-end gap-1 pt-8">
              {states.map((s, i) => (
                <span
                  key={i}
                  className={`how-tick ${DAY_FILL[s]} ${i === shortAt ? "how-tick-short" : ""}`}
                  style={{ animationDelay: `${500 + (i === shortAt ? states.length : i) * TICK_MS}ms` }}
                />
              ))}
            </div>
            <p className="mt-2 text-[13px] text-white/60">
              {DAY_WORD.covered}, {DAY_WORD.tight.toLowerCase()} or {DAY_WORD.short.toLowerCase()}, day by day
            </p>
          </li>

          <li className="how-block how-red relative">
            <span className="how-num">2</span>
            <h3 className="display mt-6 text-[2rem] leading-[1.02] lg:text-[2.3rem]">It finds the short day.</h3>
            <p className="how-flip display mt-auto pt-8 text-[3.2rem] leading-[0.95] lg:text-[3.6rem]">{shortLabel}</p>
            <p className="display text-[2.2rem] leading-none" aria-label={`${formatShortfall(shortByCents)} short`}>
              <CountUp cents={shortByCents} kind="shortfall" delayMs={1100} /> short
            </p>
            <p className="mt-4 text-[19px] leading-7 font-bold">Because {why}.</p>
            <span aria-hidden className="how-stamp">
              Short
            </span>
          </li>

          <li className="how-block how-green">
            <span className="how-num">3</span>
            <h3 className="display mt-6 text-[2rem] leading-[1.02] lg:text-[2.3rem]">It helps you fix it, safely.</h3>
            <p className="mt-4 text-[17px] leading-7">
              It suggests fixes. Before any money moves, 9 safety rules check it. Big moves wait for your OK.
            </p>
            <div className="mt-auto pt-8">
              <ol aria-label="9 safety rules, all passed" className="flex gap-1.5">
                {Array.from({ length: 9 }, (_, i) => (
                  <li key={i} className="rule-box" style={{ animationDelay: `${1300 + i * 110}ms` }}>
                    <span aria-hidden>✓</span>
                  </li>
                ))}
              </ol>
              <div className="mt-4 flex items-center gap-3">
                <span aria-hidden className="how-card" />
                <span className="how-approved text-[22px] font-semibold">Approved</span>
              </div>
            </div>
          </li>
        </ol>
      </InView>
    </section>
  );
}
