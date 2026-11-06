import type { Metadata } from "next";
import { AskPanel } from "@/components/ask/AskPanel";
import { SUGGESTED_QUESTIONS } from "@/lib/ai";

export const metadata: Metadata = { title: "Ask Co-pilot • NeverShort" };

/** Ask: plain questions about the shop's money, answered only from its own numbers. */
export default function AskPage() {
  return (
    <div className="max-w-[800px] mx-auto space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-600">
            Financial AI Co-pilot
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-black text-slate-900 tracking-tight">
          Ask questions about your store&apos;s cashflow.
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Every answer is calculated using deterministic tools and real ledger records. AI agents never guess or hallucinate numbers.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-7 shadow-sm">
        <AskPanel suggestions={SUGGESTED_QUESTIONS} />
      </div>
    </div>
  );
}
