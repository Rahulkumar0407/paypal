import type { DueWithState } from "./due-state";
import { DAY_FILL, DAY_WORD } from "@/components/ui/meaning";
import { formatDay } from "@/lib/shared/dates";
import { formatDollars, formatShortfall } from "@/lib/shared/money";

/** How many notes a full slot holds. Drawing only: the amounts themselves come from lib/forecast. */
const FULL = 6;
const LAYER_STEP = 7;
const MAX_SLOTS = 5;

/** Notes to draw for a payment: a full stack when it's all ready, never full when any of it is missing. */
function readyLayers(readyCents: number, amountCents: number): number {
  if (amountCents <= 0 || readyCents >= amountCents) return FULL;
  if (readyCents <= 0) return 0;
  return Math.min(FULL - 1, Math.max(1, Math.round((FULL * readyCents) / amountCents)));
}

/**
 * The till drawer: the owner's money already split up for what's coming. One slot per payment in the next two
 * weeks, in date order; the stack under the clip is how much of it is ready, and dashed outlines show the notes
 * still missing. When a gap is fixed or a customer pays, the new notes slide into the slot. Every number in the
 * captions comes from the forecast; the stack is only its picture. Owner: Person 1.
 */
export function TillDrawer({ items }: { items: DueWithState[] }) {
  if (items.length === 0) return null;
  const shown = items.slice(0, MAX_SLOTS);
  const more = items.length - shown.length;
  return (
    <section aria-labelledby="till-title" className="till-tray">
      <h2 id="till-title" className="sr-only">
        Money set aside for each payment
      </h2>
      <ol className="flex snap-x gap-3 overflow-x-auto [scrollbar-width:none] lg:grid lg:auto-cols-fr lg:grid-flow-col lg:overflow-visible">
        {shown.map(({ due, state }) => {
          const layers = readyLayers(due.readyCents, due.amountCents);
          const short = due.readyCents < due.amountCents;
          return (
            <li key={due.id} className="till-slot w-[168px] shrink-0 snap-start lg:w-auto">
              <div aria-hidden className="cash-stack">
                {Array.from({ length: FULL }, (_, i) => {
                  const top = (FULL - 1 - i) * LAYER_STEP;
                  if (i >= layers) {
                    return <span key={i} className={`cash-ghost ${short ? "cash-ghost-short" : ""}`} style={{ top, zIndex: 0 }} />;
                  }
                  const isTop = i === layers - 1;
                  return (
                    <span
                      key={i}
                      className={`cash-note note-in ${isTop ? "cash-note-top" : ""}`}
                      style={{ top, zIndex: 1 + i, animationDelay: `${i * 70}ms` }}
                    >
                      {isTop ? (
                        <>
                          <span className="cash-medallion" />
                          <span className="cash-maker">NeverShort</span>
                          <span className="cash-figure">{formatDollars(due.readyCents)}</span>
                        </>
                      ) : null}
                    </span>
                  );
                })}
                {layers > 0 ? (
                  <span
                    className="till-clip"
                    style={{ top: `calc(${(FULL - layers) * LAYER_STEP}px + (100% - ${(FULL - 1) * LAYER_STEP}px) * 0.34)` }}
                  />
                ) : null}
              </div>
              <p className="mt-3 text-[14px] leading-5 font-semibold text-ink">{due.payeeName}</p>
              <p className="text-[13px] leading-5 text-ink-muted">{formatDay(due.dueOn)}</p>
              <p className="mt-1.5 text-[13px] leading-5 text-ink tabular">
                {short
                  ? `${formatDollars(due.readyCents)} of ${formatDollars(due.amountCents)} ready`
                  : `${formatDollars(due.amountCents)} ready`}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-[13px] leading-5 font-semibold text-ink">
                <span aria-hidden className={`h-2.5 w-2.5 rounded-[3px] ${DAY_FILL[state]}`} />
                {short ? `${formatShortfall(due.amountCents - due.readyCents)} short` : DAY_WORD[state]}
              </p>
            </li>
          );
        })}
      </ol>
      {more > 0 ? <p className="mt-3 px-1 text-[13px] leading-5 text-ink-muted">And {more} more below.</p> : null}
    </section>
  );
}
