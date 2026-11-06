import type { Metadata } from "next";
import { getVisitorStoreId } from "@/lib/demo";
import { getStoreSettings } from "@/lib/store";
import { OnboardingForm } from "@/components/app/OnboardingForm";

export const metadata: Metadata = {
  title: "Merchant Onboarding • NeverShort",
};

export default async function OnboardingPage() {
  const storeId = await getVisitorStoreId();
  const settings = await getStoreSettings(storeId);
  const isDemo = settings.name === "Loop Audio";

  return (
    <div className="space-y-6 max-w-[780px] mx-auto py-2">
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight">
          Merchant Onboarding & Settings
        </h1>
        <p className="text-sm text-slate-500">
          Transform NeverShort into your business&apos;s real cash co-pilot. Connect real store parameters, define safety thresholds, and verify live integrations.
        </p>
      </div>

      <OnboardingForm
        currentName={settings.name}
        currentWhatYouSell={settings.whatYouSell}
        currentMinimumBalanceCents={settings.minimumBalanceCents}
        currentOpeningBalanceCents={150_000}
        isDemo={isDemo}
      />
    </div>
  );
}
