"use client";

import { useState } from "react";
import type { ForecastDay } from "@/types";
import { dayOfMonth, formatDay, weekdayShort } from "@/lib/shared/dates";
import { formatDollars, formatShortfall } from "@/lib/shared/money";

export function UnifiedForecastChart({
  days,
  minimumBalanceCents,
  initialDate,
}: {
  days: ForecastDay[];
  minimumBalanceCents: number;
  initialDate: string;
}) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const selectedDay = days.find((d) => d.date === selectedDate) ?? days[0]!;

  const maxBalance = Math.max(...days.map((d) => d.closingCents), minimumBalanceCents * 1.5, 300_000);
  const minThresholdPct = Math.round((minimumBalanceCents / maxBalance) * 100);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-xs space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-900 tracking-tight">
            14-Day Projected Cash Flow
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tap any day to inspect anticipated revenue and scheduled payments.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span>Covered</span>
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
            <span>Below Reserve</span>
          </span>
        </div>
      </div>

      {/* ── Interactive 14-Day Trajectory Bars ── */}
      <div className="relative pt-6 pb-2 overflow-x-auto [scrollbar-width:none]">
        {/* Minimum reserve threshold line */}
        <div
          className="absolute inset-x-0 min-w-[740px] sm:min-w-0 border-b border-dashed border-slate-300 pointer-events-none z-0"
          style={{ bottom: `calc(${Math.min(85, Math.max(15, minThresholdPct))}% + 32px)` }}
        >
          <span className="absolute right-0 -top-4 text-[10px] font-mono text-slate-400 bg-white/90 px-1">
            Reserve: {formatDollars(minimumBalanceCents)}
          </span>
        </div>

        <div className="flex min-w-[740px] sm:min-w-0 sm:grid sm:grid-cols-14 gap-1.5 sm:gap-2 items-end h-[160px] relative z-10">
          {days.map((d) => {
            const isSelected = d.date === selectedDate;
            const isShort = d.state === "short";
            const heightPct = Math.max(12, Math.min(100, Math.round((d.closingCents / maxBalance) * 100)));

            return (
              <button
                key={d.date}
                type="button"
                onClick={() => setSelectedDate(d.date)}
                className={`group flex-1 shrink-0 w-[50px] sm:w-auto flex flex-col items-center justify-end h-full p-1 rounded-xl transition-all ${
                  isSelected
                    ? "bg-slate-100 ring-2 ring-slate-900"
                    : "hover:bg-slate-50"
                }`}
              >
                {/* Balance bar */}
                <div className="w-full flex items-end justify-center h-[100px]">
                  <div
                    className={`w-full max-w-[20px] rounded-t-md transition-all ${
                      isShort
                        ? "bg-rose-500 group-hover:bg-rose-600"
                        : "bg-emerald-500 group-hover:bg-emerald-600"
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>

                {/* Day label */}
                <div className="mt-2 text-center w-full">
                  <span className="block text-[10px] text-slate-500 uppercase font-medium leading-none">
                    {d.isToday ? "Today" : weekdayShort(d.date)}
                  </span>
                  <span
                    className={`block text-xs font-semibold leading-tight mt-0.5 ${
                      isSelected ? "text-slate-900" : "text-slate-700"
                    }`}
                  >
                    {dayOfMonth(d.date)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Selected Day Breakdown (Compact & Clear) ── */}
      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">
              {selectedDay.isToday ? `Today (${formatDay(selectedDay.date)})` : formatDay(selectedDay.date)}
            </h3>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                selectedDay.state === "short"
                  ? "bg-rose-100 text-rose-800"
                  : selectedDay.state === "tight"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {selectedDay.state === "short"
                ? `${formatShortfall(selectedDay.shortByCents)} below reserve`
                : "Reserve covered"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Expected closing balance: <strong className="text-slate-900 font-semibold">{formatDollars(selectedDay.closingCents)}</strong>
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-4 text-xs font-mono text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/70">
          <div>
            <span className="text-slate-400 block text-[10px]">Opening</span>
            <span className="font-semibold text-slate-800">{formatDollars(selectedDay.openingCents)}</span>
          </div>
          <span className="text-slate-300">•</span>
          <div>
            <span className="text-slate-400 block text-[10px]">In (Sales)</span>
            <span className="font-semibold text-emerald-700">+{formatDollars(selectedDay.expectedInCents)}</span>
          </div>
          <span className="text-slate-300">•</span>
          <div>
            <span className="text-slate-400 block text-[10px]">Out (Bills)</span>
            <span className="font-semibold text-slate-800">−{formatDollars(selectedDay.knownOutCents)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
