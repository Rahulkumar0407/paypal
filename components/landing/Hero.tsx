import Link from "next/link";
import type { LandingStory } from "@/lib/landing";
import { BanknotePanel, NOTE_ROOM_SEAL } from "@/components/ui/Banknote";
import { dayOfMonth, formatDayWithYear, weekdayShort } from "@/lib/shared/dates";
import { MiniTicket } from "./MiniTicket";
import { Tilt } from "./Tilt";

/**
 * The first screen. It must explain everything even if nobody scrolls: the promise, one plain sentence, the button,
 * and under them the product itself: a full-width banknote (real note proportions, medallion and seal showing) with
 * Loop Audio's real forecast and its 14 days dealt onto it like tickets.
 */
export function Hero({ story }: { story: LandingStory }) {
  return (
    <section aria-labelledby="hero-title" className="relative mx-auto w-full max-w-[1240px] px-5 pt-12 pb-16 lg:px-10 lg:pt-4 lg:pb-24">
      <div className="hero-copy grid items-end gap-x-14 gap-y-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div>
          <p className="text-[12px] font-semibold tracking-[0.2em] text-ink-muted uppercase">For small online shops on PayPal</p>
          <h1 id="hero-title" className="mt-4 font-serif text-[2.6rem] leading-[1.02] tracking-[-0.025em] text-pretty text-ink sm:text-[3.4rem] lg:text-[3.7rem]">
            Know the day you&apos;ll run short. <span className="text-ink-muted">Two weeks before it happens.</span>
          </h1>
        </div>
        <div className="lg:pb-2">
          <p className="max-w-[44ch] text-[18px] leading-8 text-ink">
            NeverShort warns a small online shop before it runs out of money for its bills, and helps fix it, with a safety
            check on every move.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href="/demo" className="key key-sm !min-h-[52px] !px-6 !text-[12.5px] !tracking-[0.08em]">
              Open the live demo
            </Link>
            <a href="#time-lapse" className="inline-flex min-h-[52px] items-center px-2 text-[16px] font-medium text-ink underline decoration-white/40 underline-offset-[6px] hover:decoration-white">
              Watch it happen
            </a>
          </div>
        </div>
      </div>

      <Tilt className="mt-10 lg:mt-8">
        <BanknotePanel sealOnly className="hero-note rounded-[6px] px-[54px] pt-[92px] pb-[96px] sm:px-[60px] lg:px-24 lg:pt-[100px] lg:pb-[176px]">
          <div>
            <div className={NOTE_ROOM_SEAL}>
            <p className="text-[12px] font-semibold tracking-[0.18em] text-white/70 uppercase">
              Loop Audio · {formatDayWithYear(story.today)} · Simulated shop
            </p>
            <p className="mt-3 max-w-[34ch] font-serif text-[1.45rem] leading-[1.15] tracking-[-0.015em] text-white sm:text-[1.9rem]">
              {story.headline.text}
            </p>
            </div>
            <ol
              aria-label="Loop Audio's balance at the end of each of the next 14 days"
              className="mt-7 grid grid-cols-4 gap-x-2 gap-y-3 sm:grid-cols-7 sm:gap-x-2.5 sm:gap-y-4 lg:mt-4 lg:grid-cols-14 lg:gap-x-1.5"
            >
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
        </BanknotePanel>
      </Tilt>
      <p className="mt-10 flex items-center gap-3 text-[14px] text-ink-muted">
        <span aria-hidden className="scroll-cue" />
        Scroll to watch a small shop&apos;s next two weeks.
      </p>
    </section>
  );
}
