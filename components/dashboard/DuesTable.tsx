"use client";

import dynamic from "next/dynamic";
import { formatDollars, formatShortfall } from "@/lib/shared/money";
import { LoadBoundary } from "./LoadBoundary";
import { GridLoading } from "./OrdersTable";
import type { DueRow } from "./rows";
import { useLaptop } from "./useLaptop";

/**
 * Money out over the next 30 days. Laptop: the AG Grid table with ready meters (AgDuesGrid), downloaded only on a wide
 * screen. Phone: a plain list.
 */

const AgDuesGrid = dynamic(() => import("./AgDuesGrid").then((m) => m.AgDuesGrid), {
  ssr: false,
  loading: () => <GridLoading rows={5} />,
});

export function DuesList({ rows }: { rows: DueRow[] }) {
  if (rows.length === 0) return <p className="py-4 text-[15px] text-ink-muted">Nothing to pay in the next 30 days.</p>;
  return (
    <ul className="divide-y divide-line">
      {rows.map((d) => {
        const short = Math.max(0, d.amountCents - d.readyCents);
        return (
          <li key={d.id} className="flex items-baseline justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-ink">{d.payee}</p>
              <p className="text-[14px] text-ink-muted">
                {d.dueLabel} · {d.what}
              </p>
            </div>
            <p className="shrink-0 text-right text-[15px] tabular text-ink">
              {formatDollars(d.amountCents)}
              <span className="flex items-center justify-end gap-1.5 text-[12px] text-ink-muted">
                <span aria-hidden className={`inline-block size-2 rounded-[2px] ${short > 0 ? "bg-red" : "bg-green"}`} />
                {short > 0 ? `${formatShortfall(short)} short` : "Ready"}
              </span>
            </p>
          </li>
        );
      })}
    </ul>
  );
}

export function DuesTable({ rows }: { rows: DueRow[] }) {
  const laptop = useLaptop();
  if (!laptop) return <GridLoading rows={5} />;
  return (
    <LoadBoundary
      fallback={
        <div>
          <p className="mb-2 text-[14px] text-ink-muted">The table didn&apos;t load. Here are the same payments.</p>
          <DuesList rows={rows} />
        </div>
      }
    >
      <AgDuesGrid rows={rows} />
    </LoadBoundary>
  );
}
