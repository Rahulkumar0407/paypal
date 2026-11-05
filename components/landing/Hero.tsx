"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { LandingStory } from "@/lib/landing";
import { dayOfMonth, weekdayShort } from "@/lib/shared/dates";
import { formatShortfall } from "@/lib/shared/money";
import { MiniTicket } from "./MiniTicket";
import { Owner } from "./Owner";

/** When the red ticket lands (its deal delay + stamp), the owner sees it. */
const SEES_IT_MS = 2300;

/**
 * The first screen: one big sentence, one plain line, two buttons, and the shop's owner behind the
 * counter. The 14 days are dealt onto the till board below; when Thu 12 lands red, the owner's face drops.
 */
export function Hero({ story }: { story: LandingStory }) {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(() => setSeen(true), reduced ? 0 : SEES_IT_MS);
    return () => window.clearTimeout(t);
  }, []);
  const short = story.shortIndex === null ? null : story.forecast.days[story.shortIndex]!;

  return (
    <section aria-labelledby="hero-title" className="mx-auto w-full max-w-[1240px] px-5 pt-10 pb-16 lg:px-10 lg:pt-14 lg:pb-24">
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-6">
        <div>
          <p className="pill">For small shops that sell with PayPal</p>
          <h1 id="hero-title" className="display mt-6 text-[3.1rem] leading-[0.95] text-ink sm:text-[4.4rem] lg:text-[5.4rem]">
            Know the day your shop runs <span className="marker">out of money</span>.
          </h1>
          <p className="mt-6 max-w-[46ch] text-[19px] leading-8 text-ink">
            NeverShort looks at your next 14 days, warns you about a day you&apos;ll be short{" "}
            <strong className="font-semibold">up to two weeks ahead</strong>, and helps you fix it. Every money move passes a
            safety check first.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/demo" className="btn-chunky">
              Try it on a sample shop
            </Link>
            <a href="#how" className="text-[17px] font-medium text-ink underline decoration-ink/30 underline-offset-[6px] hover:decoration-ink">
              How it works
            </a>
          </div>
          <p className="mt-5 text-[16px] text-ink">
            Or{" "}
            <Link href="/try" className="font-semibold underline decoration-ink/30 underline-offset-[5px] hover:decoration-ink">
              find your own shop&apos;s short day
            </Link>{" "}
            with a few numbers.
          </p>
        </div>

        <div className="hero-scene relative mx-auto w-full max-w-[460px]">
          <div aria-hidden className="scene-sun" />
          {short ? (
            <p className={`bubble ${seen ? "bubble-in" : ""}`} aria-live="polite">
              {seen ? `Thursday's going to be ${formatShortfall(short.shortByCents)} short.` : " "}
            </p>
          ) : null}
          <div className="scene-window">
            <Owner mood={seen ? "worried" : "calm"} className="relative z-[1] w-[78%] translate-x-[8%]" />
          </div>
          <div aria-hidden className="counter" />
        </div>
      </div>

      <div className="till-board mt-12 lg:mt-14">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <p className="font-serif text-[1.25rem] leading-snug text-white sm:text-[1.5rem]">{story.headline.text}</p>
          <p className="text-[13px] text-white/60">Loop Audio, a sample shop · next 14 days</p>
        </div>
        <ol aria-label="Loop Audio's balance at the end of each of the next 14 days" className="mt-5 grid grid-cols-4 gap-x-2 gap-y-3 sm:grid-cols-7 lg:grid-cols-14 lg:gap-x-1.5">
          {story.forecast.days.map((day, i) => (
            <li
              key={day.date}
              className={`deal min-w-0 ${day.state === "short" ? "deal-last" : ""}`}
              style={{ animationDelay: `${300 + (day.state === "short" ? 14 : i) * 75}ms` }}
            >
              <MiniTicket
                label={day.isToday ? "Today" : `${weekdayShort(day.date)} ${dayOfMonth(day.date)}`}
                strong={day.isToday}
                closingCents={day.closingCents}
                state={day.state}
                shortByCents={day.shortByCents}
                stamp={day.state === "short" ? "short" : null}
                narrow
              />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
