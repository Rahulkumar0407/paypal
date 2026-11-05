"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { DAY_FILL, DAY_WORD, DECISION_FILL, DECISION_WORD } from "@/components/ui/meaning";
import { formatDollars } from "@/lib/shared/money";
import { PAYMENT_ROWS, type TryDay, type TryResult, type TryView } from "@/app/(landing)/try/view";
import { MiniTicket } from "./MiniTicket";

const KINDS = [
  { value: "BILL", label: "Bill" },
  { value: "SUPPLIER", label: "Supplier order" },
  { value: "OWNER_TRANSFER", label: "To your bank" },
] as const;

/**
 * "Find your short day": a few numbers in, the app's own 14-day forecast out (tickets, the headline sentence, ways to
 * fix it, each one judged by the Margin Guard). Opens with example numbers already worked out; nothing is stored.
 *
 * The form is made of the product's own objects: three big dials for the shop's numbers, and one bill slip per
 * payment with its type as chips, its day on a two-week calendar like the tickets, and a weekly switch.
 */
export function TryIt({
  action,
  initial,
  days,
}: {
  action: (previous: TryResult, form: FormData) => Promise<TryResult>;
  initial: TryResult;
  days: { value: string; label: string; weekday: string; date: string }[];
}) {
  const [result, formAction, pending] = useActionState(action, initial);
  const resultRef = useRef<HTMLDivElement>(null);

  // On a phone the result is under the form: bring it into view after each run.
  useEffect(() => {
    if (result.attempt === 0 || result.status !== "ok") return;
    if (window.matchMedia("(min-width: 1024px)").matches) return;
    resultRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }, [result.attempt, result.status]);

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-12">
      <TryForm key={result.attempt} result={result} formAction={formAction} pending={pending} days={days} />
      <div ref={resultRef} className="scroll-mt-6 lg:sticky lg:top-8">
        {result.view ? <YourTwoWeeks view={result.view} round={result.attempt} pending={pending} /> : null}
      </div>
    </div>
  );
}

/** Re-mounted after every run (key), so it starts from what was typed. */
function TryForm({
  result,
  formAction,
  pending,
  days,
}: {
  result: TryResult;
  formAction: (form: FormData) => void;
  pending: boolean;
  days: { value: string; label: string; weekday: string; date: string }[];
}) {
  const v = (key: string) => result.values?.[key] ?? "";
  const e = result.errors;
  // Which payment slips are on the table: the ones with something in them (at least one).
  const [shown, setShown] = useState<boolean[]>(() => {
    const filled = Array.from({ length: PAYMENT_ROWS }, (_, i) => Boolean(v(`name${i}`) || v(`amount${i}`) || e[`row${i}`]));
    if (!filled.some(Boolean)) filled[0] = true;
    return filled;
  });
  // A slip that was taken off comes back blank, never with what it held before.
  const [blank, setBlank] = useState<boolean[]>(() => Array.from({ length: PAYMENT_ROWS }, () => false));
  const free = shown.indexOf(false);
  const none = () => "";

  return (
    <form id="try-form" action={formAction} noValidate className="space-y-7">
      <div className="grid gap-3 sm:grid-cols-3">
        <Dial id="balance" label="In PayPal today" value={v("balance")} error={e.balance} />
        <Dial id="sales" label="A normal day's sales" hint="after PayPal's fee" value={v("sales")} error={e.sales} />
        <Dial id="minimum" label="Minimum balance" value={v("minimum")} error={e.minimum} />
      </div>

      <fieldset>
        <legend className="text-[17px] font-semibold text-ink">Payments in the next two weeks</legend>
        <p className="mt-0.5 text-[14px] text-ink-muted">Rent, supplier orders, bills, and money you move to your own bank.</p>
        <ol className="mt-4 space-y-4">
          {shown.map((on, i) =>
            on ? (
              <li key={i}>
                <BillSlip
                  i={i}
                  v={blank[i] ? none : v}
                  error={blank[i] ? undefined : e[`row${i}`]}
                  days={days}
                  onRemove={() => {
                    setShown((s) => s.map((x, j) => (j === i ? false : x)));
                    setBlank((b) => b.map((x, j) => (j === i ? true : x)));
                  }}
                  removable={shown.filter(Boolean).length > 1}
                />
              </li>
            ) : null,
          )}
        </ol>
        {free >= 0 ? (
          <button
            type="button"
            onClick={() => setShown((s) => s.map((x, j) => (j === free ? true : x)))}
            className="try-add mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-[14px] text-[15px] font-semibold text-ink"
          >
            <span aria-hidden className="text-[20px] leading-none">+</span> Add a payment
          </button>
        ) : null}
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className="btn-chunky disabled:opacity-70">
          {pending ? "Working it out" : "Show my two weeks"}
        </button>
        <p role="status" aria-live="polite" className="text-[15px] text-ink">
          {result.message || (result.attempt === 0 ? "These are example numbers. Change them to yours." : "")}
        </p>
      </div>
    </form>
  );
}

