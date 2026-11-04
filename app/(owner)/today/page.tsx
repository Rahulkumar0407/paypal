import { Suspense } from "react";
import type { Forecast, FixOption, RecoveryCandidate, Alert, RecurringPayee, Due } from "@/types";
import { BanknotePanel, ButtonLink, Card, CardTitle, EmptyState, HeadlineSentence, NOTE_ROOM, StatusChip } from "@/components/ui";
import { ChartSlot } from "@/components/app/ChartSlot";
import { DetectedPayees } from "@/components/app/DetectedPayees";
import { ExplainedPayees } from "@/components/app/ExplainedPayees";
import { ShortfallNote } from "@/components/app/ShortfallNote";
import { FixOptions } from "@/components/app/FixOptions";
import { ForecastStrip } from "@/components/app/ForecastStrip";
import { UpcomingDues } from "@/components/app/UpcomingDues";
import { duesInForecast } from "@/components/app/due-state";
import { getVisitorStoreId } from "@/lib/demo";
import { buildHeadline, getDues, getFixOptions, getForecast, getRecurringPayees } from "@/lib/forecast";
import { findRecoveryCandidates } from "@/lib/recovery";
import { getAlerts } from "@/lib/risk";
import { formatDay } from "@/lib/shared/dates";
import { formatDollars } from "@/lib/shared/money";

const CONFIDENCE_WORD = { high: "High confidence", medium: "Medium confidence", low: "Low confidence" } as const;
const NOTE = "-mx-5 -mt-6 px-14 pt-24 pb-28 lg:-mx-12 lg:-mt-12 lg:px-24 lg:pt-[140px] lg:pb-[200px]";

interface HomeData {
  storeId: string;
  forecast: Forecast;
  dues: Due[];
  fixes: FixOption[];
  payees: RecurringPayee[];
  candidates: RecoveryCandidate[];
  alerts: Alert[];
}

async function load(): Promise<HomeData | null> {
  const storeId = await getVisitorStoreId();
  try {
    const [forecast, dues, fixes, payees, candidates, alerts] = await Promise.all([
      getForecast(storeId),
      getDues(storeId),
      getFixOptions(storeId),
      getRecurringPayees(storeId),
      findRecoveryCandidates(storeId),
      // Alerts are extras: if they fail, Today still shows the forecast.
      getAlerts(storeId).catch(() => []),
    ]);
    return { storeId, forecast, dues, fixes, payees, candidates, alerts };
  } catch (error) {
    console.error("[home] could not load the forecast:", error instanceof Error ? error.message : error);
    return null;
  }
}

