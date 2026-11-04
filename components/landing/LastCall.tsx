import Link from "next/link";
import { InView } from "./Weather";

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
 * The end of the page: the three things to do, as big register keys, and what it's built with, printed as a till
 * receipt. Everything PayPal runs in the sandbox.
 */
export function LastCall() {
  return (
    <section aria-labelledby="last-title" className="relative mx-auto w-full max-w-[1240px] px-5 pt-16 pb-24 lg:px-10 lg:pt-24 lg:pb-32">
      <div className="grid items-start gap-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <InView className="reveal last-keys">
          <h2 id="last-title" className="font-serif text-[2.4rem] leading-[1.04] tracking-[-0.02em] text-ink lg:text-[3.4rem]">
            Open Loop Audio&apos;s till and try it.
          </h2>
          <p className="mt-5 max-w-[46ch] text-[18px] leading-8 text-ink">
            The live demo is the real app with its own copy of the shop for you. Fix the gap, approve a reminder, pay it
            as the PayPal sandbox buyer, and ask whether you can afford a $200 order on Monday.
          </p>
          <ul className="mt-9 grid max-w-[560px] grid-cols-1 gap-3.5 sm:grid-cols-3">
            {[
              { n: 1, label: "Open the live demo", href: "/demo" },
              { n: 2, label: "See the app", href: "/today" },
              { n: 3, label: "Read the code", href: "https://github.com/kritsii/paypal" },
            ].map((k) => (
              <li key={k.n}>
                <Link href={k.href} className="key !min-h-[84px]">
                  <span aria-hidden className="key-num">
                    {k.n}
                  </span>
                  {k.label}
                </Link>
              </li>
            ))}
          </ul>
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
            <p className="text-center">PayPal sandbox only · MIT licence</p>
            <p className="text-center text-ink-muted">Loop Audio is a simulated shop</p>
          </div>
        </InView>
      </div>
      <footer className="mt-20 flex flex-wrap items-baseline justify-between gap-4 border-t border-white/15 pt-6 text-[14px] text-ink-muted">
        <span className="font-serif text-[22px] text-ink">NeverShort</span>
        <span>Built for the PayPal AI Hackathon 2026. AI never calculates money; code does.</span>
      </footer>
    </section>
  );
}
