import type { Forecast } from "@/types";
import { ForecastChart } from "@/components/charts/ForecastChart";

/**
 * The home screen's place for the forecast chart.
 * Modern fintech presentation with clean borders, subtle shadows, and crisp typography.
 */
export function ChartSlot({ forecast }: { forecast: Forecast }) {
  return (
    <section
      aria-labelledby="chart-title"
      className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 id="chart-title" className="text-lg font-semibold text-slate-900 tracking-tight">
            14-Day Closing Balance Curve
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Projected daily balance against your target minimum threshold.
          </p>
        </div>
      </div>
      <ForecastChart forecast={forecast} />
    </section>
  );
}
