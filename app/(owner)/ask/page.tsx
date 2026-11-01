import type { Metadata } from "next";
import { PageSentence } from "@/components/ui";
import { AskPanel } from "@/components/ask/AskPanel";
import { getVisitorStoreId } from "@/lib/demo";
import { answerQuestion, SUGGESTED_QUESTIONS } from "@/lib/ai";

export const metadata: Metadata = { title: "Ask" };

export default async function AskPage() {
  const storeId = await getVisitorStoreId();
  const sample = await answerQuestion(storeId, SUGGESTED_QUESTIONS[0]!);

  return (
    <div className="max-w-[760px] space-y-10">
      <PageSentence>Ask about your money. Every answer is worked out from your own numbers.</PageSentence>
      <AskPanel suggestions={SUGGESTED_QUESTIONS} sample={sample} initial={sample} />
    </div>
  );
}
