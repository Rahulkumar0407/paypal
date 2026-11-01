import type { Metadata } from "next";
import { Button, PageSentence } from "@/components/ui";
import { getVisitorStoreId } from "@/lib/demo";
import { getStoreSettings } from "@/lib/store";

export const metadata: Metadata = { title: "Settings" };

const METHODS = [
  { value: "PAYPAL_PAYOUTS", label: "PayPal (Payouts)" },
  { value: "BANK_TRANSFER", label: "Bank transfer" },
  { value: "CARD", label: "Card" },
] as const;

const field = "mt-1.5 block w-full min-h-12 rounded-control bg-paper px-4 text-[16px] text-ink ring-1 ring-line ring-inset focus:ring-2 focus:ring-brand focus:outline-none";
const label = "block text-[15px] font-semibold text-ink";
const hint = "mt-1 block text-[14px] leading-5 text-ink-muted";

/** The short setup form. TODO(Person 4, P4-4): save these answers (lib/store) and use them in alerts. */
export default async function SettingsPage() {
  const storeId = await getVisitorStoreId();
  const s = await getStoreSettings(storeId);

  return (
    <div className="max-w-[640px] space-y-10">
      <PageSentence>A few answers about {s.name}, so the forecast fits the shop.</PageSentence>

      <form className="space-y-8 rounded-card bg-paper p-5 ring-1 ring-ink/[0.06] lg:p-8" aria-describedby="settings-note">
        <div>
          <label htmlFor="sell" className={label}>
            What you sell
          </label>
          <input id="sell" name="whatYouSell" defaultValue={s.whatYouSell} className={field} />
        </div>

        <fieldset>
          <legend className={label}>How you pay suppliers</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {METHODS.map((m) => (
              <label key={m.value} className="flex min-h-12 items-center gap-3 rounded-control bg-paper px-4 text-[15px] text-ink ring-1 ring-line ring-inset has-[:checked]:ring-2 has-[:checked]:ring-brand">
                <input type="radio" name="supplierPaymentMethod" value={m.value} defaultChecked={s.supplierPaymentMethod === m.value} className="accent-[var(--color-brand)]" />
                {m.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="seasons" className={label}>
            Busy seasons
          </label>
          <span className={hint}>One per line. The forecast expects more sales then.</span>
          <textarea id="seasons" name="busySeasons" rows={3} defaultValue={s.busySeasons.join("\n")} className={`${field} py-3 leading-6`} />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="minimum" className={label}>
              Your minimum balance
            </label>
            <span className={hint}>A day below this shows as short.</span>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-4 mt-[3px] -translate-y-1/2 text-ink-muted">$</span>
              <input id="minimum" name="minimum" inputMode="decimal" defaultValue={(s.minimumBalanceCents / 100).toFixed(0)} className={`${field} pl-8 tabular`} />
            </div>
          </div>
          <div>
            <label htmlFor="margin" className={label}>
              Tight margin
            </label>
            <span className={hint}>Within this much of your minimum, a day shows as tight.</span>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-4 mt-[3px] -translate-y-1/2 text-ink-muted">$</span>
              <input id="margin" name="margin" inputMode="decimal" defaultValue={(s.tightMarginCents / 100).toFixed(0)} className={`${field} pl-8 tabular`} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 border-t border-line pt-6">
          <Button type="submit" disabled>
            Save answers
          </Button>
          <p id="settings-note" className="text-[14px] text-ink-muted">
            Saving arrives with the setup form task. These are the demo store&apos;s answers.
          </p>
        </div>
      </form>
    </div>
  );
}
