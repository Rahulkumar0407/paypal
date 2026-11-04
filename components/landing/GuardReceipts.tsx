import type { Receipt as ReceiptData } from "@/types";
import { Receipt } from "@/components/ui/Receipt";
import { InView } from "./Weather";

const CAPTIONS = [
  "A $72 reminder, with the customer's OK to contact them: it goes.",
  "A $119 reminder is over the $100 NeverShort may do alone: it waits for the owner.",
  "A second reminder after the customer paid: never. Stopped.",
];

/**
 * Nothing moves without the Guard: three real decisions (lib/landing runs the actual 9 rules) printed as the app's
 * thermal receipts. They drop onto the felt one after another when the section comes into view, and the BLOCKED stamp
 * lands on the last one.
 */
export function GuardReceipts({ receipts }: { receipts: ReceiptData[] }) {
  return (
    <section aria-labelledby="guard-title" className="relative mx-auto w-full max-w-[1240px] px-5 py-24 lg:px-10 lg:py-32">
      <InView className="reveal">
      <p className="text-[12px] font-semibold tracking-[0.2em] text-ink-muted uppercase">The Margin Guard</p>
      <h2 id="guard-title" className="mt-3 max-w-[20ch] font-serif text-[2.4rem] leading-[1.04] tracking-[-0.02em] text-ink lg:text-[3.2rem]">
        Nothing moves without passing the safety check.
      </h2>
      <p className="mt-5 max-w-[56ch] text-[18px] leading-8 text-ink">
        AI suggests. Code decides. You approve the big ones. Every suggestion runs through 9 fixed rules and prints a
        receipt saying why.
      </p>
      </InView>
      <p className="mt-6 text-[14px] text-ink-muted md:hidden">Swipe to see all three.</p>
      <InView
        threshold={0.15}
        className="receipt-row -mx-5 mt-6 flex snap-x snap-mandatory items-start gap-5 overflow-x-auto px-5 pt-4 pb-4 [scrollbar-width:none] md:mx-0 md:mt-12 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0"
      >
        <div aria-hidden className="printer hidden md:col-span-3 md:block">
          <span className="printer-light" />
        </div>
        {receipts.map((r, i) => (
          <figure key={r.id} className="receipt-drop w-[300px] shrink-0 snap-center md:w-auto" style={{ animationDelay: `${300 + i * 650}ms` }}>
            <div className="receipt-clip md:hidden" aria-hidden />
            <Receipt receipt={r} />
            <figcaption className="mt-4 max-w-[34ch] text-[15px] leading-6 text-ink">{CAPTIONS[i]}</figcaption>
          </figure>
        ))}
      </InView>
    </section>
  );
}
