import type { Metadata } from "next";
import { FixIt } from "@/components/landing/FixIt";
import { GuardReceipts } from "@/components/landing/GuardReceipts";
import { Hero } from "@/components/landing/Hero";
import { LastCall } from "@/components/landing/LastCall";
import { MoneyBack } from "@/components/landing/MoneyBack";
import { TimeLapse } from "@/components/landing/TimeLapse";
import { Scene } from "@/components/landing/Scene";
import { TopBar } from "@/components/landing/TopBar";
import { buildLandingStory } from "@/lib/landing";
import { daysBetween, formatDay } from "@/lib/shared/dates";

export const metadata: Metadata = {
  title: { absolute: "NeverShort: know the day you'll run short" },
  description:
    "NeverShort warns a small online shop before it runs out of money for its bills, and helps fix it, with a safety check on every move. Built on PayPal.",
};

/**
 * The landing page: Loop Audio's next two weeks, played as a time-lapse, then fixed by the visitor. Every number comes
 * from the real forecast engine and every decision from the real Guard rules (lib/landing), on the SIMULATED demo shop.
 */
export default function LandingPage() {
  const story = buildLandingStory();
  const shortIndex = story.shortIndex;
  const shortDay = shortIndex === null ? null : story.days[shortIndex]!;
  return (
    <>
      <TopBar />
      <main id="main">
        <Hero story={story} />
        {shortDay && shortIndex !== null ? (
          <>
            <Scene kind="drawer">
            <TimeLapse
              days={story.days.slice(0, shortIndex + 1)}
              allDays={story.days}
              minimumCents={story.minimumCents}
              sawIt={`NeverShort saw this on ${formatDay(story.today)}, ${daysBetween(story.today, shortDay.date)} days before.`}
            />
            </Scene>
            <Scene kind="ledger">
            <FixIt
              days={story.days}
              steps={story.steps}
              bestStep={story.bestStep ?? 0}
              shortIndex={shortIndex}
              untilLabel={story.days[Math.max(0, shortIndex - 1)]!.label}
            />
            </Scene>
            {story.recovery.due ? (
            <MoneyBack
              label="Simulated outbox"
              grossCents={story.recovery.grossCents}
              netCents={story.recovery.netCents}
              feeCents={story.recovery.feeCents}
              shortBeforeCents={shortDay.shortByCents}
              shortAfterCents={story.recovery.shortByAfterCents}
              due={story.recovery.due}
            />
            ) : null}
          </>
        ) : null}
        <Scene kind="counter">
          <GuardReceipts receipts={story.receipts} />
        </Scene>
        <LastCall />
      </main>
    </>
  );
}
