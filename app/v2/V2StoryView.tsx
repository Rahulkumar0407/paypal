"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import type { LandingStory } from "@/lib/landing";
import { formatCents, formatDollars, formatShortfall } from "@/lib/shared/money";
import { ScenicFooterV2 } from "@/components/landing/ScenicFooterV2";
import { HeroAnimatedIllustration } from "@/components/landing/HeroAnimatedIllustration";
import "./v2.css";

interface V2StoryProps {
  story: LandingStory;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function V2StoryView({ story }: V2StoryProps) {
  // Interactive Story State
  const [isMayaPaid, setIsMayaPaid] = useState(false);
  const [isAnimatingCoins, setIsAnimatingCoins] = useState(false);
  const [sliderStep, setSliderStep] = useState(0); // 0 = $0, 1 = $7/day ($21 total), 2 = $14/day ($42 total), 3 = $21/day ($63 total)
  const [selectedDayIndex, setSelectedDayIndex] = useState(story.shortIndex ?? 0);
  const [activePaddle, setActivePaddle] = useState<"approve" | "escalate" | "block">("approve");
  const [showReceipt, setShowReceipt] = useState(false);
  const timelineButtons = useRef<Array<HTMLButtonElement | null>>([]);

  // Device & PWA Showcase State
  const [deviceScreenMode, setDeviceScreenMode] = useState<"pwa" | "homescreen">("pwa");
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [installTab, setInstallTab] = useState<"ios" | "android">("ios");
  const [canPromptInstall, setCanPromptInstall] = useState(false);
  const deferredInstallPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  const firstShortIndex = story.shortIndex ?? 0;
  const selectedFix = (isMayaPaid ? story.recoveredSteps : story.steps)[sliderStep * 7]!;
  const currentShortfallCents = selectedFix.shortBy[firstShortIndex]!;
  const isTargetDateCovered = currentShortfallCents === 0;
  const savedAmountCents = selectedFix.totalCents;

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredInstallPrompt.current = e as BeforeInstallPromptEvent;
      setCanPromptInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredInstallPrompt.current) {
      deferredInstallPrompt.current.prompt();
      deferredInstallPrompt.current.userChoice.then(() => {
        deferredInstallPrompt.current = null;
        setCanPromptInstall(false);
      });
    } else {
      setShowInstallGuide(true);
    }
  };

  const handlePayMaya = () => {
    if (isMayaPaid) return;
    setIsAnimatingCoins(true);
    setTimeout(() => {
      setIsAnimatingCoins(false);
      setIsMayaPaid(true);
    }, 800);
  };

  const handleResetStory = () => {
    setIsMayaPaid(false);
    setSliderStep(0);
    setSelectedDayIndex(story.shortIndex ?? 0);
    setActivePaddle("approve");
    setShowReceipt(false);
    setDeviceScreenMode("pwa");
  };

  const selectedDay = story.days[selectedDayIndex] ?? story.days[story.shortIndex ?? 0]!;
  const firstShortDay = story.shortIndex === null ? null : story.days[story.shortIndex]!;
  const shortDayOutflows = firstShortDay?.moves.filter((move) => move.kind === "out") ?? [];
  const supplierDue = shortDayOutflows.find((move) => move.label === "Volta Audio Parts");
  const rentDue = shortDayOutflows.find((move) => move.label === "Rent");
  const openingBalance = formatCents(story.days[0]!.openingCents);
  const targetDateLabel = firstShortDay?.label ?? "the forecast";
  const selectedDayStatus = selectedDay.state === "short"
    ? `Short by ${formatShortfall(selectedDay.shortByCents)}`
    : selectedDay.state === "tight"
      ? "Tight"
      : "Covered";

  const handleTimelineKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const nextIndex = event.key === "ArrowRight" || event.key === "ArrowDown"
      ? Math.min(index + 1, story.days.length - 1)
      : event.key === "ArrowLeft" || event.key === "ArrowUp"
        ? Math.max(index - 1, 0)
        : event.key === "Home"
          ? 0
          : event.key === "End"
            ? story.days.length - 1
            : null;

    if (nextIndex !== null) {
      event.preventDefault();
      setSelectedDayIndex(nextIndex);
      timelineButtons.current[nextIndex]?.focus();
    }
  };

  return (
    <div className="v2-page min-h-screen bg-white text-[#001435] font-sans antialiased selection:bg-[#0070E0]/20 selection:text-[#001435] overflow-x-hidden">
      
      {/* ── CLEAN TOP BAR ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#F1F5F9] px-6 py-4">
        <div className="max-w-6xl xl:max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/v2" className="flex items-center gap-2 group">
            <span className="font-extrabold text-2xl tracking-tight text-[#001435]">NeverShort</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#0070E0]" />
          </Link>

          {/* Clean Narrative Anchors */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-[#52627A]">
            <a href="#moment-a" className="hover:text-[#0070E0] transition-colors">The Story</a>
            <a href="#moment-b" className="hover:text-[#0070E0] transition-colors">Recovery & Guard</a>
            <a href="#moment-c" className="hover:text-[#0070E0] transition-colors">The App</a>
            <a href="#resolution" className="hover:text-[#0070E0] transition-colors">Resolution</a>
          </nav>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center gap-2 text-xs text-[#52627A] font-semibold bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
              <span>Loop Audio • {openingBalance}</span>
            </span>

            <Link
              href="/demo"
              className="bg-[#0070E0] hover:bg-[#005bb8] active:scale-95 text-white font-extrabold text-xs sm:text-sm px-6 py-2.5 rounded-full shadow-sm shadow-[#0070E0]/20 transition-all hover:shadow"
            >
              Try the demo
            </Link>
          </div>
        </div>
      </header>

      {/* ── THE LIVING ILLUSTRATED NARRATIVE CANVAS ── */}
      <main className="relative max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6">

        {/* ══════════════════════════════════════════════════════════════
            CINEMATIC MOMENT A: THE EMOTIONAL TRANSITION
            Happy Shop Sale → Dropping Bills → Worried Merchant → Forecast Reveal
            ══════════════════════════════════════════════════════════════ */}
        <section id="moment-a" className="py-8 md:py-12 space-y-16 lg:space-y-24">
          
          {/* Act 1: Thriving Business */}
          <div className="v2-hero relative">
            <div className="v2-hero-copy">
              <p className="v2-kicker">A money forecast for Loop Audio</p>
              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-black text-[#001435] leading-[1.06] tracking-tight">
                Know when your money might run low.
              </h1>
              <p className="mt-5 max-w-md text-base sm:text-lg text-[#52627A] font-medium leading-relaxed">
                Know what is coming in, what is due, and when the balance needs attention.
              </p>
              <Link
                href="/demo"
                className="v2-primary-cta mt-7 inline-flex items-center gap-3 bg-[#0070E0] hover:bg-[#005bb8] text-white font-black text-sm sm:text-base px-8 py-3.5 rounded-full transition-colors"
              >
                <span>Try the demo</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="v2-hero-art">
              <div className="v2-hero-thread" aria-hidden="true" />
              <HeroAnimatedIllustration
                firstShortDay={firstShortDay}
                onSelectShortDay={() => setSelectedDayIndex(story.shortIndex ?? 0)}
              />
            </div>
          </div>

          {/* Act 2: Bills Drop & The Merchant Worries */}
          {/* CRITICAL: Envelopes land on the RIGHT DESK COUNTER, 100% CLEAR of the merchant's face */}
          <div id="the-problem" className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center pt-8">
            <div className="lg:col-span-7 order-2 lg:order-1 relative">
              <div className="relative w-full rounded-3xl overflow-hidden bg-white min-h-[320px]">
                <Image
                  src="/landing/scene_bills_custom.jpg"
                  alt="Shopkeeper looking worried with bills and coins dropping into bowl"
                  width={1376}
                  height={768}
                  priority
                  loading="eager"
                  unoptimized
                  className="w-full h-auto object-contain"
                />

                {/* Physical Bill Drop 1: the supplier payment from the forecast */}
                <div className="absolute top-[52%] left-[46%] z-20 animate-bill-1">
                  <div className="bg-[#FFFDFB] border border-[#CBD5E1] shadow-[0_16px_32px_-8px_rgba(0,0,0,0.15)] rounded-2xl p-3 text-left w-44 rotate-[-4deg]">
                    <div className="flex items-center justify-between text-[10px] font-bold text-[#64748B] uppercase">
                      <span>Supplier Due</span>
                      <span className="text-[#DC2626]">{firstShortDay?.label ?? "Scheduled"}</span>
                    </div>
                    <div className="text-xs font-black text-[#001435] mt-0.5">Volta Audio Parts</div>
                    <div className="text-sm font-extrabold text-[#DC2626] mt-0.5">
                      {supplierDue ? `−${formatDollars(supplierDue.amountCents)}` : "No supplier order"}
                    </div>
                  </div>
                </div>

                {/* Physical Bill Drop 2: rent from the forecast */}
                <div className="absolute top-[60%] left-[66%] z-20 animate-bill-2">
                  <div className="bg-[#FFFDFB] border border-[#CBD5E1] shadow-[0_16px_32px_-8px_rgba(0,0,0,0.15)] rounded-2xl p-3 text-left w-44 rotate-[4deg]">
                    <div className="flex items-center justify-between text-[10px] font-bold text-[#64748B] uppercase">
                      <span>Store Rent</span>
                      <span className="text-[#DC2626]">{firstShortDay?.label ?? "Scheduled"}</span>
                    </div>
                    <div className="text-xs font-black text-[#001435] mt-0.5">Commercial Lease</div>
                    <div className="text-sm font-extrabold text-[#DC2626] mt-0.5">
                      {rentDue ? `−${formatDollars(rentDue.amountCents)}` : "No rent due"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 order-1 lg:order-2 space-y-4 text-left">
              <h2 className="text-4xl sm:text-5xl font-black text-[#001435] leading-tight tracking-tight">
                Bills don’t wait.
              </h2>
              <p className="text-base sm:text-lg text-[#52627A] font-medium leading-relaxed">
                Supplier orders, store rent, and owner payouts can cluster on the same date. The forecast shows when those payments would take the shop below its minimum reserve.
              </p>
            </div>
          </div>

          {/* Act 3: The Forecast Spots Trouble in Advance */}
          <div id="see-it-coming" className="v2-future-lens">
            <div className="v2-future-heading">
              <p className="v2-kicker">The next fourteen days</p>
              <h2 className="text-4xl sm:text-5xl font-black text-[#001435] leading-tight tracking-tight">
                See it coming.
              </h2>
              <p className="max-w-2xl text-base sm:text-lg text-[#52627A] font-medium leading-relaxed">
                Follow the shop’s cash day by day. Choose a date to see its projected balance, what is due, and whether it stays above the reserve.
              </p>
            </div>

            <div className="v2-lens-scene">
              <div className="v2-lens-art">
                <Image
                  src="/landing/scene_forecast_custom.jpg"
                  alt="The shopkeeper studies a calendar through a magnifying glass."
                  width={1376}
                  height={768}
                  loading="lazy"
                  unoptimized
                  className="v2-lens-image"
                />
                <div className={`v2-lens-marker v2-lens-marker-${selectedDay.state}`} aria-hidden="true">
                  <span className="v2-lens-marker-dot" />
                  <span>{selectedDay.flap.weekday} {selectedDay.flap.day}</span>
                  <span>{selectedDayStatus}</span>
                </div>
                <p className="v2-lens-art-caption">Loop Audio · November 2026</p>
              </div>

              <div className="v2-lens-reading">
                <div className="v2-lens-date">
                  <span className="v2-kicker">Selected day</span>
                  <span className="v2-lens-date-label" aria-live="polite">{selectedDay.label}</span>
                </div>

                <div
                  className="v2-day-rail"
                  role="group"
                  aria-label="Choose a day in the 14-day forecast. Use arrow keys to move between dates."
                  tabIndex={0}
                >
                  <div className="v2-day-rail-line" aria-hidden="true" />
                  {story.days.map((day, index) => {
                    const selected = selectedDayIndex === index;
                    const stateText = day.state === "short"
                      ? `Short by ${formatShortfall(day.shortByCents)}`
                      : day.state === "tight"
                        ? "Tight"
                        : "Covered";
                    return (
                      <button
                        key={day.date}
                        ref={(element) => { timelineButtons.current[index] = element; }}
                        type="button"
                        aria-pressed={selected}
                        aria-label={`${day.label}: ${stateText}; projected cash balance ${formatCents(day.closingCents)}`}
                        onClick={() => setSelectedDayIndex(index)}
                        onKeyDown={(event) => handleTimelineKeyDown(event, index)}
                        className={`v2-day-stop v2-day-stop-${day.state}${selected ? " is-selected" : ""}`}
                      >
                        <span className="v2-day-stop-pin" aria-hidden="true" />
                        <span className="v2-day-stop-weekday">{day.flap.weekday}</span>
                        <span className="v2-day-stop-date">{day.flap.day}</span>
                        <span className="v2-day-stop-status">{day.state === "short" ? "Short" : day.state === "tight" ? "Tight" : "Clear"}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="v2-rail-hint" aria-hidden="true">Swipe for the remaining dates <span>→</span></p>

                <div className={`v2-lens-details v2-lens-details-${selectedDay.state}`} aria-live="polite" aria-atomic="true">
                  <p className="v2-lens-narrator">{selectedDay.narrator}</p>
                  <div className="v2-lens-metrics">
                    <div className="v2-lens-metric">
                      <span>Projected cash balance</span>
                      <strong>{formatCents(selectedDay.closingCents)}</strong>
                    </div>
                    <div className="v2-lens-metric">
                      <span>Minimum reserve</span>
                      <strong>{formatCents(story.minimumCents)}</strong>
                    </div>
                    <div className="v2-lens-metric v2-lens-gap">
                      <span>{selectedDay.state === "short" ? "Below reserve" : "Reserve gap"}</span>
                      <strong>{selectedDay.state === "short" ? formatShortfall(selectedDay.shortByCents) : "$0"}</strong>
                    </div>
                  </div>
                  <div className="v2-lens-obligations">
                    <span className="v2-kicker">Expected that day</span>
                    <ul>
                      {selectedDay.moves.length === 0 ? (
                        <li><span>Expected sales</span><strong>{formatDollars(story.forecast.days[selectedDayIndex]!.expectedInCents)}</strong></li>
                      ) : (
                        selectedDay.moves.map((move, moveIndex) => (
                          <li key={`${selectedDay.date}-${moveIndex}`} className={move.kind === "out" ? "is-outflow" : "is-inflow"}>
                            <span>{move.label}</span>
                            <strong>{move.kind === "out" ? "−" : "+"}{formatDollars(move.amountCents)}</strong>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </section>

        {/* ══════════════════════════════════════════════════════════════
            CINEMATIC MOMENT B: THE PRODUCT SOLVES A REAL PROBLEM
            Maya's Recovery (Parabolic Coins) + Margin Guard (Referee Cards)
            ══════════════════════════════════════════════════════════════ */}
        <section id="moment-b" className="py-12 md:py-20 space-y-16 lg:space-y-24">
          
          {/* Recovery Stage */}
          <div id="payment-recovery" className="space-y-8 text-center">
            <div className="max-w-2xl mx-auto space-y-4">
              <h2 className="text-4xl sm:text-5xl font-black text-[#001435] leading-tight tracking-tight">
                Bring lost payments back.
              </h2>
              <p className="text-base sm:text-lg text-[#52627A] font-medium leading-relaxed">
                When a checkout is dropped or abandoned, NeverShort confirms customer consent and generates an approved PayPal recovery reminder with a fresh checkout link.
              </p>
            </div>

            {/* Recovery Canvas */}
            <div className="relative w-full max-w-5xl mx-auto rounded-3xl overflow-hidden bg-white min-h-[320px]">
              <Image
                src="/landing/scene_recovery_custom.jpg"
                alt="Customer tapping phone, coins flying into shopkeeper's hands"
                width={1376}
                height={768}
                priority
                loading="eager"
                unoptimized
                className="w-full h-auto object-contain"
              />

              {/* Minted SVG Gold Coins Flight */}
              {isAnimatingCoins && (
                <div className="absolute top-[46%] left-[24%] pointer-events-none z-30">
                  <div className="relative">
                    <div className="absolute animate-coin-1">
                      <svg className="w-8 h-8 drop-shadow-lg" viewBox="0 0 32 32" fill="none">
                        <circle cx="16" cy="16" r="14" fill="#F59E0B" stroke="#D97706" strokeWidth="2" />
                        <circle cx="16" cy="16" r="10" stroke="#FDE68A" strokeWidth="1.5" strokeDasharray="3 2" />
                        <path d="M16 9v14M12 13.5c0-1.5 1.8-2.5 4-2.5s4 1 4 2.5-1.8 2-4 2.5-4 1-4 2.5 1.8 2.5 4 2.5 4-1 4-2.5" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div className="absolute animate-coin-2">
                      <svg className="w-7 h-7 drop-shadow-lg" viewBox="0 0 32 32" fill="none">
                        <circle cx="16" cy="16" r="14" fill="#F59E0B" stroke="#D97706" strokeWidth="2" />
                        <circle cx="16" cy="16" r="10" stroke="#FDE68A" strokeWidth="1.5" strokeDasharray="3 2" />
                        <path d="M16 9v14M12 13.5c0-1.5 1.8-2.5 4-2.5s4 1 4 2.5-1.8 2-4 2.5-4 1-4 2.5 1.8 2.5 4 2.5 4-1 4-2.5" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div className="absolute animate-coin-3">
                      <svg className="w-8 h-8 drop-shadow-lg" viewBox="0 0 32 32" fill="none">
                        <circle cx="16" cy="16" r="14" fill="#F59E0B" stroke="#D97706" strokeWidth="2" />
                        <circle cx="16" cy="16" r="10" stroke="#FDE68A" strokeWidth="1.5" strokeDasharray="3 2" />
                        <path d="M16 9v14M12 13.5c0-1.5 1.8-2.5 4-2.5s4 1 4 2.5-1.8 2-4 2.5-4 1-4 2.5 1.8 2.5 4 2.5 4-1 4-2.5" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Seamless Recovery Trigger Card */}
            <div className="max-w-md mx-auto bg-[#F8FAFC] border border-[#E2E8F0] p-5 rounded-2xl shadow-sm space-y-3 text-center">
              <button
                type="button"
                onClick={handlePayMaya}
                disabled={isMayaPaid || isAnimatingCoins}
                className={`w-full py-3.5 px-6 rounded-full font-extrabold text-sm transition-all shadow-sm flex items-center justify-center gap-2.5 ${
                  isMayaPaid
                    ? "bg-[#F0FDF4] text-[#16A34A] border-2 border-[#86EFAC] cursor-default"
                    : "bg-[#0070E0] hover:bg-[#005bb8] text-white hover:scale-[1.02] active:scale-95 shadow-[#0070E0]/20"
                }`}
              >
                {isMayaPaid ? (
                  <>
                    <span className="text-base">✓</span>
                    <span>Simulated · {formatDollars(story.recovery.netCents)} net after {formatDollars(story.recovery.feeCents)} fee</span>
                  </>
                ) : isAnimatingCoins ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin text-base">🔄</span>
                    <span>Simulating Maya’s recovered checkout</span>
                  </span>
                ) : (
                  <>
                    <span>Simulate Maya’s {formatCents(story.recovery.grossCents)} checkout</span>
                    <span className="opacity-75 font-normal text-xs">→</span>
                  </>
                )}
              </button>

              <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#52627A]">
                <span>{targetDateLabel} reserve gap:</span>
                <span className="font-mono font-bold text-[#001435]">
                  {isMayaPaid ? (
                    <span className="text-[#DC2626]">{formatShortfall(story.recovery.shortByAfterCents)} below reserve</span>
                  ) : (
                    <span className="text-[#DC2626]">{firstShortDay ? `${formatShortfall(firstShortDay.shortByCents)} below reserve` : "No shortfall"}</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Margin Guard Safety Stage */}
          <div id="margin-guard" className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center pt-8">
            <div className="lg:col-span-5 space-y-6 text-left">
              <h2 className="text-4xl sm:text-5xl font-black text-[#001435] leading-tight tracking-tight">
                Every risky move gets checked.
              </h2>
              <p className="text-base sm:text-lg text-[#52627A] font-medium leading-relaxed">
                AI can draft recovery messages, but only code can execute actions. The Margin Guard runs nine deterministic rules against every reminder, refund, or payout before a single dollar moves.
              </p>

              {/* Physical Referee Cards */}
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => { setActivePaddle("approve"); setShowReceipt(true); }}
                    className={`p-3 rounded-2xl text-center transition-all ${
                      activePaddle === "approve"
                        ? "bg-[#1E9E5E] text-white shadow-md scale-105"
                        : "bg-[#F0FDF4] text-[#1E9E5E] border border-[#BBF7D0] hover:bg-[#DCFCE7]"
                    }`}
                  >
                    <div className="text-sm font-extrabold flex items-center justify-center gap-1">
                      <span>✓</span>
                      <span>APPROVE</span>
                    </div>
                    <div className="text-[10px] mt-1 opacity-90">Consent verified</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setActivePaddle("escalate"); setShowReceipt(true); }}
                    className={`p-3 rounded-2xl text-center transition-all ${
                      activePaddle === "escalate"
                        ? "bg-[#F2A93B] text-white shadow-md scale-105"
                        : "bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] hover:bg-[#FEF3C7]"
                    }`}
                  >
                    <div className="text-sm font-extrabold flex items-center justify-center gap-1">
                      <span>✋</span>
                      <span>ESCALATE</span>
                    </div>
                    <div className="text-[10px] mt-1 opacity-90">Owner decision</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setActivePaddle("block"); setShowReceipt(true); }}
                    className={`p-3 rounded-2xl text-center transition-all ${
                      activePaddle === "block"
                        ? "bg-[#E5484D] text-white shadow-md scale-105"
                        : "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] hover:bg-[#FEE2E2]"
                    }`}
                  >
                    <div className="text-sm font-extrabold flex items-center justify-center gap-1">
                      <span>⛔</span>
                      <span>BLOCK</span>
                    </div>
                    <div className="text-[10px] mt-1 opacity-90">Already paid</div>
                  </button>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs shadow-sm">
                  {activePaddle === "approve" && (
                    <p className="text-[#16A34A] font-semibold">
                      <strong>Rule 2 Passed:</strong> Customer consented to checkout reminders and order is unpaid. Recovery approved.
                    </p>
                  )}
                  {activePaddle === "escalate" && (
                    <p className="text-[#D97706] font-semibold">
                      <strong>Rule 8 Triggered:</strong> Action amount exceeds $100.00. Sent to owner approval inbox before execution.
                    </p>
                  )}
                  {activePaddle === "block" && (
                    <p className="text-[#DC2626] font-semibold">
                      <strong>Rule 1 Triggered:</strong> Order already captured in PayPal sandbox. Duplicate reminders are strictly blocked.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowReceipt(!showReceipt)}
                  className="text-xs font-bold text-[#0070E0] hover:text-[#005bb8] inline-flex items-center gap-1.5 pt-1 transition-colors"
                >
                  <span>{showReceipt ? "Hide Thermal Receipt ▲" : "View Thermal Shop Receipt 📄 ▼"}</span>
                </button>
              </div>
            </div>

            {/* Guardian Right (Guaranteed fully visible eager loading) */}
            <div className="lg:col-span-7 relative">
              <div className="relative w-full rounded-3xl overflow-hidden bg-white min-h-[320px] shadow-sm border border-[#F1F5F9]">
                <Image
                  src="/landing/scene_guard_custom.jpg"
                  alt="Guardian holding green, amber, red referee signs while shopkeeper looks up thoughtfully"
                  width={1376}
                  height={768}
                  priority
                  loading="eager"
                  unoptimized
                  className="w-full h-auto object-contain transition-transform duration-500 hover:scale-[1.008]"
                />

                {/* Interactive Reactive Paddle Glow on User Selection */}
                {activePaddle === "approve" && (
                  <div className="absolute top-[28%] left-[42%] w-16 h-16 rounded-full bg-[#1E9E5E]/25 animate-ping pointer-events-none" />
                )}
                {activePaddle === "escalate" && (
                  <div className="absolute top-[26%] left-[52%] w-16 h-16 rounded-full bg-[#F2A93B]/30 animate-ping pointer-events-none" />
                )}
                {activePaddle === "block" && (
                  <div className="absolute top-[28%] left-[62%] w-16 h-16 rounded-full bg-[#DC2626]/30 animate-ping pointer-events-none" />
                )}
              </div>

              {/* Thermal Shop Receipt */}
              {showReceipt && (
                <div className="mt-4 p-5 rounded-2xl bg-[#FFFDFB] text-[#14201B] font-mono text-[11px] space-y-2 border border-[#CBD5E1] shadow-xl relative z-30 animate-fadeIn">
                  <div className="flex justify-between border-b border-dashed border-[#94A3B8] pb-2 font-bold text-xs">
                    <span>NEVERSHORT MARGIN GUARD</span>
                    <span>RECEIPT #RC-83K9</span>
                  </div>
                  <div className="text-[#64748B]">ACTION: SEND_REMINDER • TARGET: 83K9</div>
                  <div className="text-[#64748B]">IDEMPOTENCY: run-1:SEND_REMINDER:83K9:1</div>
                  <div className="py-2 space-y-1 border-b border-dashed border-[#94A3B8]">
                    <div className="flex justify-between">
                      <span>Rule 1: ALREADY_PAID</span>
                      <span className={activePaddle === "block" ? "text-[#DC2626] font-bold" : "text-[#16A34A]"}>
                        {activePaddle === "block" ? "FAIL (BLOCKED)" : "PASS"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rule 2: CONSENT_VERIFIED</span>
                      <span className="text-[#16A34A]">PASS</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rule 8: OWNER_APPROVAL (&gt;$100)</span>
                      <span className={activePaddle === "escalate" ? "text-[#D97706] font-bold" : "text-[#16A34A]"}>
                        {activePaddle === "escalate" ? "ESCALATE" : "PASS"}
                      </span>
                    </div>
                  </div>
                  <div className="pt-1 flex items-center justify-between font-bold text-xs">
                    <span>GUARD DECISION:</span>
                    <span className={
                      activePaddle === "approve" ? "text-[#16A34A]" :
                      activePaddle === "escalate" ? "text-[#D97706]" : "text-[#DC2626]"
                    }>
                      {activePaddle === "approve" && "APPROVE (EXECUTE)"}
                      {activePaddle === "escalate" && "ESCALATE (WAITING OWNER)"}
                      {activePaddle === "block" && "BLOCK (FAIL-CLOSED)"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

        </section>

        {/* ══════════════════════════════════════════════════════════════
            CINEMATIC MOMENT C: THE FLAGSHIP PRODUCT REVEAL
            Desktop 1440px / 1200px Centered Studio Reveal + Mobile PWA
            ══════════════════════════════════════════════════════════════ */}
        <section id="moment-c" className="py-16 md:py-24">
          <div className="max-w-[1200px] mx-auto space-y-10 sm:space-y-12">
            
            {/* Centered Headline */}
            <div className="text-center space-y-3 max-w-2xl mx-auto px-4">
              <h2 className="text-4xl sm:text-5xl lg:text-[54px] font-black text-[#001435] leading-[1.08] tracking-tight">
                Take your business with you.
              </h2>
              <p className="text-base sm:text-lg text-[#52627A] font-medium">
                Your business, on every screen.
              </p>
            </div>

            {/* Studio Device Composition */}
            <div className="relative pt-2 pb-6 px-2 sm:px-4">
              
              {/* DESKTOP BROWSER MOCKUP (~78% width, positioned slightly left of center) */}
              <div className="w-full lg:w-[78%] mr-auto rounded-[16px] bg-[#12151C] p-2 sm:p-2.5 shadow-[0_30px_80px_-15px_rgba(0,20,53,0.14),0_0_0_1px_rgba(0,20,53,0.06)] border border-[#E2E8F0]/40 transition-transform duration-700 hover:scale-[1.005]">
                <div className="flex items-center justify-between px-3 py-2 bg-[#1E2024] rounded-t-[12px] border-b border-white/10 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] shadow-inner" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] shadow-inner" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F] shadow-inner" />
                  </div>

                  <div className="flex items-center justify-center gap-1.5 bg-black/40 text-white/70 font-mono text-[11px] px-6 py-1 rounded-full border border-white/10 w-64 sm:w-80 shadow-inner">
                    <span className="text-[#10B981] text-[10px]">🔒</span>
                    <span className="text-white/90 font-medium">nevershort.app/today</span>
                  </div>

                  <div className="text-[10px] text-white/40 font-semibold tracking-wide hidden sm:block">
                    Loop Audio
                  </div>
                </div>

                <div className="relative w-full overflow-hidden rounded-b-[12px] bg-[#001435]">
                  <Image
                    src="/pwa-real-desktop-2x.png"
                    alt="NeverShort real desktop application showing 14-day cash forecast, till keys and banknote panel"
                    width={2560}
                    height={1560}
                    priority
                    loading="eager"
                    unoptimized
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>

              {/* SMARTPHONE DEVICE MOCKUP (~26% width, positioned in lower-right foreground) */}
              <div className="w-[280px] sm:w-[305px] lg:w-[26%] mx-auto mt-6 lg:mt-0 lg:absolute lg:right-0 lg:-bottom-6 lg:z-30 transition-transform duration-700 hover:scale-[1.02]">
                <div className="relative rounded-[48px] p-2 bg-[#0F131A] shadow-[0_35px_80px_-15px_rgba(0,0,0,0.50),0_15px_30px_-10px_rgba(0,20,53,0.30)] border-[2.5px] border-[#2A2E39]">
                  
                  {/* Dynamic Island Capsule */}
                  <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-40 flex items-center justify-end pr-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#0070E0]/80" />
                  </div>

                  {/* Phone Screen Display */}
                  <div className="relative rounded-[40px] overflow-hidden bg-[#001435] aspect-[9/18.5] flex flex-col justify-between">
                    
                    {deviceScreenMode === "pwa" ? (
                      /* Standalone PWA Interface */
                      <div className="relative w-full h-full flex flex-col bg-[#001435]">
                        <div className="h-7 w-full flex items-center justify-between px-6 pt-2 text-[10px] font-bold text-white/80 z-20">
                          <span>9:41</span>
                          <span className="flex items-center gap-1">5G • 100%</span>
                        </div>

                        <div className="relative flex-1 overflow-hidden">
                          <Image
                            src="/pwa-real-mobile-2x.png"
                            alt="NeverShort real mobile interface running in installed PWA standalone mode"
                            width={780}
                            height={1500}
                            priority
                            loading="eager"
                            unoptimized
                            className="w-full h-auto object-cover"
                          />
                        </div>

                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/60 rounded-full" />
                      </div>
                    ) : (
                      /* Phone Home Screen with NeverShort App Icon */
                      <div className="relative w-full h-full bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#020617] p-5 flex flex-col justify-between text-white">
                        <div className="pt-8 text-center space-y-0.5">
                          <div className="text-4xl font-extralight tracking-tight font-sans">9:41</div>
                          <div className="text-xs text-white/70 font-medium">Thursday, November 5</div>
                        </div>

                        <div className="space-y-6">
                          <div className="grid grid-cols-4 gap-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <div className="relative w-12 h-12 rounded-2xl bg-[#003087] border border-[#0070E0] shadow-lg shadow-[#0070E0]/40 flex items-center justify-center text-white font-serif font-black text-lg transform hover:scale-110 transition-transform">
                                <span>N</span>
                                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#DC2626] rounded-full border-2 border-[#0F172A]" />
                              </div>
                              <span className="text-[10px] font-semibold text-white/90">NeverShort</span>
                            </div>

                            <div className="flex flex-col items-center gap-1 opacity-60">
                              <div className="w-12 h-12 rounded-2xl bg-[#10B981] flex items-center justify-center text-white text-lg">💬</div>
                              <span className="text-[10px]">Messages</span>
                            </div>

                            <div className="flex flex-col items-center gap-1 opacity-60">
                              <div className="w-12 h-12 rounded-2xl bg-[#6366F1] flex items-center justify-center text-white text-lg">📸</div>
                              <span className="text-[10px]">Photos</span>
                            </div>

                            <div className="flex flex-col items-center gap-1 opacity-60">
                              <div className="w-12 h-12 rounded-2xl bg-[#F59E0B] flex items-center justify-center text-white text-lg">📝</div>
                              <span className="text-[10px]">Notes</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-2.5 flex justify-around items-center">
                          <span className="text-xl">📞</span>
                          <span className="text-xl">🧭</span>
                          <span className="text-xl">✉️</span>
                          <span className="text-xl">⚙️</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* PWA Switcher */}
            <div className="pt-2 text-center space-y-3.5">
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs">
                <div className="inline-flex bg-[#F1F5F9] p-0.5 rounded-full font-bold text-[#64748B]">
                  <button
                    type="button"
                    onClick={() => setDeviceScreenMode("pwa")}
                    className={`px-3 py-1.5 rounded-full transition-all ${
                      deviceScreenMode === "pwa"
                        ? "bg-white text-[#0070E0] shadow-sm font-extrabold"
                        : "hover:text-[#001435]"
                    }`}
                  >
                    Installed App
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeviceScreenMode("homescreen")}
                    className={`px-3 py-1.5 rounded-full transition-all ${
                      deviceScreenMode === "homescreen"
                        ? "bg-white text-[#0070E0] shadow-sm font-extrabold"
                        : "hover:text-[#001435]"
                    }`}
                  >
                    Home Screen Icon
                  </button>
                </div>

                <span className="hidden sm:inline text-[#CBD5E1]">•</span>

                <button
                  type="button"
                  onClick={() => setShowInstallGuide(!showInstallGuide)}
                  className="text-xs font-bold text-[#0070E0] hover:text-[#005bb8] inline-flex items-center gap-1.5 transition-colors"
                >
                  <span>Install NeverShort on your phone</span>
                  <span>{showInstallGuide ? "▲" : "📲 ↗"}</span>
                </button>
              </div>

              {/* Expandable PWA Installation Guide */}
              {showInstallGuide && (
                <div className="max-w-lg mx-auto bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-xl text-left text-xs space-y-4 animate-fadeIn z-30 relative">
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                    <span className="font-extrabold text-sm text-[#001435]">Install NeverShort on Phone</span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setInstallTab("ios")}
                        className={`px-2.5 py-1 rounded-lg font-bold ${
                          installTab === "ios" ? "bg-[#0070E0] text-white" : "bg-[#F1F5F9] text-[#64748B]"
                        }`}
                      >
                        Apple iOS
                      </button>
                      <button
                        type="button"
                        onClick={() => setInstallTab("android")}
                        className={`px-2.5 py-1 rounded-lg font-bold ${
                          installTab === "android" ? "bg-[#0070E0] text-white" : "bg-[#F1F5F9] text-[#64748B]"
                        }`}
                      >
                        Android
                      </button>
                    </div>
                  </div>

                  {installTab === "ios" ? (
                    <ol className="space-y-2 text-[#475569] list-decimal list-inside font-medium leading-relaxed">
                      <li>Open <strong>nevershort.app</strong> in Safari.</li>
                      <li>Tap the <strong>Share</strong> button <span className="inline-block border border-[#CBD5E1] px-1.5 py-0.2 rounded bg-[#F8FAFC] font-mono text-[10px]">⎋</span> in Safari&apos;s bottom toolbar.</li>
                      <li>Scroll down and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong>.</li>
                      <li>Tap <strong>&ldquo;Add&rdquo;</strong> top right. NeverShort launches in full-screen standalone mode.</li>
                    </ol>
                  ) : (
                    <ol className="space-y-2 text-[#475569] list-decimal list-inside font-medium leading-relaxed">
                      <li>Open <strong>nevershort.app</strong> in Chrome or Samsung Internet.</li>
                      <li>Tap <strong>&ldquo;Add NeverShort to Home screen&rdquo;</strong> when prompted, or tap menu <span className="inline-block border border-[#CBD5E1] px-1 rounded bg-[#F8FAFC] font-mono text-[10px]">⋮</span>.</li>
                      <li>Select <strong>&ldquo;Install app&rdquo;</strong>.</li>
                    </ol>
                  )}

                  {canPromptInstall && (
                    <div className="pt-2 border-t border-[#E2E8F0]">
                      <button
                        type="button"
                        onClick={handleInstallClick}
                        className="w-full py-2 bg-[#0070E0] text-white rounded-xl font-bold hover:bg-[#005bb8] transition-all"
                      >
                        Install App Now (Browser Supported)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            THE EARNED RESOLUTION & PEACE OF MIND
            Dynamic Truthful Narrative + Eager Character Illustration + Tactile Stamp
            ══════════════════════════════════════════════════════════════ */}
        <section id="resolution" className="py-16 md:py-24 text-center">
          <div className="max-w-2xl mx-auto space-y-4 mb-8">
            <h2 className="text-4xl sm:text-5xl font-black text-[#001435] leading-tight tracking-tight">
              {isTargetDateCovered ? "Stay one step ahead." : "Cover the gap before it hits."}
            </h2>

            {!isTargetDateCovered && !isMayaPaid && sliderStep === 0 && firstShortDay && (
              <p className="text-base sm:text-lg text-[#52627A] font-medium leading-relaxed max-w-2xl mx-auto">
                On {firstShortDay.label}, Loop Audio would close at {formatCents(firstShortDay.closingCents)}, {formatShortfall(firstShortDay.shortByCents)} below its {formatCents(story.minimumCents)} minimum reserve. {supplierDue?.label} ({formatDollars(supplierDue?.amountCents ?? 0)}) and rent ({formatDollars(rentDue?.amountCents ?? 0)}) are due that day.
              </p>
            )}

            {!isTargetDateCovered && isMayaPaid && sliderStep === 0 && (
              <p className="text-base sm:text-lg text-[#52627A] font-medium leading-relaxed max-w-2xl mx-auto">
                Maya&apos;s simulated {formatCents(story.recovery.grossCents)} checkout contributes {formatCents(story.recovery.netCents)} after a {formatCents(story.recovery.feeCents)} fee, leaving {formatShortfall(story.recovery.shortByAfterCents)} below reserve. Keeping {formatDollars(story.recoveredSteps[7]!.dailyCents)} a day from the owner&apos;s regular bank transfer in PayPal would cover {targetDateLabel}.
              </p>
            )}

            {!isTargetDateCovered && sliderStep > 0 && (
              <p className="text-base sm:text-lg text-[#52627A] font-medium leading-relaxed max-w-2xl mx-auto">
                Keeping {formatDollars(selectedFix.dailyCents)} a day from the owner&apos;s regular bank transfer in PayPal ({formatDollars(savedAmountCents)} total) leaves {formatShortfall(currentShortfallCents)} below reserve on {targetDateLabel}.
              </p>
            )}

            {isTargetDateCovered && (
              <p className="text-base sm:text-lg text-[#52627A] font-medium leading-relaxed max-w-2xl mx-auto">
                <span className="font-bold text-[#16A34A]">{targetDateLabel} is above the minimum reserve in this forecast.</span>{" "}
                {selectedFix.dailyCents > 0
                  ? `The proposed set-aside keeps ${formatDollars(selectedFix.dailyCents)} a day in PayPal, ${formatDollars(savedAmountCents)} total.`
                  : "No set-aside is needed for this date."}{" "}
                {selectedFix.decision === "APPROVE"
                  ? "The Margin Guard approves the proposal."
                  : selectedFix.decision === "ESCALATE"
                    ? "The Margin Guard asks the owner to approve the proposal before it runs."
                    : selectedFix.decision === "BLOCK"
                      ? "The Margin Guard blocks this proposal."
                      : ""}
              </p>
            )}
          </div>

          {/* Guaranteed Visible Illustration (Eagerly Loaded, High Contrast) */}
          <div className="relative w-full max-w-5xl mx-auto rounded-3xl overflow-hidden bg-white min-h-[340px] shadow-sm border border-[#F1F5F9] mb-8">
            <Image
              src="/landing/scene_relaxed_custom.jpg"
              alt="Relaxed shopkeeper leaning back happily with green-checked calendar"
              width={1376}
              height={768}
              priority
              loading="eager"
              unoptimized
              className="w-full h-auto object-contain"
            />

            {/* Tactile stamp appears when the target date stays above the minimum reserve. */}
            {isTargetDateCovered && (
              <div className="absolute top-[28%] right-[22%] pointer-events-none animate-stamp-slam z-30">
                <span className="inline-block border-[3px] border-[#16A34A] text-[#16A34A] font-black text-sm md:text-base px-5 py-2.5 rounded-lg shadow-xl bg-white/95 tracking-wide">
                  THURSDAY COVERED ✓
                </span>
              </div>
            )}
          </div>

          {/* Interactive Daily Set-Aside Solver */}
          <div className="max-w-md mx-auto bg-[#F8FAFC] border border-[#E2E8F0] p-5 rounded-2xl shadow-sm space-y-4 text-center">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[#64748B]">Keep in PayPal each day:</span>
              <span className="text-[#0070E0] text-sm font-mono font-black">
                {formatDollars(selectedFix.dailyCents)} / day ({formatDollars(savedAmountCents)} total)
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="3"
              step="1"
              value={sliderStep}
              onChange={(e) => setSliderStep(Number(e.target.value))}
              className="w-full accent-[#0070E0] cursor-pointer"
              aria-label="Daily amount kept in PayPal from the owner's regular bank transfers"
            />

            <div className="flex justify-between text-[11px] text-[#94A3B8] font-bold">
              <span>$0/day</span>
              <span>$7/day</span>
              <span>$14/day</span>
              <span>$21/day</span>
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
              <span className="text-[#64748B] font-semibold">{targetDateLabel} status:</span>
              <span
                className={`font-mono font-black text-sm ${
                  isTargetDateCovered ? "text-[#16A34A]" : "text-[#DC2626]"
                }`}
              >
                {isTargetDateCovered ? "ABOVE MINIMUM" : `${formatShortfall(currentShortfallCents)} BELOW MINIMUM`}
              </span>
            </div>
          </div>
        </section>

      </main>

      {/* ── SCENIC STORYBOOK FOOTER & FINAL CTA ── */}
      <ScenicFooterV2 onResetStory={handleResetStory} />
    </div>
  );
}
