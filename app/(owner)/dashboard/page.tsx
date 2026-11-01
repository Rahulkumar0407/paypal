import type { Metadata } from "next";
import { Card, PageSentence, RefereeCard } from "@/components/ui";
import { ForecastChart } from "@/components/charts/ForecastChart";
import { OrdersList, OrdersTable } from "@/components/dashboard/OrdersTable";
import { getVisitorStoreId } from "@/lib/demo";
import { getForecast } from "@/lib/forecast";
import { listRiskFlags } from "@/lib/risk";
import { listRecentOrders } from "@/lib/store";
import { formatCents } from "@/lib/shared/money";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const storeId = await getVisitorStoreId();
  const [forecast, orders, flags] = await Promise.all([getForecast(storeId), listRecentOrders(storeId, 12), listRiskFlags(storeId)]);

  return (
    <div className="space-y-12">
      <PageSentence>Two weeks ahead, the last twelve orders, and the ones worth a second look.</PageSentence>

      <Card>
        <h2 className="text-[20px] leading-7 font-semibold text-ink">Balance forecast</h2>
        <p className="mb-4 text-[15px] text-ink-muted">Closing balance each day against your minimum.</p>
        <ForecastChart forecast={forecast} />
      </Card>

      <div className="grid gap-12 2xl:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
        <section aria-labelledby="orders-title" className="rounded-card bg-paper p-5 ring-1 ring-ink/[0.06] lg:p-6">
          <h2 id="orders-title" className="mb-3 text-[20px] leading-7 font-semibold text-ink">
            Recent orders
          </h2>
          <div className="hidden md:block">
            <OrdersTable orders={orders} />
          </div>
          <div className="md:hidden">
            <OrdersList orders={orders} />
          </div>
        </section>

        <section aria-labelledby="risk-title">
          <h2 id="risk-title" className="mb-3 text-[20px] leading-7 font-semibold text-ink">
            Worth a second look
          </h2>
          <ul className="space-y-3">
            {flags.map((f) => (
              <li key={f.id}>
                <Card tone="outline">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[16px] font-semibold text-ink">Order #{f.orderNumber}</p>
                    <p className="tabular text-[15px] text-ink">{formatCents(f.amountCents)}</p>
                  </div>
                  <p className="mt-1 text-[15px] leading-6 text-ink-muted">{f.detail}</p>
                  <p className="mt-3 text-[14px] text-ink">
                    {f.held ? (
                      <RefereeCard decision="APPROVE" size="sm" label="Held, not counted as expected money" />
                    ) : (
                      <RefereeCard decision="ESCALATE" size="sm" label="Hold waiting for your OK" />
                    )}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