/** Home: the money forecast on the banknote, the days you can tap, what's due, and what to do about it. */
export default async function HomePage() {
  const data = await load();

  if (!data) {
    return (
      <BanknotePanel className={NOTE}>
        <div role="alert" className="max-w-[560px] rounded-[14px] bg-brand p-6 ring-1 ring-white/25">
          <p className="font-serif text-[1.9rem] leading-tight text-white">Couldn&apos;t work out your forecast.</p>
          <p className="mt-3 text-[16px] leading-7 text-white/85">
            Your money hasn&apos;t moved: nothing is paid or sent without passing NeverShort&apos;s safety check. Try again in a minute.
          </p>
          <div className="mt-5">
            <ButtonLink href="/today" variant="secondary">
              Try again
            </ButtonLink>
          </div>
        </div>
      </BanknotePanel>
    );
  }

  const { storeId, forecast, dues, fixes, payees, candidates, alerts } = data;
  const headline = buildHeadline(forecast);
  const gap = forecast.firstShortfall;
  const tight = forecast.days.find((d) => d.state === "tight");
  const upcoming = duesInForecast(dues, forecast);
  const suggestion = payees.find((p) => p.status === "DETECTED" && p.kind === "SUPPLIER") ?? payees.find((p) => p.status === "DETECTED");
  const recoverable = candidates.find((c) => c.contactConsent && c.remindersSentLast48h === 0);
  const startOn = gap?.date ?? forecast.days[0]?.date ?? forecast.asOf;

  return (
    <div className="space-y-12 lg:space-y-16">
      <BanknotePanel className={NOTE}>
        <div className="space-y-6 lg:space-y-8">
          <div className={`space-y-5 ${NOTE_ROOM}`}>
            {gap ? (
              <StatusChip state="short" inverse>
                Short on {formatDay(gap.date)}
              </StatusChip>
            ) : tight ? (
              <StatusChip state="tight" inverse>
                Tight on {formatDay(tight.date)}
              </StatusChip>
            ) : (
              <StatusChip state="covered" inverse>
                Covered for the next two weeks
              </StatusChip>
            )}
            <HeadlineSentence headline={headline} inverse />
            {gap ? (
              <Suspense fallback={null}>
                <ShortfallNote forecast={forecast} />
              </Suspense>
            ) : null}
            {gap ? (
              <ButtonLink href="/fix" variant="secondary" className="min-h-12 px-5 text-[16px] font-semibold">
                Fix the gap on {formatDay(gap.date)}
              </ButtonLink>
            ) : null}
          </div>

          {/* The clear window: a calm surface over the engraving, so every number reads easily in daylight. */}
          <div className="-mx-9 rounded-[14px] bg-brand p-3 ring-1 ring-white/20 sm:mx-0 sm:p-4 lg:p-6">
            {forecast.days.length > 0 ? (
              <ForecastStrip days={forecast.days} initialDate={startOn} minimumBalanceCents={forecast.minimumBalanceCents} />
            ) : (
              <p className="text-[16px] leading-7 text-white">
                No forecast yet. It starts as soon as a week of sales is in, and fills in day by day.
              </p>
            )}
            <p className="mt-5 max-w-[70ch] text-[13px] leading-5 text-white/80">
              Balance at the end of each day, after expected sales and known payments. {CONFIDENCE_WORD[forecast.confidence]}:{" "}
              {forecast.confidenceReason.charAt(0).toLowerCase() + forecast.confidenceReason.slice(1)}
            </p>
          </div>
        </div>
      </BanknotePanel>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14">
        <div className="space-y-10">
          <section aria-labelledby="dues-title" className="rounded-card bg-paper p-5 ring-1 ring-ink/[0.06] lg:p-6">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="dues-title" className="text-[20px] leading-7 font-semibold text-ink">
                Coming up
              </h2>
              <ButtonLink href="/dues" variant="quiet">
                See everything to pay
              </ButtonLink>
            </div>
            <p className="text-[15px] text-ink-muted">Payments in the next two weeks, and how much of each is ready.</p>
            {upcoming.length > 0 ? (
              <UpcomingDues items={upcoming} />
            ) : (
              <div className="mt-4">
                <EmptyState title="Nothing due in the next two weeks." body="Bills and supplier orders show up here as soon as they're found in your payments." />
              </div>
            )}
          </section>
          <ChartSlot forecast={forecast} />
        </div>

        <aside className="space-y-5">
          {gap && fixes.length > 0 ? (
            <section id="fix-the-gap" className="scroll-mt-6">
              <Card>
                <CardTitle>
                  {fixes.length === 3 ? "Three" : fixes.length === 2 ? "Two" : "One"} ways to cover {formatDay(gap.date)}
                </CardTitle>
                <p className="mt-1 mb-4 text-[15px] leading-6 text-ink-muted">Pick one. NeverShort&apos;s safety check looks at it before anything happens.</p>
                <FixOptions fixes={fixes} />
                <div className="mt-4">
                  <ButtonLink href="/fix" variant="secondary">
                    Compare the fixes
                  </ButtonLink>
                </div>
              </Card>
            </section>
          ) : null}

          {suggestion ? (
            <section aria-label="A regular payment we found">
              <Suspense fallback={<DetectedPayees payees={[suggestion]} />}>
                <ExplainedPayees storeId={storeId} payees={[suggestion]} />
              </Suspense>
            </section>
          ) : null}

          {recoverable ? (
            <Card>
              <p className="text-[13px] text-ink-muted">Found in unfinished checkouts</p>
              <p className="mt-1 text-[17px] leading-6 text-ink">
                {recoverable.customerName} left {formatDollars(recoverable.amountCents)} in the cart on {formatDay(recoverable.lastActivityOn)}. We
                drafted a reminder with a new PayPal payment link; it gets a quick safety check before it&apos;s sent.
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
      </div>
    </div>
  );
}
