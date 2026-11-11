import type { Metadata } from "next";
import Link from "next/link";
import type { Due, FixOption, Forecast, ForecastDay } from "@/types";
import { ButtonLink, EmptyState, ErrorState, PageSentence, SimulatedTag, StripTileFace } from "@/components/ui";
import { DAY_WORD } from "@/components/ui/meaning";
import { FixChooser } from "@/components/app/FixChooser";
import { getVisitorStoreId } from "@/lib/demo";
import { getDues, getFixOptions, getForecast } from "@/lib/forecast";
import { formatDay } from "@/lib/shared/dates";
import { formatCents, formatDollars, formatShortfall } from "@/lib/shared/money";
import { sendFixToGuard } from "./actions";

export const metadata: Metadata = { title: "Fix the gap" };

const COUNT_WORD = ["No", "One", "Two", "Three"];
const KIND_WORD: Record<FixOption["kind"], string> = {
  SET_ASIDE: "Set aside a little each day",
  MOVE_PAYMENT: "Move a payment",
  GAP_LOAN: "Short-term loan",
};

async function load(): Promise<{ forecast: Forecast; fixes: FixOption[]; dues: Due[] } | null> {
  const storeId = await getVisitorStoreId();
  try {
    const [forecast, fixes, dues] = await Promise.all([getForecast(storeId), getFixOptions(storeId), getDues(storeId)]);
    return { forecast, fixes, dues };
  } catch (error) {
    console.error("[fix] could not load the fixes:", error instanceof Error ? error.message : error);
    return null;
  }
}

/** Fix the gap: up to three ways to cover the first short day, each sent to the Margin Guard when chosen. */
export default async function FixPage() {
  const data = await load();
  if (!data) {
    return (
      <div className="space-y-8">
        <PageSentence>Ways to cover the gap.</PageSentence>
        <ErrorState
          title="Couldn't work out the fixes."
          body="Your money hasn't moved: nothing is paid or sent without passing tmrw's safety check. Try again in a minute."
          retryHref="/fix"
        />
      </div>
    );
  }

  const { forecast, fixes, dues } = data;
  const gap = forecast.firstShortfall;

  if (!gap) {
    return (
      <div className="space-y-8">
        <PageSentence>Nothing to fix. The next 30 days are covered.</PageSentence>
        <EmptyState
          title="No short days ahead."
          body={`Every day stays above your ${formatDollars(forecast.minimumBalanceCents)} minimum. If that changes, the ways to fix it show up here.`}
          action={{ label: "Back to today", href: "/today" }}
        />
      </div>
    );
  }

  const day = forecast.days.find((d) => d.date === gap.date);
  const forDay = formatDay(gap.date);

  return (
    <div className="space-y-10 lg:space-y-12">
      <div className="space-y-4">
        <Link href="/today" className="text-[15px] text-ink-muted underline decoration-ink/30 underline-offset-4 hover:text-ink hover:decoration-ink">
          Back to today
        </Link>
        <PageSentence>
          {forDay} is {formatShortfall(gap.amountCents)} short. {COUNT_WORD[fixes.length] ?? fixes.length} way{fixes.length === 1 ? "" : "s"} to cover it.
        </PageSentence>
        <p className="max-w-[60ch] text-[16px] leading-7 text-ink-muted">
          {capitalise(gap.reason)}. Pick one. Before anything happens, tmrw&apos;s safety check (the Margin Guard) looks at it. Loans, moved payments and anything over $100 wait for your OK.
        </p>
      </div>

      {fixes.length > 0 ? (
        <FixChooser
          forDay={forDay}
          action={sendFixToGuard}
          items={fixes.map((fix) => ({
            id: fix.id,
            actionLabel: actionLabel(fix),
            content: <FixBody fix={fix} day={day} dues={dues} minimumBalanceCents={forecast.minimumBalanceCents} />,
          }))}
        />
      ) : (
        <EmptyState
          title={`No safe fix found for ${forDay}.`}
          body="None of the usual fixes keeps every day above your minimum. Ask can help you think it through."
          action={{ label: "Open Ask", href: "/ask" }}
        />
      )}

      <div className="flex flex-wrap items-center gap-4">
        <ButtonLink href="/receipts" variant="quiet">
          See every safety check
        </ButtonLink>
      </div>
    </div>
  );
}

