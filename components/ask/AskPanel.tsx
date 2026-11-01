"use client";

import { useState } from "react";
import type { ChatAnswer } from "@/types";
import { formatDay } from "@/lib/shared/dates";
import { formatDollars } from "@/lib/shared/money";
import { Button } from "@/components/ui/Button";

/**
 * Ask chat placeholder. Shows a suggested question and a calculated answer.
 * TODO(Person 4, P4-1): send questions to app/api/ai (tool calling, numbers from lib/forecast),
 * show a calm fallback with the numbers when the model fails, rate-limit per visitor.
 */
export function AskPanel({
  suggestions,
  sample,
  initial = null,
}: {
  suggestions: readonly string[];
  sample: ChatAnswer;
  initial?: ChatAnswer | null;
}) {
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState<ChatAnswer | null>(initial);

  const ask = (q: string) => {
    setQuestion(q);
    setAsked({ ...sample, question: q });
  };

  return (
    <div className="space-y-6">
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (question.trim()) ask(question.trim());
        }}
      >
        <label htmlFor="ask-input" className="sr-only">
          Ask about your money
        </label>
        <input
          id="ask-input"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Can I afford a $200 order on Monday?"
          className="min-h-12 flex-1 rounded-control bg-paper px-4 text-[16px] text-ink ring-1 ring-line ring-inset placeholder:text-ink-muted focus:ring-2 focus:ring-brand focus:outline-none"
        />
        <Button type="submit" className="min-h-12">
          Ask
        </Button>
      </form>

      <ul className="flex flex-wrap gap-2" aria-label="Suggested questions">
        {suggestions.map((s) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => ask(s)}
              className="rounded-full bg-surface px-3.5 py-2 text-[14px] text-ink hover:bg-line"
            >
              {s}
            </button>
          </li>
        ))}
      </ul>

      {asked ? (
        <section aria-live="polite" className="rounded-card bg-surface p-5 lg:p-6">
          <p className="text-[14px] text-ink-muted">You asked: {asked.question}</p>
          <p className="mt-3 max-w-[34ch] font-serif text-[1.75rem] leading-[1.15] text-ink lg:text-[2rem]">{asked.answer}</p>
          <dl className="mt-5 divide-y divide-line border-t border-line">
            {asked.facts.map((f) => (
              <div key={f.label} className="flex items-baseline justify-between gap-4 py-2.5 text-[15px]">
                <dt className="text-ink-muted">{f.label}</dt>
                <dd className="tabular font-semibold text-ink">{f.cents !== null ? formatDollars(f.cents) : f.date ? formatDay(f.date) : ""}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-[13px] text-ink-muted">Worked out from your forecast. The numbers come from your store&apos;s data, not from the AI.</p>
        </section>
      ) : null}
    </div>
  );
}
