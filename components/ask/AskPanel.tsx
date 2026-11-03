"use client";

import { useState } from "react";
import type { ChatAnswer } from "@/types";
import { formatDay } from "@/lib/shared/dates";
import { formatDollars } from "@/lib/shared/money";
import { Button } from "@/components/ui/Button";

type Status = { kind: "idle" } | { kind: "asking"; question: string } | { kind: "error"; message: string };

/**
 * Ask chat. Questions go to /api/ai, which answers only from the store's own numbers (tools backed by the forecast).
 * The facts under each answer are always worked out by code; the sentence is AI-written only when it passed the checks.
 */
export function AskPanel({ suggestions }: { suggestions: readonly string[] }) {
  const [question, setQuestion] = useState("");
  const [answers, setAnswers] = useState<ChatAnswer[]>([]);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function ask(q: string) {
    const text = q.trim();
    if (!text || status.kind === "asking") return;
    setQuestion(text);
    setStatus({ kind: "asking", question: text });
    try {
      const response = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: text }) });
      const body = (await response.json()) as { answer?: ChatAnswer; error?: string };
      if (!response.ok || !body.answer) throw new Error(body.error ?? "No answer");
      setAnswers((all) => [body.answer!, ...all].slice(0, 6));
      setQuestion("");
      setStatus({ kind: "idle" });
    } catch (error) {
      setStatus({ kind: "error", message: error instanceof Error && error.message.startsWith("Send") ? error.message : "Couldn't get an answer just now. Your numbers are fine; try again in a minute." });
    }
  }

  const [latest, ...earlier] = answers;

  return (
    <div className="space-y-6">
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          void ask(question);
        }}
      >
        <label htmlFor="ask-input" className="sr-only">
          Ask about your money
        </label>
        <input
          id="ask-input"
          value={question}
          maxLength={300}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Can I afford a $200 order on Monday?"
          className="min-h-12 flex-1 rounded-control bg-paper px-4 text-[16px] text-ink ring-1 ring-line ring-inset placeholder:text-ink-muted focus:ring-2 focus:ring-brand focus:outline-none"
        />
        <Button type="submit" className="min-h-12" disabled={status.kind === "asking"}>
          {status.kind === "asking" ? "Working it out" : "Ask"}
        </Button>
      </form>

      <div>
        <p className="mb-2 text-[14px] text-ink-muted">Or try one of these:</p>
        <ul className="flex flex-wrap gap-2" aria-label="Suggested questions">
          {suggestions.map((s) => (
            <li key={s}>
              <button
                type="button"
                disabled={status.kind === "asking"}
                onClick={() => void ask(s)}
                className="min-h-11 rounded-full bg-surface px-4 text-left text-[15px] text-ink hover:bg-line disabled:opacity-50"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div aria-live="polite" className="space-y-4">
        {status.kind === "asking" ? (
          <div role="status" className="rounded-card bg-surface p-5 lg:p-6">
            <p className="text-[14px] text-ink-muted">You asked: {status.question}</p>
            <p className="mt-3 text-[17px] text-ink">Working it out from your forecast…</p>
          </div>
        ) : status.kind === "error" ? (
          <p role="alert" className="flex items-start gap-2 rounded-card bg-surface p-5 text-[16px] leading-6 text-ink">
            <span aria-hidden className="mt-2 inline-block size-2 shrink-0 rounded-full bg-red" />
            {status.message}
          </p>
        ) : null}

        {latest ? <AnswerCard answer={latest} /> : status.kind === "idle" ? <p className="text-[15px] text-ink-muted">Answers show up here, with the numbers they rest on.</p> : null}
        {earlier.length > 0 ? (
          <details className="rounded-card bg-paper p-4 ring-1 ring-line">
            <summary className="cursor-pointer text-[15px] text-ink">Earlier answers ({earlier.length})</summary>
            <div className="mt-3 space-y-3">
              {earlier.map((a, i) => (
                <AnswerCard key={`${a.question}-${i}`} answer={a} compact />
              ))}
            </div>
          </details>
        ) : null}
      </div>
    </div>
  );
}

function AnswerCard({ answer, compact = false }: { answer: ChatAnswer; compact?: boolean }) {
  return (
    <section className="rounded-card bg-surface p-5 lg:p-6">
      <p className="text-[14px] text-ink-muted">You asked: {answer.question}</p>
      <p className={`mt-3 text-ink ${compact ? "text-[17px] leading-6" : "max-w-[36ch] font-serif text-[1.6rem] leading-[1.2] lg:text-[1.9rem]"}`}>{answer.answer}</p>
      {answer.facts.length > 0 ? (
        <dl className="mt-5 divide-y divide-line border-t border-line">
          {answer.facts.map((f) => (
            <div key={f.label} className="flex items-baseline justify-between gap-4 py-2.5 text-[15px]">
              <dt className="text-ink-muted">{f.label}</dt>
              <dd className="tabular font-semibold whitespace-nowrap text-ink">{f.cents !== null ? formatDollars(f.cents) : f.date ? formatDay(f.date) : ""}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <p className="mt-3 text-[13px] text-ink-muted">
        {answer.source === "ai" ? "Written for you from your forecast, and checked: every number comes from your store's data." : "Worked out from your forecast. Every number comes from your store's data."}
      </p>
    </section>
  );
}
