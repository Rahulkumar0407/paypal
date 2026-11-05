"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { Order } from "@/types";
import { formatDay } from "@/lib/shared/dates";
import { formatCents } from "@/lib/shared/money";
import { LoadBoundary } from "./LoadBoundary";
import { ORDER_STATUS_WORD, type OrderRow } from "./rows";
import { useLaptop } from "./useLaptop";

/**
 * Orders on the dashboard. Laptop: the AG Grid table (AgOrdersGrid), downloaded only when the screen is wide enough.
 * Phone: a plain list of the same orders, so AG Grid never reaches a phone (AGENTS.md section 8).
 */

const AgOrdersGrid = dynamic(() => import("./AgOrdersGrid").then((m) => m.AgOrdersGrid), {
  ssr: false,
  loading: () => <GridLoading rows={9} />,
});

/** Same height as the grid, so nothing jumps when it arrives. */
export function GridLoading({ rows }: { rows: number }) {
  return (
    <div role="status" aria-live="polite" className="rounded-[12px] bg-[#f8f9f5] p-4 ring-1 ring-ink/10">
      <p className="text-[14px] text-ink-muted">Laying out the table.</p>
      <div aria-hidden className="mt-4 space-y-3">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="h-3 rounded-full bg-ink/[0.07]" style={{ width: `${88 - (i % 3) * 14}%` }} />
        ))}
      </div>
    </div>
  );
}

/** On a phone, the newest few first; the rest one tap away. */
const PHONE_FIRST = 10;

/** Phone version of the same data: one order per row. */
export function OrdersList({ orders }: { orders: Order[] }) {
  const [all, setAll] = useState(false);
  if (orders.length === 0) return <p className="py-4 text-[15px] text-ink-muted">No orders yet. They appear as soon as someone checks out.</p>;
  const shown = all ? orders : orders.slice(0, PHONE_FIRST);
  return (
    <>
    <ul className="divide-y divide-line">
      {shown.map((o) => (
        <li key={o.id} className="flex items-baseline justify-between gap-4 py-3">
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-ink">
              #{o.number} {o.customerName}
            </p>
            <p className="text-[14px] text-ink-muted">
              {ORDER_STATUS_WORD[o.status]}, {formatDay(o.placedOn)}
            </p>
          </div>
          <p className="shrink-0 text-right text-[15px] tabular text-ink">
            {formatCents(o.netCents ?? o.totalCents)}
            {o.netCents !== null ? <span className="block text-[12px] text-ink-muted">after fee</span> : null}
          </p>
        </li>
      ))}
    </ul>
    {orders.length > PHONE_FIRST ? (
      <button
        type="button"
        onClick={() => setAll((v) => !v)}
        className="mt-3 min-h-11 w-full rounded-[10px] text-[15px] font-medium text-ink ring-1 ring-ink/15 hover:ring-ink/40"
      >
        {all ? "Show the newest 10" : `Show all ${orders.length} orders`}
      </button>
    ) : null}
    </>
  );
}

/** Laptop: the AG Grid table. If it can't load, the same orders as a plain list. */
export function OrdersTable({ rows, orders }: { rows: OrderRow[]; orders: Order[] }) {
  const laptop = useLaptop();
  if (!laptop) return <GridLoading rows={9} />;
  return (
    <LoadBoundary
      fallback={
        <div>
          <p className="mb-2 text-[14px] text-ink-muted">The table didn&apos;t load. Here are the same orders.</p>
          <OrdersList orders={orders} />
        </div>
      }
    >
      <AgOrdersGrid rows={rows} />
    </LoadBoundary>
  );
}