/** One of the shop's three numbers, as a big dial: the dollars in the display serif, typed straight in. */
function Dial({ id, label, value, error, hint }: { id: string; label: string; value: string; error?: string; hint?: string }) {
  return (
    <div className={`try-dial ${error ? "try-dial-error" : ""}`}>
      <label htmlFor={id} className="block text-[12px] leading-4 font-semibold tracking-[0.12em] text-ink-muted uppercase sm:min-h-8">
        {label}
      </label>
      <div className="try-field mt-1.5 flex items-baseline">
        <span aria-hidden className="display text-[1.5rem] leading-none text-ink/45 sm:text-[1.9rem]">
          $
        </span>
        <input
          id={id}
          name={id}
          inputMode="numeric"
          autoComplete="off"
          defaultValue={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className="display w-full min-w-0 bg-transparent pl-1 text-[1.8rem] leading-tight text-ink tabular outline-none sm:text-[2.2rem]"
        />
      </div>
      {hint ? (
        <p id={`${id}-hint`} className="text-[13px] text-ink-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-[13px] leading-5 font-medium text-ink">
          <span aria-hidden className="mr-1.5 inline-block size-2 rounded-full bg-red" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** One payment as a bill slip: what and how much on top, its type as chips, its day on a two-week calendar. */
function BillSlip({
  i,
  v,
  error,
  days,
  onRemove,
  removable,
}: {
  i: number;
  v: (key: string) => string;
  error?: string;
  days: { value: string; label: string; weekday: string; date: string }[];
  onRemove: () => void;
  removable: boolean;
}) {
  const kind = v(`kind${i}`) || "BILL";
  const day = v(`day${i}`) || "0";
  return (
    <div className={`try-slip ${error ? "try-slip-error" : ""}`}>
      <div className="flex flex-wrap items-start gap-x-3 gap-y-3 sm:flex-nowrap">
        <label className="order-1 min-w-0 basis-[calc(100%-3.25rem)] sm:flex-1 sm:basis-auto">
          <span className="block text-[11px] font-semibold tracking-[0.12em] text-ink-muted uppercase">
            What is it<span className="sr-only"> (payment {i + 1})</span>
          </span>
          <input
            name={`name${i}`}
            defaultValue={v(`name${i}`)}
            placeholder="e.g. Rent"
            autoComplete="off"
            className="try-field mt-1 w-full font-serif text-[1.3rem] leading-tight text-ink placeholder:text-ink/35"
          />
        </label>
        <label className="order-3 w-[9rem] shrink-0 sm:order-2 sm:w-[8.5rem]">
          <span className="block text-[11px] font-semibold tracking-[0.12em] text-ink-muted uppercase">
            How much<span className="sr-only"> in dollars</span>
          </span>
          <span className="try-field mt-1 flex items-baseline">
            <span aria-hidden className="display text-[1.2rem] text-ink/45">
              $
            </span>
            <input
              name={`amount${i}`}
              inputMode="numeric"
              autoComplete="off"
              defaultValue={v(`amount${i}`)}
              placeholder="0"
              className="display w-full min-w-0 bg-transparent pl-0.5 text-[1.45rem] leading-tight text-ink tabular outline-none placeholder:text-ink/30"
            />
          </span>
        </label>
        {removable ? (
          <button type="button" onClick={onRemove} aria-label={`Remove payment ${i + 1}`} className="order-2 -mr-1 grid size-9 sm:order-3 shrink-0 place-items-center rounded-full text-[20px] text-ink-muted hover:bg-ink/[0.06] hover:text-ink">
            ×
          </button>
        ) : null}
      </div>

      <fieldset className="mt-3">
        <legend className="sr-only">Payment {i + 1}: type</legend>
        <div className="flex flex-wrap gap-1.5">
          {KINDS.map((k) => (
            <label key={k.value} className="try-chip">
              <input type="radio" name={`kind${i}`} value={k.value} defaultChecked={kind === k.value} className="sr-only" />
              {k.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-3">
        <legend className="text-[12px] font-semibold tracking-[0.12em] text-ink-muted uppercase">Goes out on</legend>
        <div className="mt-1.5 grid grid-cols-7 gap-1">
          {days.map((d) => (
            <label key={d.value} className="try-day" title={d.label}>
              <input type="radio" name={`day${i}`} value={d.value} defaultChecked={day === d.value} className="sr-only" aria-label={d.label} />
              <span className="text-[10.5px] leading-none font-semibold tracking-[0.04em] uppercase">{d.weekday}</span>
              <span className="mt-0.5 text-[15px] leading-none font-semibold tabular">{d.date}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <label className="try-switch">
          <input type="checkbox" name={`weekly${i}`} defaultChecked={v(`weekly${i}`) === "on"} className="sr-only" />
          <span aria-hidden className="try-switch-track">
            <span className="try-switch-thumb" />
          </span>
          Every week
        </label>
        {error ? (
          <p className="text-[14px] font-medium text-ink">
            <span aria-hidden className="mr-1.5 inline-block size-2 rounded-full bg-red" />
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Tickets({ days, base, round, fixed }: { days: TryDay[]; base: TryDay[]; round: number; fixed: boolean }) {
  const shortIndex = days.findIndex((d) => d.state === "short");
  const baseShort = base.findIndex((d) => d.state === "short");
  return (
    <ol key={`d${round}`} aria-label="Your balance at the end of each day" className="mt-5 grid grid-cols-4 gap-x-2 gap-y-3 sm:grid-cols-7">
      {days.map((d, i) => {
        // With a fix in place, the days it changed flip over; otherwise the two weeks are dealt in.
        const changed = fixed && d.state !== base[i]?.state;
        const motion = fixed ? (changed ? "fix-flip" : "") : `deal ${i === shortIndex ? "deal-last" : ""}`;
        return (
          <li key={d.date} className={`min-w-0 ${motion}`} style={!fixed ? { animationDelay: `${120 + (i === shortIndex ? 14 : i) * 55}ms` } : undefined}>
            <MiniTicket
              label={d.label}
              strong={i === 0}
              closingCents={d.closingCents}
              state={d.state}
              shortByCents={d.shortByCents}
              stamp={i === shortIndex ? "short" : fixed && i === baseShort ? (d.state === "tight" ? "tight" : "covered") : null}
              narrow
            />
          </li>
        );
      })}
    </ol>
  );
}

function YourTwoWeeks({ view, round, pending }: { view: TryView; round: number; pending: boolean }) {
  const applied = view.applied;
  return (
    <section aria-label="Your next two weeks" className="till-board">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12px] font-semibold tracking-[0.16em] text-white/60 uppercase">{applied ? "Your two weeks, with this fix" : "Your next two weeks"}</p>
        {applied ? (
          <button type="submit" form="try-form" name="fix" value="" disabled={pending} className="text-[13px] font-medium text-white underline decoration-white/40 underline-offset-4 hover:decoration-white">
            Back to my numbers
          </button>
        ) : null}
      </div>
      <p key={`h${round}`} className="try-headline mt-2 font-serif text-[1.35rem] leading-snug text-white sm:text-[1.6rem]">
        {applied ? applied.headline.text : view.headline.text}
      </p>
      <Tickets days={applied ? applied.days : view.days} base={view.days} round={round} fixed={Boolean(applied)} />
      <p className="mt-4 text-[13px] text-white/60">
        Short below {formatDollars(view.minimumCents)}, tight up to {formatDollars(view.minimumCents + view.warningCents)}.
      </p>

      {applied ? (
        <div className="slip-in mt-5 flex items-start gap-4 rounded-[14px] bg-[#f4f1ea] p-4 text-ink" aria-live="polite">
          <span aria-hidden className={`ref-card shrink-0 ${DECISION_FILL[applied.decision]}`} />
          <div>
            <p className="text-[12px] font-semibold tracking-[0.12em] text-ink-muted uppercase">Margin Guard, same 9 rules as the app</p>
            <p className="text-[19px] leading-7 font-semibold">{DECISION_WORD[applied.decision]}</p>
            <p className="text-[15px] leading-6">{applied.reason}</p>
            <p className="mt-1 text-[13px] text-ink-muted">
              {applied.decision === "APPROVE"
                ? "In the app it would go ahead now, with a receipt."
                : applied.decision === "ESCALATE"
                  ? "In the app it would wait in your approvals, with a receipt."
                  : "In the app nothing would move; the receipt says why."}
              {applied.ruleNumber ? ` Rule ${applied.ruleNumber} of 9.` : ""}
            </p>
          </div>
        </div>
      ) : null}

      {view.fixes.length > 0 ? (
        <div className="mt-5 rounded-[14px] bg-[#f4f1ea] p-4 text-ink">
          <p className="text-[15px] font-semibold">Ways to fix it</p>
          <ul className="mt-2 space-y-3">
            {view.fixes.map((f) => {
              const on = applied?.fixId === f.id;
              return (
                <li key={f.id} className={`rounded-[10px] p-2.5 text-[15px] leading-6 ${on ? "bg-white ring-2 ring-brand" : ""}`}>
                  <span className="font-semibold">{f.title}.</span> <span className="text-ink-muted">{f.detail}</span>
                  <span className="mt-2 flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold whitespace-nowrap">
                      <span aria-hidden className={`inline-block size-2.5 rounded-[3px] ${DAY_FILL[f.state]}`} />
                      {DAY_WORD[f.state]} after
                    </span>
                    {on ? (
                      <span className="text-[13px] font-semibold text-brand">Trying this</span>
                    ) : (
                      <button
                        type="submit"
                        form="try-form"
                        name="fix"
                        value={f.id}
                        disabled={pending}
                        className="inline-flex min-h-9 items-center rounded-full bg-ink px-3.5 text-[13px] font-semibold text-white disabled:opacity-60"
                      >
                        Try this fix
                      </button>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {/* Where this ends and the sample shop begins: say it before the click, so nobody wonders where their numbers went. */}
      <div className="mt-6 border-t border-white/15 pt-5">
        <p className="text-[16px] leading-6 font-semibold text-white">This was your shop, worked out from a few numbers.</p>
        <p className="mt-1.5 max-w-[56ch] text-[15px] leading-6 text-white/75">
          Nothing you typed is saved. The full app reads your real PayPal history, so the live demo runs on a sample shop,
          Loop Audio, with 90 days of made-up sales. That&apos;s where you&apos;ll see reminders, the safety check and its
          receipts at work.
        </p>
        <Link href="/demo" className="btn-chunky btn-light btn-sm mt-4">
          See the full app on the sample shop
        </Link>
      </div>
    </section>
  );
}