function FixBody({ fix, day, dues, minimumBalanceCents }: { fix: FixOption; day: ForecastDay | undefined; dues: Due[]; minimumBalanceCents: number }) {
  const forDay = formatDay(fix.forDate);
  const after: ForecastDay | null = day
    ? {
        ...day,
        isToday: false,
        closingCents: fix.resultingClosingCents,
        state: fix.resultingState,
        shortByCents: fix.resultingState === "short" ? minimumBalanceCents - fix.resultingClosingCents : 0,
      }
    : null;

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[14px] text-ink-muted">{KIND_WORD[fix.kind]}</p>
        {fix.simulated ? <SimulatedTag /> : null}
      </div>
      <h2 className="mt-1.5 text-[19px] leading-7 font-semibold text-ink">{fix.title}</h2>
      <p className="mt-1.5 text-[15px] leading-6 text-ink-muted">{fix.detail}</p>

      {day && after ? (
        <div className="mt-5 rounded-tile bg-surface p-4">
          <p className="text-[15px] leading-6 font-semibold text-ink">
            {forDay} becomes {DAY_WORD[fix.resultingState].toLowerCase()}.
          </p>
          <div className="mt-3 flex items-end gap-3" aria-label={`${forDay} now and after this fix`}>
            <div className="w-[96px]">
              <p className="mb-1 text-[12px] leading-4 text-ink-muted">Now</p>
              <StripTileFace day={day} />
            </div>
            <span aria-hidden className="mb-9 text-[18px] text-ink-muted">
              →
            </span>
            <div className="w-[96px]">
              <p className="mb-1 text-[12px] leading-4 text-ink-muted">After</p>
              <StripTileFace day={after} />
            </div>
          </div>
        </div>
      ) : null}

      <dl className="mt-5 space-y-2 text-[15px] leading-6">
        {facts(fix, dues).map(([term, value]) => (
          <div key={term} className="flex items-baseline justify-between gap-4">
            <dt className="text-ink-muted">{term}</dt>
            <dd className="text-right font-semibold text-ink tabular">{value}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}

function facts(fix: FixOption, dues: Due[]): [string, string][] {
  switch (fix.kind) {
    case "SET_ASIDE":
      return [
        ["Each day", formatDollars(fix.dailyAmountCents ?? 0)],
        ["For", `${fix.days ?? 0} days`],
        ["Kept in PayPal", formatDollars(fix.amountCents)],
      ];
    case "MOVE_PAYMENT": {
      const due = dues.find((d) => d.id === fix.dueId);
      return [
        ["Payment", due ? `${due.payeeName}, ${formatDollars(due.amountCents)}` : formatDollars(fix.amountCents)],
        ["From", due ? formatDay(due.dueOn) : formatDay(fix.forDate)],
        ["To", fix.moveToOn ? formatDay(fix.moveToOn) : "Later"],
      ];
    }
    case "GAP_LOAN":
      return [
        ["Paid in", `${formatDollars(fix.amountCents)} today`],
        ["Fee", formatCents(fix.loanFeeCents ?? 0)],
        ["Paid back", fix.repayOn ? `${formatCents(fix.amountCents + (fix.loanFeeCents ?? 0))} on ${formatDay(fix.repayOn)}` : "Later"],
      ];
  }
}

function actionLabel(fix: FixOption): string {
  switch (fix.kind) {
    case "SET_ASIDE":
      return `Set aside ${formatDollars(fix.dailyAmountCents ?? 0)} a day`;
    case "MOVE_PAYMENT":
      return fix.moveToOn ? `Move it to ${formatDay(fix.moveToOn)}` : "Move the payment";
    case "GAP_LOAN":
      return `Take the ${formatDollars(fix.amountCents)} short-term loan`;
  }
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
