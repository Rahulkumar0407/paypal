import Link from "next/link";
import { formatDayWithYear, weekdayShort } from "@/lib/shared/dates";
import { MatBackdrop } from "@/components/ui/Paper";
import { BottomNav, SideNav } from "./NavLinks";

/** Each screw on the till sits at its own angle. */
const turn = (deg: number) => ({ "--turn": `${deg}deg` }) as React.CSSProperties;

/**
 * The owner's app frame, a shopkeeper's money desk. On a laptop: the till on the left (a screwed-down panel with the
 * name, a display window showing the shop and today's date, and the register keys) and a green counting mat on the
 * right that every page lies on. On a phone the mat fills the screen and the keys run along the bottom.
 */
export function AppShell({ today, storeName, children }: { today: string; storeName: string; children: React.ReactNode }) {
  return (
    <div className="mat relative isolate min-h-dvh lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      <MatBackdrop />
      <aside className="sticky top-0 hidden h-dvh p-2.5 pr-0 lg:block">
        <div className="till-body relative flex h-full flex-col rounded-[20px] px-5 pt-7 pb-5">
          <span aria-hidden className="screw top-2.5 left-2.5" style={turn(35)} />
          <span aria-hidden className="screw top-2.5 right-2.5" style={turn(-20)} />
          <span aria-hidden className="screw bottom-2.5 left-2.5" style={turn(80)} />
          <span aria-hidden className="screw right-2.5 bottom-2.5" style={turn(10)} />
          <Link href="/" className="block px-1">
            <span className="block font-serif text-[30px] leading-none text-ink">NeverShort</span>
          </Link>
          <div className="till-display mt-5 px-4 py-3">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-ink-muted uppercase">{storeName}</p>
            <p className="mt-1 font-serif text-[22px] leading-none text-ink tabular">
              {weekdayShort(today)} {formatDayWithYear(today).split(" ").slice(1, 3).join(" ")}
            </p>
          </div>
          <div className="mt-7 flex flex-1 flex-col">
            <SideNav />
          </div>
        </div>
      </aside>

      <div className="min-w-0 lg:p-2.5">
        <DemoBanner today={today} />
        <header className="flex items-baseline justify-between px-5 pt-5 lg:hidden">
          <Link href="/" className="font-serif text-[26px] leading-none text-ink">
            NeverShort
          </Link>
          <span className="text-[13px] font-semibold tracking-[0.12em] text-ink-muted uppercase">{storeName}</span>
        </header>
        <main id="main" className="mx-auto w-full max-w-[1160px] px-5 pt-6 pb-32 lg:px-12 lg:pt-12 lg:pb-20">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

export function DemoBanner({ today }: { today: string }) {
  return (
    <div className="bg-brand px-5 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2 text-[13px] leading-5 text-white lg:rounded-t-[22px] lg:px-12">
      <p className="mx-auto flex max-w-[1160px] flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
        <span>
          Demo shop. In this demo, today is {formatDayWithYear(today)}.
          <span className="hidden sm:inline"> Past sales are made up; payments use PayPal&apos;s test mode.</span>
        </span>
        <Link
          href="/demo"
          className="font-medium underline decoration-white/40 underline-offset-4 hover:decoration-white"
        >
          Demo guide
        </Link>
      </p>
    </div>
  );
}
