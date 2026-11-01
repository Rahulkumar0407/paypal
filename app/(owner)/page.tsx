import { BanknotePanel, Card, CardTitle, MoneyStrip, HeadlineSentence, ButtonLink, NOTE_ROOM } from "@/components/ui";
import { FixOptions } from "@/components/app/FixOptions";
import { MoneyCalendar } from "@/components/app/MoneyCalendar";
import { getVisitorStoreId } from "@/lib/demo";
import { buildHeadline, getFixOptions, getForecast } from "@/lib/forecast";
import { findRecoveryCandidates } from "@/lib/recovery";
import { getAlerts } from "@/lib/risk";
import { formatDay } from "@/lib/shared/dates";
import { formatDollars } from "@/lib/shared/money";

const CONFIDENCE_WORD = { high: "High confidence", medium: "Medium confidence", low: "Low confidence" } as const;

/** Home: the money forecast, read like the weather, and the money calendar. */
export default async function HomePage() {
  const storeId = await getVisitorStoreId();
  const [forecast, fixes, candidates, alerts] = await Promise.all([
    getForecast(storeId),
    getFixOptions(storeId),
    findRecoveryCandidates(storeId),
    getAlerts(storeId),
  ]);
  const headline = buildHeadline(forecast);
  const recoverable = candidates.find((c) => c.contactConsent && c.remindersSentLast48h === 0);

  return (
    <div className="space-y-12 lg:space-y-16">
      <BanknotePanel className="-mx-5 -mt-6 px-14 pt-24 pb-28 lg:-mx-12 lg:-mt-12 lg:px-24 lg:pt-[140px] lg:pb-[200px]">
        <div className="space-y-8 lg:space-y-10">
          <div className={NOTE_ROOM}>
            <HeadlineSentence headline={headline} inverse />
          </div>
          {/* Inside the note the strip scrolls within the frame, not edge to edge. */}
          <div className="[&_ol]:mx-0 [&_ol]:px-0">
            <MoneyStrip days={forecast.days} caption={false} inverse />
            <p className="mt-3 max-w-[70ch] text-[13px] leading-5 text-white/75">
              Balance at the end of each day, after expected sales and known payments. {CONFIDENCE_WORD[forecast.confidence]}:{" "}
              {forecast.confidenceReason.charAt(0).toLowerCase() + forecast.confidenceReason.slice(1)}
            </p>
          </div>
        </div>
      </BanknotePanel>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14">
        <aside className="space-y-5 lg:col-start-2 lg:row-start-1">
          {forecast.firstShortfall && fixes.length > 0 ? (
            <Card>
              <CardTitle>
                {fixes.length === 3 ? "Three" : fixes.length === 2 ? "Two" : "One"} ways to cover {formatDay(forecast.firstShortfall.date)}
              </CardTitle>
              <p className="mt-1 mb-4 text-[15px] leading-6 text-ink-muted">Pick one. The Margin Guard checks it before anything moves.</p>
              <FixOptions fixes={fixes} />
            </Card>
          ) : null}

          {recoverable ? (
            <Card>
              <p className="text-[13px] text-ink-muted">Found in abandoned checkouts</p>
              <p className="mt-1 text-[17px] leading-6 text-ink">
                {recoverable.customerName} left {formatDollars(recoverable.amountCents)} in the cart on {formatDay(recoverable.lastActivityOn)}. A
                reminder with a fresh PayPal link is ready for the Guard.
              </p>
              <div className="mt-4">
                <ButtonLink href="/approvals" variant="secondary">
                  See the reminder
                </ButtonLink>
              </div>
            </Card>
          ) : null}

          {alerts.map((alert) => (
            <Card key={alert.id} tone="outline">
              <p className="text-[16px] leading-6 font-semibold text-ink">{alert.title}</p>
              <p className="mt-1 text-[15px] leading-6 text-ink-muted">{alert.detail}</p>
            </Card>
          ))}
        </aside>

        <section aria-labelledby="calendar-title" className="lg:col-start-1 lg:row-start-1">
          <h2 id="calendar-title" className="text-[20px] leading-7 font-semibold text-ink">
            Money calendar
          </h2>
          <p className="text-[15px] text-ink-muted">Money in and money out for the next two weeks.</p>
          <div className="mt-2">
            <MoneyCalendar days={forecast.days} />
          </div>
        </section>
      </div>
    </div>
  );
}
