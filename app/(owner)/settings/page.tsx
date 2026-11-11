import type { Metadata } from "next";
import type { Forecast, StoreSettings } from "@/types";
import { Card, CardTitle, ErrorState, PageSentence } from "@/components/ui";
import { DAY_FILL } from "@/components/ui/meaning";
import { SettingsForm } from "@/components/app/SettingsForm";
import { getVisitorStoreId } from "@/lib/demo";
import { getForecast } from "@/lib/forecast";
import { getStoreSettings } from "@/lib/store";
import { formatDay } from "@/lib/shared/dates";
import { formatDollars, formatShortfall } from "@/lib/shared/money";
import { checkSettings } from "./actions";

export const metadata: Metadata = { title: "Settings" };

async function load(): Promise<{ settings: StoreSettings; forecast: Forecast | null } | null> {
  const storeId = await getVisitorStoreId();
  try {
    const [settings, forecast] = await Promise.all([getStoreSettings(storeId), getForecast(storeId).catch(() => null)]);
    return { settings, forecast };
  } catch (error) {
    console.error("[settings] could not load:", error instanceof Error ? error.message : error);
    return null;
  }
}

/** The short setup form, with a card that shows what the safety line means for the next 30 days. */
export default async function SettingsPage() {
  const data = await load();
  if (!data) {
    return (
      <div className="space-y-8">
        <PageSentence>A few answers about your shop.</PageSentence>
        <ErrorState title="Couldn't load your answers." body="Nothing has changed. Try again in a minute." retryHref="/settings" />
      </div>
    );
  }

  const { settings, forecast } = data;
  return (
    <div className="space-y-10">
      <PageSentence>A few answers about {settings.name}, so the forecast fits the shop.</PageSentence>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:items-start lg:gap-12">
        <SettingsForm settings={settings} action={checkSettings} />
        <aside className="space-y-5 lg:sticky lg:top-8">
          <SafetyLine settings={settings} forecast={forecast} />
        </aside>
      </div>
    </div>
  );
}

function SafetyLine({ settings, forecast }: { settings: StoreSettings; forecast: Forecast | null }) {
  const min = formatDollars(settings.minimumBalanceCents);
  const tightUpTo = formatDollars(settings.minimumBalanceCents + settings.tightMarginCents);
  const gap = forecast?.firstShortfall ?? null;
  const counts = forecast
    ? (["covered", "tight", "short"] as const).map((s) => [s, forecast.days.filter((d) => d.state === s).length] as const)
    : [];

  return (
    <Card>
      <CardTitle>What this means right now</CardTitle>
      <ul className="mt-3 space-y-2 text-[15px] leading-6 text-ink">
        <Line state="short">Below {min}: short</Line>
        <Line state="tight">
          {min} to {tightUpTo}: tight
        </Line>
        <Line state="covered">Above {tightUpTo}: covered</Line>
      </ul>
      {forecast ? (
        <p className="mt-4 border-t border-line pt-4 text-[15px] leading-6 text-ink-muted">
          Over the next 30 days that gives {counts.map(([s, n]) => `${n} ${s}`).join(", ")}.
          {gap ? ` The first short day is ${formatDay(gap.date)}, ${formatShortfall(gap.amountCents)} under your minimum.` : ""}
        </p>
      ) : null}
    </Card>
  );
}

function Line({ state, children }: { state: "covered" | "tight" | "short"; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2.5">
      <span aria-hidden className={`inline-block size-2.5 shrink-0 rounded-[3px] ${DAY_FILL[state]}`} />
      <span className="tabular">{children}</span>
    </li>
  );
}
