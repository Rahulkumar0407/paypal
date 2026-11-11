import type { Forecast } from "@/types";
import { dayOfMonth, formatDay, weekdayShort } from "@/lib/shared/dates";
import { formatDollars, formatShortfall } from "@/lib/shared/money";

/**
 * The forecast as a light, labelled SVG line: the phone version, and what shows while the AG Chart loads or if it fails.
 */
export function ForecastChartSvg({ forecast }: { forecast: Forecast }) {
  const W = 720;
  const H = 300;
  const pad = { left: 64, right: 20, top: 40, bottom: 36 };
  const values = forecast.days.map((d) => d.closingCents);
  const top = Math.ceil(Math.max(...values, forecast.minimumBalanceCents) / 50_000) * 50_000;
  const bottom = Math.min(0, Math.floor(Math.min(...values) / 50_000) * 50_000);
  const x = (i: number) => pad.left + (i * (W - pad.left - pad.right)) / (forecast.days.length - 1);
  const y = (c: number) => pad.top + ((top - c) * (H - pad.top - pad.bottom)) / (top - bottom);
  const ticks: number[] = [];
  for (let t = bottom; t <= top; t += 50_000) ticks.push(t);
  const path = forecast.days.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.closingCents).toFixed(1)}`).join(" ");
  const gap = forecast.firstShortfall;
  const gapIndex = gap ? forecast.days.findIndex((d) => d.date === gap.date) : -1;

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby="fc-title fc-desc" className="h-auto w-full">
        <title id="fc-title">Closing balance for the next 30 days</title>
        <desc id="fc-desc">
          {gap
            ? `The balance dips below your ${formatDollars(forecast.minimumBalanceCents)} minimum on ${formatDay(gap.date)}, ${formatShortfall(gap.amountCents)} short.`
            : `The balance stays above your ${formatDollars(forecast.minimumBalanceCents)} minimum.`}
        </desc>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={W - pad.right} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeWidth={1} />
            <text x={pad.left - 10} y={y(t) + 4} textAnchor="end" fontSize={12} fill="var(--color-ink-muted)">
              {formatDollars(t)}
            </text>
          </g>
        ))}
        <line
          x1={pad.left}
          x2={W - pad.right}
          y1={y(forecast.minimumBalanceCents)}
          y2={y(forecast.minimumBalanceCents)}
          stroke="var(--color-ink)"
          strokeDasharray="5 5"
          strokeWidth={1.25}
        />
        <text x={W - pad.right} y={y(forecast.minimumBalanceCents) - 7} textAnchor="end" fontSize={12} fill="var(--color-ink)">
          Your minimum, {formatDollars(forecast.minimumBalanceCents)}
        </text>
        <path d={path} fill="none" stroke="var(--color-brand)" strokeWidth={2.5} strokeLinejoin="round" />
        {forecast.days.map((d, i) => (
          <circle key={d.date} cx={x(i)} cy={y(d.closingCents)} r={3} fill="var(--color-brand)" />
        ))}
        {gap && gapIndex >= 0 ? (
          <g>
            <circle cx={x(gapIndex)} cy={y(forecast.days[gapIndex]!.closingCents)} r={7} fill="var(--color-red)" stroke="var(--color-paper)" strokeWidth={2} />
            <text x={x(gapIndex) + 12} y={y(forecast.minimumBalanceCents) - 30} textAnchor="start" fontSize={13} fontWeight={600} fill="var(--color-ink)">
              {formatShortfall(gap.amountCents)} short
            </text>
          </g>
        ) : null}
        {forecast.days.map((d, i) =>
          i % 2 === 0 ? (
            <text key={d.date} x={x(i)} y={H - pad.bottom + 24} textAnchor="middle" fontSize={12} fill="var(--color-ink-muted)">
              {weekdayShort(d.date)} {dayOfMonth(d.date)}
            </text>
          ) : null,
        )}
        <text x={4} y={16} textAnchor="start" fontSize={12} fill="var(--color-ink-muted)">
          Closing balance
        </text>
      </svg>
    </figure>
  );
}
