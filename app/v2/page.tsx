import React from "react";
import type { Metadata } from "next";
import { buildLandingStory } from "@/lib/landing";
import { V2StoryView } from "./V2StoryView";

export const metadata: Metadata = {
  title: "NeverShort: Know when your money might run low",
  description:
    "A continuous illustrated story of cashflow forecasting, checkout recovery, and deterministic financial safety. Built on PayPal.",
};

export default function V2Page() {
  const story = buildLandingStory();
  return <V2StoryView story={story} />;
}

