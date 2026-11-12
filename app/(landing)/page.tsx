import type { Metadata } from "next";
import { HomeTabs } from "@/components/landing/home/HomeTabs";
import { Features, GitHub, Hero, NextUp, Problem, Tech, TryNow, WhatItDoes } from "@/components/landing/home/Sections";
import { buildLandingStory } from "@/lib/landing";

export const metadata: Metadata = {
  title: { absolute: "tmrw: see the short day before it arrives" },
  description:
    "A small shop's month, on one page, inside PayPal. tmrw spots the day two big payments land together, a week early, and helps fix it, with a safety check on every money move.",
};

/**
 * The landing page: one long page in tabs (Problem, What it does, Features, Tech, Next up, GitHub, Try it now), with a
 * spotlight on the section you're reading, in the illustrated look of the v2 page. Every number comes from the real
 * forecast engine and every decision from the real Guard rules (lib/landing), on the SIMULATED Dunder Mifflin & Co.
 * sample shop. No database.
 */
export default function LandingPage() {
  const story = buildLandingStory();
  return (
    <div className="home">
      <HomeTabs />
      <Hero story={story} />
      <main id="main">
        <Problem story={story} />
        <WhatItDoes story={story} />
        <Features story={story} />
        <Tech />
        <NextUp />
        <GitHub />
        <TryNow />
      </main>
    </div>
  );
}
