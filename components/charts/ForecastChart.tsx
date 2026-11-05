"use client";

import dynamic from "next/dynamic";
import type { Forecast } from "@/types";
import { LoadBoundary } from "@/components/dashboard/LoadBoundary";
import { useLaptop } from "@/components/dashboard/useLaptop";
import { ForecastChartSvg } from "./ForecastChartSvg";

/**
 * The forecast chart. Laptop: the AG Charts version (AgForecastChart), downloaded only when the screen is wide
 * enough. Phone, while it loads, or if it fails: the light SVG version of the same numbers.
 */

const AgForecastChart = dynamic(() => import("./AgForecastChart").then((m) => m.AgForecastChart), {
  ssr: false,
  loading: () => <div className="h-[340px]" role="status" aria-label="Drawing the chart" />,
});

export function ForecastChart({ forecast }: { forecast: Forecast }) {
  const laptop = useLaptop();
  if (!laptop) return <ForecastChartSvg forecast={forecast} />;
  return (
    <LoadBoundary fallback={<ForecastChartSvg forecast={forecast} />}>
      <AgForecastChart forecast={forecast} />
    </LoadBoundary>
  );
}
