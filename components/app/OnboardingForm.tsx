"use client";

import { useActionState } from "react";
import Link from "next/link";
import { submitMerchantOnboarding, resetToDemoSimulation, type OnboardingState } from "@/app/(owner)/onboarding/actions";

const initialState: OnboardingState = {
  status: "idle",
  message: "",
};

export function OnboardingForm({
  currentName,
  currentWhatYouSell,
  currentMinimumBalanceCents,
  currentOpeningBalanceCents,
  isDemo,
}: {
  currentName: string;
  currentWhatYouSell: string;
  currentMinimumBalanceCents: number;
  currentOpeningBalanceCents: number;
  isDemo: boolean;
}) {
  const [state, formAction, isPending] = useActionState(submitMerchantOnboarding, initialState);

  return (
    <div className="space-y-8">
      {/* Current Mode Badge */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isDemo ? "bg-blue-600" : "bg-emerald-500"
            }`}
          />
          <span className="text-sm font-semibold text-slate-900">
            Current Status: {isDemo ? "Demo Simulation (Loop Audio)" : `Active Merchant (${currentName})`}
          </span>
        </div>
        {isDemo ? (
          <span className="text-xs font-mono text-slate-500 bg-white px-2.5 py-1 rounded-md border border-slate-200">
            Fictional Data Loaded
          </span>
        ) : (
          <button
            type="button"
            onClick={async () => {
              if (confirm("Restore the Loop Audio demo simulation?")) {
                await resetToDemoSimulation();
                window.location.reload();
              }
            }}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 underline underline-offset-2"
          >
            Switch to Demo Simulation
          </button>
        )}
      </div>

      {/* Main Setup Form */}
      <form action={formAction} className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">1. Business Profile</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Set your real business identity. This replaces the demo boutique with your actual store.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Business / Store Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={isDemo ? "" : currentName}
              placeholder="e.g. Acme Audio Labs"
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
            {state.errors?.name && (
              <p className="text-xs font-medium text-rose-600 mt-1">{state.errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="whatYouSell" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              What do you sell or provide?
            </label>
            <input
              id="whatYouSell"
              name="whatYouSell"
              type="text"
              required
              defaultValue={isDemo ? "" : currentWhatYouSell}
              placeholder="e.g. Specialty coffee gear and freshly roasted beans"
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
            {state.errors?.whatYouSell && (
              <p className="text-xs font-medium text-rose-600 mt-1">{state.errors.whatYouSell}</p>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">2. Cash Flow & Reserve Safety Line</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Margin Guard uses your minimum reserve as an absolute floor. You will be alerted before any day drops below it.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="openingBalanceDollars" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Starting Cash Balance ($ USD)
            </label>
            <div className="relative mt-1.5">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-sm font-bold text-slate-400">$</span>
              <input
                id="openingBalanceDollars"
                name="openingBalanceDollars"
                type="text"
                required
                defaultValue={isDemo ? "1500" : Math.round(currentOpeningBalanceCents / 100)}
                placeholder="1500"
                className="w-full rounded-xl border border-slate-300 pl-8 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
              />
            </div>
            {state.errors?.openingBalanceDollars && (
              <p className="text-xs font-medium text-rose-600 mt-1">{state.errors.openingBalanceDollars}</p>
            )}
          </div>

          <div>
            <label htmlFor="minimumReserveDollars" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Minimum Cash Reserve ($ USD)
            </label>
            <div className="relative mt-1.5">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-sm font-bold text-slate-400">$</span>
              <input
                id="minimumReserveDollars"
                name="minimumReserveDollars"
                type="text"
                required
                defaultValue={isDemo ? "250" : Math.round(currentMinimumBalanceCents / 100)}
                placeholder="250"
                className="w-full rounded-xl border border-slate-300 pl-8 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
              />
            </div>
            {state.errors?.minimumReserveDollars && (
              <p className="text-xs font-medium text-rose-600 mt-1">{state.errors.minimumReserveDollars}</p>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {state.status === "error" && <span className="text-rose-600 font-semibold">{state.message}</span>}
            {state.status === "success" && <span className="text-emerald-700 font-semibold">{state.message}</span>}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/today"
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-xs"
            >
              {isPending ? "Configuring Store..." : "Save Merchant Setup →"}
            </button>
          </div>
        </div>
      </form>

      {/* Integration Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-3">
        <h3 className="text-base font-bold text-slate-900">3. PayPal Integration Status</h3>
        <p className="text-xs text-slate-500">
          NeverShort connects to PayPal Orders v2 and Webhooks. Payments are verified on the server side using official PayPal cryptographic signatures.
        </p>
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 font-mono text-xs space-y-1.5 text-slate-600">
          <div className="flex justify-between">
            <span>Webhook Endpoint:</span>
            <span className="text-slate-900 font-semibold">/api/paypal/webhook</span>
          </div>
          <div className="flex justify-between">
            <span>Signature Verification:</span>
            <span className="text-emerald-700 font-semibold">Enabled (HMAC/SHA256)</span>
          </div>
          <div className="flex justify-between">
            <span>Mode:</span>
            <span className="text-slate-900 font-semibold">PayPal Sandbox (Safe)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

