import Link from "next/link";
import { InView } from "./InView";

const TOOLS: [string, string][] = [
  ["PayPal Orders v2", "checkout links, capture"],
  ["PayPal Webhooks", "signed payment events"],
  ["PayPal Payouts", "paying the supplier"],
  ["PayPal Payments", "refunds"],
  ["Gemini, AI SDK", "drafts and explains only"],
  ["Margin Guard", "9 rules in plain code"],
  ["AG Grid, AG Charts", "the dashboard"],
  ["Next.js, Prisma", "Supabase Postgres"],
];

/**
 * The ending: one dark block with the three things to do as big chunky buttons, and what it's built with printed as a
 * till receipt, line by line. Footer: the licence and the illustration credit.
 */
export function Finale() {
  return (
    <section aria-labelledby="last-title" className="finale">
      <div className="mx-auto grid w-full max-w-[1240px] items-start gap-14 px-5 py-20 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:px-10 lg:py-28">
        <InView className="reveal finale-copy">
          <h2 id="last-title" className="display text-[2.8rem] leading-[0.96] text-white lg:text-[4.4rem]">
            Open Loop Audio&apos;s till and try it.
          </h2>
          <p className="mt-6 max-w-[46ch] text-[18px] leading-8 text-white/85">
            Loop Audio is a sample shop with made-up sales. You get your own copy to run: fix the gap, approve a reminder,
            pay it as the PayPal test buyer, and ask whether you can afford a $200 order on Monday.
          </p>
          <div className="finale-keys mt-9 flex flex-wrap gap-4">
            <Link href="/demo" className="btn-chunky btn-light">
              Open the sample shop
            </Link>
            <Link href="/today" className="btn-chunky btn-ghost">
              Go straight to the app
            </Link>
            <a href="https://github.com/Rahulkumar0407/paypal" className="btn-chunky btn-ghost">
              Read the code
            </a>
            <Link href="/try" className="btn-chunky btn-ghost">
              Try your own numbers
            </Link>
          </div>
        </InView>

        <InView className="tools-receipt-wrap">
          <div className="tools-receipt receipt-paper on-paper px-5 pt-8 pb-9 font-mono text-[12.5px] leading-[1.7] text-ink sm:px-6 sm:text-[13px]">
            <p className="text-center font-semibold tracking-[0.2em]">NEVERSHORT</p>
            <p className="text-center text-ink-muted">Built with</p>
            <div aria-hidden className="my-3 border-t border-dashed border-ink/45" />
            <ul>
              {TOOLS.map(([name, what], i) => (
                <li key={name} className="tools-line flex flex-wrap gap-x-2 sm:flex-nowrap" style={{ animationDelay: `${300 + i * 140}ms` }}>
                  <span className="shrink-0">{name}</span>
                  <span aria-hidden className="hidden min-w-4 flex-1 translate-y-[-4px] border-b border-dotted border-ink/40 sm:block" />
                  <span className="w-full pl-4 text-ink-muted sm:w-auto sm:shrink-0 sm:pl-0 sm:text-right">{what}</span>
                </li>
              ))}
            </ul>
            <div aria-hidden className="my-3 border-t border-dashed border-ink/45" />
            <p className="text-center">PayPal test mode only · MIT licence</p>
            <p className="text-center text-ink-muted">Loop Audio is a sample shop with made-up sales</p>
          </div>
        </InView>
      </div>
      <footer className="mx-auto flex w-full max-w-[1240px] flex-wrap items-baseline justify-between gap-4 border-t border-white/15 px-5 py-8 text-[14px] text-white/65 lg:px-10">
        <span className="display text-[24px] text-white">NeverShort</span>
        <span>
          Built for the PayPal AI Hackathon 2026. AI never calculates money; code does. Illustrations: Open Peeps by Pablo
          Stanley (CC0).
        </span>
      </footer>
    </section>
  );
}
