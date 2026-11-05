"use client";

import { useActionState } from "react";
import type { StoreSettings } from "@/types";
import { Button } from "@/components/ui/Button";

interface Result {
  status: "idle" | "saved" | "invalid";
  message: string;
  errors: Partial<Record<"minimum" | "margin" | "whatYouSell" | "supplierPaymentMethod" | "busySeasons", string>>;
  values: Record<string, string> | null;
  attempt: number;
}

const METHODS = [
  { value: "PAYPAL_PAYOUTS", label: "PayPal", hint: "Sent from your PayPal" },
  { value: "BANK_TRANSFER", label: "Bank transfer", hint: "From your bank" },
  { value: "CARD", label: "Card", hint: "Business card" },
] as const;

const field =
  "mt-2 block w-full min-h-12 rounded-control bg-paper px-4 text-[16px] text-ink ring-1 ring-line ring-inset focus:ring-2 focus:ring-brand focus:outline-none aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-red";
const label = "block text-[16px] font-semibold text-ink";
const hint = "mt-0.5 block text-[14px] leading-5 text-ink-muted";

/** The short setup form: your minimum balance first, then a few words about the shop. */
export function SettingsForm({ settings, action }: { settings: StoreSettings; action: (previous: Result, form: FormData) => Promise<Result> }) {
  const [result, formAction, pending] = useActionState(action, { status: "idle", message: "", errors: {}, values: null, attempt: 0 });
  const e = result.errors;
  // React resets a form after its action runs; show what was typed rather than the saved answers.
  const typed = (key: string, saved: string) => result.values?.[key] ?? saved;

  return (
    <form key={result.attempt} action={formAction} noValidate className="space-y-6">
      <section aria-labelledby="line-title" className="space-y-6 rounded-card bg-paper p-5 ring-1 ring-ink/[0.06] lg:p-8">
        <div>
          <h2 id="line-title" className="text-[20px] leading-7 font-semibold text-ink">
            Your minimum balance
          </h2>
          <p className="mt-1 text-[15px] leading-6 text-ink-muted">The forecast colours each day against these two numbers.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <Money
            id="minimum"
            title="Minimum balance"
            help="The lowest you're happy for the balance to go. A day that ends below it shows as short (red)."
            defaultValue={typed("minimum", (settings.minimumBalanceCents / 100).toFixed(0))}
            error={e.minimum}
          />
          <Money
            id="margin"
            title="Warning zone"
            help="If a day ends this close above your minimum balance, it shows as tight (amber)."
            defaultValue={typed("margin", (settings.tightMarginCents / 100).toFixed(0))}
            error={e.margin}
          />
        </div>
      </section>

      <section aria-labelledby="shop-title" className="space-y-7 rounded-card bg-paper p-5 ring-1 ring-ink/[0.06] lg:p-8">
        <div>
          <h2 id="shop-title" className="text-[20px] leading-7 font-semibold text-ink">
            About the shop
          </h2>
          <p className="mt-1 text-[15px] leading-6 text-ink-muted">Three quick answers. They help the forecast and the alerts fit how you work.</p>
        </div>

        <div>
          <label htmlFor="whatYouSell" className={label}>
            What you sell
          </label>
          <input
            id="whatYouSell"
            name="whatYouSell"
            defaultValue={typed("whatYouSell", settings.whatYouSell)}
            aria-invalid={e.whatYouSell ? true : undefined}
            aria-describedby={e.whatYouSell ? "whatYouSell-error" : undefined}
            className={field}
          />
          <FieldError id="whatYouSell-error" message={e.whatYouSell} />
        </div>

        <fieldset aria-describedby={e.supplierPaymentMethod ? "method-error" : undefined}>
          <legend className={label}>How you pay suppliers</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {METHODS.map((m) => (
              <label
                key={m.value}
                className="flex min-h-14 cursor-pointer items-center gap-3 rounded-control bg-paper px-4 py-2 ring-1 ring-line ring-inset has-[:checked]:bg-surface has-[:checked]:ring-2 has-[:checked]:ring-brand"
              >
                <input
                  type="radio"
                  name="supplierPaymentMethod"
                  value={m.value}
                  defaultChecked={typed("supplierPaymentMethod", settings.supplierPaymentMethod) === m.value}
                  className="size-4 accent-[var(--color-brand)]"
                />
                <span>
                  <span className="block text-[15px] leading-5 font-medium text-ink">{m.label}</span>
                  <span className="block text-[13px] leading-4 text-ink-muted">{m.hint}</span>
                </span>
              </label>
            ))}
          </div>
          <FieldError id="method-error" message={e.supplierPaymentMethod} />
        </fieldset>

        <div>
          <label htmlFor="busySeasons" className={label}>
            Busy seasons
          </label>
          <span id="seasons-hint" className={hint}>
            One per line. The forecast expects more sales then.
          </span>
          <textarea
            id="busySeasons"
            name="busySeasons"
            rows={3}
            defaultValue={typed("busySeasons", settings.busySeasons.join("\n"))}
            aria-invalid={e.busySeasons ? true : undefined}
            aria-describedby={e.busySeasons ? "seasons-hint seasons-error" : "seasons-hint"}
            className={`${field} py-3 leading-6`}
          />
          <FieldError id="seasons-error" message={e.busySeasons} />
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <Button type="submit" disabled={pending} className="min-h-12 px-6 text-[16px]">
          {pending ? "Saving" : "Save answers"}
        </Button>
        <p role="status" aria-live="polite" className="flex items-start gap-2 text-[15px] leading-6 text-ink">
          {result.status !== "idle" ? (
            <span aria-hidden className={`mt-2 inline-block size-2 shrink-0 rounded-full ${result.status === "saved" ? "bg-green" : "bg-red"}`} />
          ) : null}
          {result.message}
        </p>
      </div>
    </form>
  );
}

function Money({ id, title, help, defaultValue, error }: { id: string; title: string; help: string; defaultValue: string; error?: string }) {
  return (
    <div>
      <label htmlFor={id} className={label}>
        {title}
      </label>
      <span id={`${id}-hint`} className={hint}>
        {help}
      </span>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-4 mt-[4px] -translate-y-1/2 text-[16px] text-ink-muted">$</span>
        <input
          id={id}
          name={id}
          inputMode="numeric"
          defaultValue={defaultValue}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-hint ${id}-error` : `${id}-hint`}
          className={`${field} pl-8 tabular`}
        />
      </div>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 flex items-start gap-2 text-[14px] leading-5 text-ink">
      <span aria-hidden className="mt-1.5 inline-block size-2 shrink-0 rounded-full bg-red" />
      {message}
    </p>
  );
}
