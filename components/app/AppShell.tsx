import Link from "next/link";
import { formatDayWithYear } from "@/lib/shared/dates";
import { PaperBackdrop } from "@/components/ui/Paper";
import { BottomNav, SideNav } from "./NavLinks";

/** The owner's app frame: demo banner, laptop sidebar, phone tab bar. */
export function AppShell({ today, storeName, children }: { today: string; storeName: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[236px_minmax(0,1fr)]">
      <PaperBackdrop />
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-paper px-4 py-7 lg:flex">
        <Link href="/" className="px-3">
          <span className="block font-serif text-[28px] leading-none text-ink">NeverShort</span>
          <span className="mt-1.5 block text-[14px] text-ink-muted">{storeName}</span>
        </Link>
        <div className="mt-8 flex flex-1 flex-col">
          <SideNav />
        </div>
      </aside>

      <div className="min-w-0">
        <DemoBanner today={today} />
        <header className="flex items-baseline justify-between px-5 pt-5 lg:hidden">
          <Link href="/" className="font-serif text-[24px] leading-none text-ink">
            NeverShort
          </Link>
          <span className="text-[14px] text-ink-muted">{storeName}</span>
        </header>
        <main id="main" className="mx-auto w-full max-w-[1160px] px-5 pt-6 pb-28 lg:px-12 lg:pt-12 lg:pb-20">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

export function DemoBanner({ today }: { today: string }) {
  return (
    <div className="bg-brand px-5 py-2 text-[13px] leading-5 text-white lg:px-12">
      <p className="mx-auto flex max-w-[1160px] flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
        <span>
          Demo store on {formatDayWithYear(today)}.
          <span className="hidden sm:inline"> Sales history is simulated; payments use the PayPal sandbox.</span>
        </span>
        <Link href="/demo" className="font-medium underline decoration-white/40 underline-offset-4 hover:decoration-white">
          Demo controls
        </Link>
      </p>
    </div>
  );
}
