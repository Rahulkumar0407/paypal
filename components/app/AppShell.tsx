import Link from "next/link";
import { formatDayWithYear, weekdayShort } from "@/lib/shared/dates";
import { BottomNav, SideNav } from "./NavLinks";

/**
 * Modern, world-class fintech AppShell for NeverShort.
 * Clean, light neutral background (#F8FAFC), crisp white surfaces,
 * sophisticated typography, clear hierarchical navigation, and an intuitive mobile PWA model.
 */
export function AppShell({
  today,
  storeName,
  isDemo = true,
  children,
}: {
  today: string;
  storeName: string;
  isDemo?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      {/* ── Modern Desktop Sidebar (Sticky, Left) ── */}
      <aside className="sticky top-0 hidden h-dvh border-r border-slate-200/80 bg-white p-5 lg:flex lg:flex-col justify-between">
        <div className="flex flex-col gap-6">
          {/* Brand Header */}
          <div className="flex items-center justify-between">
            <Link href="/today" className="flex items-center gap-2.5 group">
              <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-base shadow-sm group-hover:bg-blue-700 transition-colors">
                N
              </span>
              <div className="flex flex-col">
                <span className="font-serif font-black text-xl leading-none text-slate-900 tracking-tight">
                  NeverShort
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold mt-0.5">
                  Cash Co-pilot
                </span>
              </div>
            </Link>
          </div>

          {/* Connected Store & Demo Clock Display */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase font-bold text-slate-500 tracking-wider">
                Connected Store
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-600 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <div className="font-serif font-bold text-base text-slate-900 truncate">
              {storeName}
            </div>
            <div className="text-xs font-mono text-slate-500">
              {weekdayShort(today)} {formatDayWithYear(today).split(" ").slice(1, 3).join(" ")}
            </div>
          </div>

          {/* Navigation Links */}
          <SideNav />
        </div>

        {/* Bottom System Status */}
        <div className="pt-4 border-t border-slate-200/80 flex flex-col gap-2">
          {isDemo ? (
            <Link
              href="/demo"
              className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span className="font-semibold">Demo Guide</span>
              </div>
              <span className="text-[10px] font-mono uppercase font-bold text-blue-600/80 group-hover:translate-x-0.5 transition-transform">
                Walkthrough →
              </span>
            </Link>
          ) : (
            <Link
              href="/onboarding"
              className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs font-medium hover:bg-emerald-100 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span className="font-semibold">Merchant Setup</span>
              </div>
              <span className="text-[10px] font-mono uppercase font-bold text-emerald-700 group-hover:translate-x-0.5 transition-transform">
                Edit →
              </span>
            </Link>
          )}

          <div className="px-2 py-1 text-[11px] font-mono text-slate-500 flex items-center justify-between">
            <span>PayPal Sandbox</span>
            <span className="text-emerald-700 font-semibold">Ready</span>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="min-w-0 flex flex-col min-h-dvh">
        {isDemo && <DemoBanner today={today} />}

        {/* Mobile Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-5 py-3.5 bg-white/95 backdrop-blur border-b border-slate-200/80 lg:hidden">
          <Link href="/today" className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm">
              N
            </span>
            <span className="font-serif font-black text-xl leading-none text-slate-900">
              NeverShort
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
              {storeName}
            </span>
            <Link
              href="/demo"
              className="text-xs font-mono px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold"
            >
              Demo
            </Link>
          </div>
        </header>

        {/* Main View Container */}
        <main
          id="main"
          className="flex-1 w-full max-w-[1020px] mx-auto px-4 sm:px-8 py-6 sm:py-8 pb-28 lg:pb-12 space-y-6"
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav />
    </div>
  );
}

export function DemoBanner({ today }: { today: string }) {
  return (
    <div className="bg-slate-900 px-4 sm:px-8 py-2.5 text-xs text-white border-b border-slate-800">
      <div className="max-w-[1200px] mx-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-400" />
          <span>
            Demo Mode: Today is <strong className="text-white font-semibold">{formatDayWithYear(today)}</strong>.
          </span>
          <span className="hidden md:inline text-slate-400">
            Simulated Loop Audio boutique. Payments operate in PayPal Sandbox.
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono">
          <Link
            href="/try"
            className="text-slate-300 hover:text-white underline underline-offset-2 transition-colors"
          >
            Try Your Numbers
          </Link>
          <span className="text-slate-600">•</span>
          <Link
            href="/demo"
            className="text-blue-400 hover:text-blue-300 font-bold transition-colors"
          >
            Demo Guide →
          </Link>
        </div>
      </div>
    </div>
  );
}
