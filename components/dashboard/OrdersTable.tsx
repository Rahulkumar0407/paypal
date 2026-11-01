import type { Order } from "@/types";
import { formatDay } from "@/lib/shared/dates";
import { formatCents } from "@/lib/shared/money";

/**
 * Orders and payments table placeholder (plain HTML table, styled in the design system).
 * TODO(Person 4, P4-5): replace with AG Grid Community (sorting, filtering, custom cell renderers
 * for money, status words and referee cards), loaded with dynamic import on the dashboard only.
 */

const STATUS_WORD: Record<Order["status"], string> = {
  CAPTURED: "Paid",
  PENDING: "Waiting for capture",
  ABANDONED: "Abandoned checkout",
  FAILED: "Payment failed",
  REFUNDED: "Refunded",
};

/** Phone version of the same data: one order per row. */
export function OrdersList({ orders }: { orders: Order[] }) {
  return (
    <ul className="divide-y divide-line">
      {orders.map((o) => (
        <li key={o.id} className="flex items-baseline justify-between gap-4 py-3">
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-ink">
              #{o.number} {o.customerName}
            </p>
            <p className="text-[14px] text-ink-muted">
              {STATUS_WORD[o.status]}, {formatDay(o.placedOn)}
            </p>
          </div>
          <p className="shrink-0 text-right text-[15px] tabular text-ink">
            {formatCents(o.netCents ?? o.totalCents)}
            {o.netCents !== null ? <span className="block text-[12px] text-ink-muted">after fee</span> : null}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function OrdersTable({ orders }: { orders: Order[] }) {
  return (
    <div className="overflow-x-auto rounded-tile ring-1 ring-line ring-inset">
      <table className="w-full min-w-[720px] border-collapse text-left text-[14px] [&_td]:whitespace-nowrap [&_th]:whitespace-nowrap">
        <caption className="sr-only">Recent orders, newest first</caption>
        <thead>
          <tr className="border-b border-line bg-surface text-ink-muted">
            <th scope="col" className="px-4 py-3 font-medium">Order</th>
            <th scope="col" className="px-4 py-3 font-medium">Buyer</th>
            <th scope="col" className="px-4 py-3 font-medium">Placed</th>
            <th scope="col" className="px-4 py-3 font-medium">Status</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">Total</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">PayPal fee</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">Arrived</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b border-line last:border-b-0">
              <td className="px-4 py-3 tabular text-ink">#{o.number}</td>
              <td className="px-4 py-3 text-ink">{o.customerName}</td>
              <td className="px-4 py-3 text-ink-muted">{formatDay(o.placedOn)}</td>
              <td className="px-4 py-3 text-ink">
                {STATUS_WORD[o.status]}
                {o.failedAttempts > 1 ? <span className="text-ink-muted">, {o.failedAttempts} attempts</span> : null}
              </td>
              <td className="px-4 py-3 text-right tabular text-ink">{formatCents(o.totalCents)}</td>
              <td className="px-4 py-3 text-right tabular text-ink-muted">{o.feeCents === null ? "" : formatCents(o.feeCents)}</td>
              <td className="px-4 py-3 text-right tabular text-ink">{o.netCents === null ? "" : formatCents(o.netCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
