import type { Metadata } from "next";
import { Card, PageSentence, RefereeCard } from "@/components/ui";
import { ForecastChart } from "@/components/charts/ForecastChart";
import { DuesList, DuesTable } from "@/components/dashboard/DuesTable";
import { OrdersList, OrdersTable } from "@/components/dashboard/OrdersTable";
import { dueRows, orderRows } from "@/components/dashboard/rows";
import { getVisitorStoreId } from "@/lib/demo";
import { getDues, getForecast } from "@/lib/forecast";
import { listReceipts } from "@/lib/guard";
import { listRiskFlags } from "@/lib/risk";
import { listRecentOrders } from "@/lib/store";
import { formatDay } from "@/lib/shared/dates";
import { formatCents, formatDollars } from "@/lib/shared/money";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * The laptop dashboard (P2-5): the forecast as an AG Chart, every recent order and every payment due in AG Grid
 * tables, and the orders worth a second look. Phones get plain lists of the same data: AG Grid and AG Charts are
 * downloaded only on a wide screen.
 */
export default async function DashboardPage() {
  const storeId = await getVisitorStoreId();
  const [forecast, orders, flags, receipts, dues] = await Promise.all([
    getForecast(storeId),
    listRecentOrders(storeId, 50),
    listRiskFlags(storeId),
    listReceipts(storeId),
    getDues(storeId),
  ]);
  const rows = orderRows(orders, flags, receipts);
  // The same 14 days as the forecast: "ready on the day" is only worked out inside it.
  const lastDay = forecast.days[forecast.days.length - 1]!.date;
  const duesRows = dueRows(dues.filter((d) => d.dueOn <= lastDay));
  const lowest = forecast.days.reduce((a, d) => (d.closingCents < a.closingCents ? d : a), forecast.days[0]!);
  // One card per order, with every reason it was flagged.
  const flagged = [...Map.groupBy(flags, (f) => f.orderId).values()].map((fs) => ({
    orderId: fs[0]!.orderId,
    orderNumber: fs[0]!.orderNumber,
    amountCents: fs[0]!.amountCents,
    held: fs.some((f) => f.held),
    details: [...new Set(fs.map((f) => f.detail))],
  }));
  const arrived = orders.reduce((s, o) => s + (o.netCents ?? 0), 0);
  const fees = orders.reduce((s, o) => s + (o.feeCents ?? 0), 0);

  return (
    <div className="space-y-10">
      <PageSentence>Two weeks ahead, every recent order, and every payment due.</PageSentence>

      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h2 className="text-[20px] leading-7 font-semibold text-ink">Balance forecast</h2>
          <p className="text-[15px] text-ink-muted">
            Lowest: {formatDay(lowest.date)}, {formatDollars(lowest.closingCents)}. Your minimum is{" "}
            {formatDollars(forecast.minimumBalanceCents)}.
          </p>
        </div>
        <div className="mt-4">
          <ForecastChart forecast={forecast} />
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h2 id="orders-title" className="text-[20px] leading-7 font-semibold text-ink">
            Orders and payments
          </h2>
          <p className="text-[15px] text-ink-muted tabular">
            {formatCents(arrived)} arrived after {formatCents(fees)} in PayPal fees
          </p>
        </div>
        <div className="hidden md:block">
          <OrdersTable rows={rows} orders={orders} />
        </div>
        <div className="md:hidden">
          <OrdersList orders={orders} />
        </div>
      </Card>

      <div className="grid gap-10 2xl:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
        <Card>
          <h2 className="mb-4 text-[20px] leading-7 font-semibold text-ink">Money out, next 14 days</h2>
          <div className="hidden md:block">
            <DuesTable rows={duesRows} />
          </div>
          <div className="md:hidden">
            <DuesList rows={duesRows} />
          </div>
        </Card>

        <section aria-labelledby="risk-title">
          <h2 id="risk-title" className="mb-3 text-[20px] leading-7 font-semibold text-ink">
            Worth a second look
          </h2>
          {flagged.length === 0 ? (
            <Card tone="outline">
              <p className="text-[15px] leading-6 text-ink-muted">No risky orders right now.</p>
            </Card>
          ) : (
            <ul className="space-y-3">
              {flagged.map((f) => (
                <li key={f.orderId}>
                  <Card tone="outline">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-[16px] font-semibold text-ink">Order #{f.orderNumber}</p>
                      <p className="tabular text-[15px] text-ink">{formatCents(f.amountCents)}</p>
                    </div>
                    <ul className="mt-1 space-y-0.5">
                      {f.details.map((d) => (
                        <li key={d} className="text-[15px] leading-6 text-ink-muted">
                          {d}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-[14px] text-ink">
                      {f.held ? (
                        <span className="inline-flex items-center gap-2 align-middle text-[13px] font-medium text-ink"><span aria-hidden className="inline-block size-2.5 rounded-[3px] border border-ink/60" />Held: not counted in your forecast</span>
                      ) : (
                        <RefereeCard decision="ESCALATE" size="sm" label="Hold waiting for your OK" />
                      )}
                    </p>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
