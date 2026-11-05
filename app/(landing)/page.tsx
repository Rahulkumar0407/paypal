import type { Metadata } from "next";
import { ComesBack } from "@/components/landing/ComesBack";
import { Finale } from "@/components/landing/Finale";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { SafetyCheck } from "@/components/landing/SafetyCheck";
import { SaveThursday } from "@/components/landing/SaveThursday";
import { TopBar } from "@/components/landing/TopBar";
import { buildLandingStory } from "@/lib/landing";
import { dayOfMonth, weekdayShort } from "@/lib/shared/dates";

export const metadata: Metadata = {
  title: { absolute: "NeverShort: know the day your shop runs out of money" },
  description:
    "NeverShort warns a small online shop about the day it will run short, two weeks early, and helps fix it, with a safety check on every money move. Built on PayPal.",
};

/**
 * The landing page: what NeverShort does in one sentence, how it works in three steps, then the visitor plays with it
 * (save Thursday, pay Maya's reminder) and sees the safety check's receipts. Every number comes from the real forecast
 * engine and every decision from the real Guard rules (lib/landing), on the SIMULATED demo shop. No database.
 */
export default function LandingPage() {
  const story = buildLandingStory();
  const shortIndex = story.shortIndex ?? 0;
  const days = story.days.map((d) => ({
    date: d.date,
    label: d.date === story.today ? "Today" : `${weekdayShort(d.date)} ${dayOfMonth(d.date)}`,
    longLabel: d.label,
  }));
  const shortDay = story.days[shortIndex]!;
  return (
    <>
      <TopBar />
      <main id="main">
        <Hero story={story} />
        <HowItWorks
          shortLabel={shortDay.label}
          shortByCents={shortDay.shortByCents}
          why={story.forecast.firstShortfall?.reason ?? "payments leave the same day"}
          states={story.forecast.days.map((d) => d.state)}
        />
        <SaveThursday days={days} steps={story.steps} bestStep={story.bestStep ?? 0} shortIndex={shortIndex} />
        {story.recovery.due ? (
          <ComesBack
            label="Simulated here · in the sample shop it's a real PayPal test payment"
            grossCents={story.recovery.grossCents}
            netCents={story.recovery.netCents}
            feeCents={story.recovery.feeCents}
            shortBeforeCents={shortDay.shortByCents}
            shortAfterCents={story.recovery.shortByAfterCents}
            due={story.recovery.due}
          />
        ) : null}
        <SafetyCheck receipts={story.receipts} />
      </main>
      <Finale />
    </>
  );
}
