import { getEnv } from "@/lib/shared/env";

/**
 * Whether PayPal is set up. The app always runs without keys: until Person 2 creates the sandbox app,
 * checkout is switched off and the demo uses fake PayPal data (PAYPAL_FAKE=1 in tests).
 */
export type PayPalSetup = "sandbox" | "fake" | "not-configured";

export function paypalSetup(): PayPalSetup {
  const env = getEnv();
  if (env.PAYPAL_CLIENT_ID && env.PAYPAL_CLIENT_SECRET) return "sandbox";
  if (env.PAYPAL_FAKE === "1") return "fake";
  return "not-configured";
}

const COPY: Record<PayPalSetup, { title: string; body: string; mark: string }> = {
  sandbox: {
    title: "PayPal sandbox is connected.",
    body: "Checkouts and reminders use real sandbox payments. No real money moves.",
    mark: "bg-green",
  },
  fake: {
    title: "PayPal is in fake mode.",
    body: "Payments are simulated without calling PayPal, for tests and offline demos.",
    mark: "bg-amber",
  },
  "not-configured": {
    title: "PayPal isn't set up yet.",
    body: "The sandbox keys aren't in place, so checkout is switched off and payment data here is sample data. Everything else works.",
    mark: "bg-amber",
  },
};

/** A calm one-card status, in the product's voice. */
export function PayPalStatus({ setup = paypalSetup() }: { setup?: PayPalSetup }) {
  const copy = COPY[setup];
  return (
    <div role="status" className="flex items-start gap-3 rounded-card bg-paper p-5 ring-1 ring-ink/[0.06]">
      <span aria-hidden className={`mt-1.5 inline-block size-2.5 shrink-0 rounded-[3px] ${copy.mark}`} />
      <div>
        <p className="text-[16px] leading-6 font-semibold text-ink">{copy.title}</p>
        <p className="mt-0.5 text-[15px] leading-6 text-ink-muted">{copy.body}</p>
      </div>
    </div>
  );
}
