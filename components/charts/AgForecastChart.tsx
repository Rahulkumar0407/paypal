"use client";

import { useMemo } from "react";
import { AllCommunityModule, ModuleRegistry, type AgCartesianChartOptions } from "ag-charts-community";
import { AgCharts } from "ag-charts-react";
import type { DayState, Forecast } from "@/types";
import { DAY_WORD } from "@/components/ui/meaning";
import { dayOfMonth, formatDay, weekdayShort } from "@/lib/shared/dates";
import { formatDollars, formatShortfall } from "@/lib/shared/money";

/**
 * The 14-day forecast as an AG Charts Community column chart: one column per day, coloured like the day tickets
 * (covered, tight, short), the owner's minimum as a dashed line, the short day banded and labelled. Labelled axes and
 * a tooltip with each day's money in and out. Loaded only on a laptop (ForecastChart).
 */
ModuleRegistry.registerModules([AllCommunityModule]);

const INK = "#14201b";
const MUTED = "#56605b";
const FILL: Record<DayState, string> = { covered: "#1e9e5e", tight: "#f2a93b", short: "#e5484d" };

interface Point {
  day: string;
  long: string;
  closing: number;
  state: DayState;
  inCents: number;
  outCents: number;
  shortBy: number;
  dues: string;
}

export function AgForecastChart({ forecast }: { forecast: Forecast }) {
  const options = useMemo<AgCartesianChartOptions<Point>>(() => {
    const font = typeof window === "undefined" ? "Inter" : getComputedStyle(document.body).fontFamily;
    const data: Point[] = forecast.days.map((d) => ({
      day: d.isToday ? "Today" : `${weekdayShort(d.date)} ${dayOfMonth(d.date)}`,
      long: formatDay(d.date),
      closing: d.closingCents,
      state: d.state,
      inCents: d.expectedInCents,
      outCents: d.knownOutCents,
      shortBy: d.shortByCents,
      dues: d.dues.map((x) => x.payeeName).join(", "),
    }));
    const short = data.find((p) => p.state === "short");
    return {
      data,
      background: { visible: false },
      padding: { top: 28, right: 96, bottom: 4, left: 4 },
      legend: { enabled: false },
      series: [
        {
          type: "bar",
          xKey: "day",
          yKey: "closing",
          yName: "Closing balance",
          cornerRadius: 5,
          itemStyler: ({ datum }) => ({ fill: FILL[datum.state], stroke: datum.state === "short" ? INK : FILL[datum.state], strokeWidth: datum.state === "short" ? 1.5 : 0 }),
          label: {
            enabled: true,
            placement: "outside-end",
            fontFamily: font,
            fontSize: 13,
            fontWeight: 700,
            color: INK,
            formatter: ({ datum }) => (datum.state === "short" ? `${formatShortfall(datum.shortBy)} short` : ""),
          },
          tooltip: {
            renderer: ({ datum }) => ({
              heading: datum.long,
              title: `${DAY_WORD[datum.state]}: ${formatDollars(datum.closing)} at the end of the day`,
              data: [
                { label: "Money in (after fees)", value: `+${formatDollars(datum.inCents)}` },
                { label: "Money out", value: datum.outCents > 0 ? `−${formatDollars(datum.outCents)}${datum.dues ? ` (${datum.dues})` : ""}` : "nothing due" },
                ...(datum.shortBy > 0 ? [{ label: "Short by", value: formatShortfall(datum.shortBy) }] : []),
              ],
            }),
          },
        },
      ],
      axes: {
        x: {
          type: "category",
          position: "bottom",
          title: { text: "Next 14 days", fontFamily: font, fontSize: 13, color: MUTED },
          label: { fontFamily: font, fontSize: 12, color: MUTED },
          line: { stroke: "rgb(20 32 27 / 0.25)" },
          crossLines: short
            ? [
                {
                  type: "range",
                  range: [short.day, short.day],
                  fill: FILL.short,
                  fillOpacity: 0.1,
                  strokeWidth: 0,
                  label: { text: "Short", position: "top", fontFamily: font, fontSize: 12, fontWeight: 700, color: INK },
                },
              ]
            : [],
        },
        y: {
          type: "number",
          position: "left",
          title: { text: "Closing balance", fontFamily: font, fontSize: 13, color: MUTED },
          label: { fontFamily: font, fontSize: 12, color: MUTED, formatter: ({ value }) => formatDollars(Number(value)) },
          gridLine: { style: [{ stroke: "rgb(20 32 27 / 0.08)", lineDash: [] }] },
          crossLines: [
            {
              type: "line",
              value: forecast.minimumBalanceCents,
              stroke: INK,
              strokeWidth: 1.5,
              lineDash: [6, 5],
              label: { text: `Minimum, ${formatDollars(forecast.minimumBalanceCents)}`, position: "right", fontFamily: font, fontSize: 12, fontWeight: 600, color: INK },
            },
          ],
        },
      },
    };
  }, [forecast]);

  return (
    <figure>
      <div className="h-[340px]">
        <AgCharts options={options} style={{ height: "100%" }} />
      </div>
      <figcaption className="sr-only">
        {forecast.firstShortfall
          ? `Closing balance for the next 14 days. It drops below your ${formatDollars(forecast.minimumBalanceCents)} minimum on ${formatDay(forecast.firstShortfall.date)}, ${formatShortfall(forecast.firstShortfall.amountCents)} short.`
          : `Closing balance for the next 14 days. It stays above your ${formatDollars(forecast.minimumBalanceCents)} minimum.`}
      </figcaption>
    </figure>
  );
}
