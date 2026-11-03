import type { Metadata } from "next";
import { PageSentence } from "@/components/ui";
import { AskPanel } from "@/components/ask/AskPanel";
import { SUGGESTED_QUESTIONS } from "@/lib/ai";

export const metadata: Metadata = { title: "Ask" };

/** Ask: plain questions about the shop's money, answered only from its own numbers. */
export default function AskPage() {
  return (
    <div className="max-w-[760px] space-y-10">
      <PageSentence>Ask about your money. Every answer is worked out from your own numbers.</PageSentence>
      <div className="rounded-card bg-paper p-5 ring-1 ring-ink/[0.06] lg:p-6">
        <AskPanel suggestions={SUGGESTED_QUESTIONS} />
      </div>
    </div>
  );
}
