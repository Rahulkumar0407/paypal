import type { Forecast } from "@/types";
import { ForecastChart } from "@/components/charts/ForecastChart";

/**
 * The home screen's place for the forecast chart. Person 4 builds the chart in components/charts (AG Charts);
 * until then their labelled placeholder shows here, so the real chart drops in without touching this page.
 */
export function ChartSlot({ forecast }: { forecast: Forecast }) {
  return (
    <section aria-labelledby="chart-title" className="rounded-card bg-paper p-5 ring-1 ring-ink/[0.06] lg:p-6">
      <h2 id="chart-title" className="text-[20px] leading-7 font-semibold text-ink">
        Balance, next 14 days
      </h2>
      <p className="mb-4 text-[15px] text-ink-muted">Each day&apos;s closing balance against your minimum.</p>
      <ForecastChart forecast={forecast} />
    </section>
  );
}
