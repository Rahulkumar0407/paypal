"use client";

import { useState } from "react";
import type { DayState } from "@/types";
import { EmptyState } from "@/components/ui/States";
import { DAY_FILL } from "@/components/ui/meaning";
import type { DueWithState } from "./due-state";
import { UpcomingDues } from "./UpcomingDues";

type Filter = "all" | DayState;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "covered", label: "Covered" },
  { id: "tight", label: "Tight" },
  { id: "short", label: "Short" },
];

const EMPTY: Record<Filter, { title: string; body: string }> = {
  all: { title: "Nothing due in the next 30 days.", body: "Bills and supplier orders show up here as soon as they're found in your payments." },
  covered: { title: "Nothing is fully covered yet.", body: "Every payment in the next 30 days is tight or short. Today shows ways to fix it." },
  tight: { title: "Nothing tight in the next 30 days.", body: "No payment leaves you just above your minimum." },
  short: { title: "Nothing short in the next 30 days.", body: "Every payment has the money ready on the day." },
};

/** The dues list with a Covered / Tight / Short filter. */
export function DuesFilter({ items }: { items: DueWithState[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const count = (f: Filter) => (f === "all" ? items.length : items.filter((i) => i.state === f).length);
  const shown = filter === "all" ? items : items.filter((i) => i.state === filter);

  return (
    <div>
      <div role="group" aria-label="Show payments that are" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = f.id === filter;
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(f.id)}
              className={`inline-flex min-h-10 items-center gap-2 rounded-full px-3.5 text-[14px] ${
                active ? "bg-ink font-semibold text-white" : "bg-paper text-ink ring-1 ring-line ring-inset hover:bg-surface"
              }`}
            >
              {f.id !== "all" ? <span aria-hidden className={`inline-block size-2 rounded-[2px] ${DAY_FILL[f.id]}`} /> : null}
              {f.label}
              <span className={`tabular ${active ? "text-white/80" : "text-ink-muted"}`}>{count(f.id)}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-2" aria-live="polite">
        {shown.length > 0 ? (
          <UpcomingDues items={shown} />
        ) : (
          <div className="mt-4">
            <EmptyState title={EMPTY[filter].title} body={EMPTY[filter].body} />
          </div>
        )}
      </div>
    </div>
  );
}
