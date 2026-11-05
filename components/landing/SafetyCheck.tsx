import type { Receipt as ReceiptData } from "@/types";
import { Receipt } from "@/components/ui/Receipt";
import { DECISION_FILL, DECISION_WORD } from "@/components/ui/meaning";
import { InView } from "./InView";

const CAPTIONS = [
  "A $72 reminder, and Maya said the shop may contact her: it goes.",
  "A $119 reminder is over the $100 NeverShort may do alone: it waits for the owner.",
  "A second reminder after Maya already paid: never. Stopped.",
];

/**
 * "Nothing moves without the safety check": three real decisions (lib/landing runs the actual 9 rules), printed
 * as the app's thermal receipts out of the Guard's printer, one after another; the BLOCKED stamp lands on the last.
 */
export function SafetyCheck({ receipts }: { receipts: ReceiptData[] }) {
  return (
    <section aria-labelledby="guard-title" className="safety-stage">
      <div className="mx-auto w-full max-w-[1240px] px-5 py-20 lg:px-10 lg:pt-7 lg:pb-14">
        {/* Laptop: the heading and the line beside each other, so the three receipts fit in the same screen. */}
        <InView className="reveal lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end lg:gap-x-14">
          <h2 id="guard-title" className="display max-w-[16ch] text-[2.6rem] leading-[0.98] text-ink lg:text-[3.3rem]">
            Nothing moves without passing it.
          </h2>
          <p className="mt-5 max-w-[56ch] text-[18px] leading-8 text-ink lg:mt-0">
            <span className="pill mb-3 align-middle">The safety check</span>
            <br />
            AI suggests. Code decides. You approve the big ones. Every suggestion runs through 9 fixed rules and prints a
            receipt saying why.
          </p>
        </InView>
        <p className="mt-6 text-[14px] text-ink-muted md:hidden">Swipe to see all three.</p>
        <InView
          threshold={0.15}
          className="receipt-row -mx-5 mt-6 flex snap-x snap-mandatory items-start gap-5 overflow-x-auto px-5 pt-4 pb-4 [scrollbar-width:none] md:mx-0 md:mt-6 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0"
        >
          <div aria-hidden className="printer hidden md:col-span-3 md:block">
            <span className="printer-light" />
          </div>
          {receipts.map((r, i) => (
            <figure key={r.id} className="receipt-drop relative w-[300px] shrink-0 snap-center md:w-auto" style={{ animationDelay: `${300 + i * 650}ms` }}>
              {/* Once it has printed, the referee's card for the decision lands on the receipt. */}
              <span className="ref-chip" style={{ animationDelay: `${1500 + i * 650}ms` }}>
                <span aria-hidden className={`ref-chip-card ${DECISION_FILL[r.decision.decision]}`} />
                {DECISION_WORD[r.decision.decision]}
              </span>
              <Receipt receipt={r} compact />
              <figcaption className="receipt-caption mt-3 max-w-[36ch] text-[15px] leading-[1.45] text-ink" style={{ animationDelay: `${1800 + i * 650}ms` }}>
                {CAPTIONS[i]}
              </figcaption>
            </figure>
          ))}
        </InView>
      </div>
    </section>
  );
}
