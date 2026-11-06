"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import type { LandingStory } from "@/lib/landing";
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
  const [selectedDayIndex, setSelectedDayIndex] = useState(7); // default Thu 12 (the crunch)
  const [activePaddle, setActivePaddle] = useState<"approve" | "escalate" | "block">("approve");
  const [showReceipt, setShowReceipt] = useState(false);
  const [copiedLogin, setCopiedLogin] = useState(false);

  // Device & PWA Showcase State
  const [deviceScreenMode, setDeviceScreenMode] = useState<"pwa" | "homescreen">("pwa");
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [installTab, setInstallTab] = useState<"ios" | "android">("ios");
  const [canPromptInstall, setCanPromptInstall] = useState(false);
  const deferredInstallPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  // Financial Math (Strictly deterministic from Loop Audio data)
  // Base gap: $90 without recovery, $21 after Maya's $72 checkout ($69.60 net captured)
  const baseShortfall = isMayaPaid ? 21 : 90;
  const savedAmount = sliderStep * 7 * 3; // total set-aside over 3 planning days ($0, $21, $42, $63)
  const currentShortfall = Math.max(0, baseShortfall - (sliderStep * 21));
  const isThursdayCovered = currentShortfall === 0;

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
    setSelectedDayIndex(7);
    setActivePaddle("approve");
    setShowReceipt(false);
    setDeviceScreenMode("pwa");
  };

  const handleCopyCredentials = () => {
    navigator.clipboard.writeText("buyer@loopaudio.com / SandboxPass123!");
    setCopiedLogin(true);
    setTimeout(() => setCopiedLogin(false), 2000);
  };

  // 14-day horizon timeline data
  const timelineDays = [
    { label: "Thu 5", day: "Thu", date: "Nov 5", status: "covered", balance: 2197, note: "Daily sales net of PayPal fee" },
    { label: "Fri 6", day: "Fri", date: "Nov 6", status: "covered", balance: 2427, note: "Weekend audio boutique orders" },
    { label: "Sat 7", day: "Sat", date: "Nov 7", status: "covered", balance: 2667, note: "Saturday store sales" },
    { label: "Sun 8", day: "Sun", date: "Nov 8", status: "covered", balance: 2867, note: "Sunday settlement batch" },
    { label: "Mon 9", day: "Mon", date: "Nov 9", status: "covered", balance: 3077, note: "Owner bank transfer covered" },
    { label: "Tue 10", day: "Tue", date: "Nov 10", status: "covered", balance: 3327, note: "Midweek sales clear" },
    { label: "Wed 11", day: "Wed", date: "Nov 11", status: "covered", balance: 3607, note: "High cushion ($3,607 balance)" },
    {
      label: "Thu 12",
      day: "Thu",
      date: "Nov 12",
      status: isThursdayCovered ? "covered" : "short",
      balance: isThursdayCovered ? 3037 : 2947 - currentShortfall,
      note: isThursdayCovered
        ? "THURSDAY COVERED: Volta ($300) + Rent ($600) fully funded"
        : `CRUNCH DAY: Volta ($300) + Rent ($600) — -$${currentShortfall} shortfall`,
    },
    { label: "Fri 13", day: "Fri", date: "Nov 13", status: "covered", balance: 3297, note: "Post-crunch recovery day" },
    { label: "Sat 14", day: "Sat", date: "Nov 14", status: "covered", balance: 3537, note: "Weekend audio traffic" },
    { label: "Sun 15", day: "Sun", date: "Nov 15", status: "covered", balance: 3757, note: "Clean runway" },
    { label: "Mon 16", day: "Mon", date: "Nov 16", status: "covered", balance: 4007, note: "Comfortable buffer" },
    { label: "Tue 17", day: "Tue", date: "Nov 17", status: "covered", balance: 4277, note: "Pacing ahead of targets" },
    { label: "Wed 18", day: "Wed", date: "Nov 18", status: "covered", balance: 4547, note: "Full 14-day horizon clear" },
  ];

  const currentActiveDay = timelineDays[selectedDayIndex] || timelineDays[7];
  const openingBalance = story.days[0]
    ? (story.days[0].openingCents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })
    : "1,987.56";

  return (
    <div className="min-h-screen bg-white text-[#001435] font-sans antialiased selection:bg-[#0070E0]/20 selection:text-[#001435] overflow-x-hidden">
      
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
              <span>Loop Audio • ${openingBalance}</span>
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
        <section id="moment-a" className="py-12 md:py-20 space-y-16 lg:space-y-24">
          
          {/* Act 1: Thriving Business */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-5 space-y-6 text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-black text-[#001435] leading-[1.06] tracking-tight">
                Know when your money might run low.
              </h1>
              <p className="text-base sm:text-lg text-[#52627A] font-medium leading-relaxed max-w-lg">
                NeverShort watches your bills, forecasts upcoming cash flow, and protects your store before shortfalls happen.
              </p>
              <div>
                <Link
                  href="/demo"
                  className="inline-flex items-center gap-2 bg-[#0070E0] hover:bg-[#005bb8] text-white font-black text-sm sm:text-base px-8 py-3.5 rounded-full shadow-md shadow-[#0070E0]/20 transition-all hover:scale-[1.02] active:scale-95"
                >
                  <span>Try the demo</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Living Hero Illustration with Shopping Bag Delivery Animation */}
            <div className="lg:col-span-7 relative">
              <div className="relative w-full rounded-3xl overflow-hidden bg-white min-h-[320px]">
                <Image
                  src="/landing/scene_hero_custom.jpg"
                  alt="Shopkeeper serving customer at counter with calendar scroll rolling out"
                  width={1376}
                  height={768}
                  priority
                  loading="eager"
                  unoptimized
                  className="w-full h-auto object-contain transition-transform duration-700 hover:scale-[1.008]"
                />

                {/* Animated Bag Delivery */}
                <div className="absolute top-[32%] right-[22%] pointer-events-none animate-bag-handover z-20">
                  <span className="text-2xl filter drop-shadow">🛍️</span>
                </div>

                {/* Clean Bottom Calendar Hotspot (Positioned on desk, far away from faces) */}
                <div className="absolute bottom-[14%] left-[47%] -translate-x-1/2 pointer-events-auto z-20">
                  <a
                    href="#the-problem"
                    className="group relative flex items-center gap-2 bg-white/95 backdrop-blur-sm border-2 border-[#DC2626] text-[#DC2626] px-4 py-1.5 rounded-full shadow-lg text-xs font-black hover:bg-[#DC2626] hover:text-white transition-all transform hover:scale-105"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626] group-hover:bg-white animate-ping" />
                    <span>Thu 12: -$90 Crunch ↓</span>
                  </a>
                </div>
              </div>
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

                {/* Physical Bill Drop 1: Volta Audio Parts (Lands on center-right counter desk) */}
                <div className="absolute top-[52%] left-[46%] z-20 animate-bill-1">
                  <div className="bg-[#FFFDFB] border border-[#CBD5E1] shadow-[0_16px_32px_-8px_rgba(0,0,0,0.15)] rounded-2xl p-3 text-left w-44 rotate-[-4deg]">
                    <div className="flex items-center justify-between text-[10px] font-bold text-[#64748B] uppercase">
                      <span>Supplier Due</span>
                      <span className="text-[#DC2626]">Thu 12</span>
                    </div>
                    <div className="text-xs font-black text-[#001435] mt-0.5">Volta Audio Parts</div>
                    <div className="text-sm font-extrabold text-[#DC2626] mt-0.5">-$300.00</div>
                  </div>
                </div>

                {/* Physical Bill Drop 2: Rent (Lands on far right counter desk) */}
                <div className="absolute top-[60%] left-[66%] z-20 animate-bill-2">
                  <div className="bg-[#FFFDFB] border border-[#CBD5E1] shadow-[0_16px_32px_-8px_rgba(0,0,0,0.15)] rounded-2xl p-3 text-left w-44 rotate-[4deg]">
                    <div className="flex items-center justify-between text-[10px] font-bold text-[#64748B] uppercase">
                      <span>Store Rent</span>
                      <span className="text-[#DC2626]">Thu 12</span>
                    </div>
                    <div className="text-xs font-black text-[#001435] mt-0.5">Commercial Lease</div>
                    <div className="text-sm font-extrabold text-[#DC2626] mt-0.5">-$600.00</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 order-1 lg:order-2 space-y-4 text-left">
              <h2 className="text-4xl sm:text-5xl font-black text-[#001435] leading-tight tracking-tight">
                Bills don’t wait.
              </h2>
              <p className="text-base sm:text-lg text-[#52627A] font-medium leading-relaxed">
                Supplier orders, store rent, and owner payouts cluster on the exact same dates. When bills land at once, a healthy balance can plunge into the red in a single afternoon.
              </p>
            </div>
          </div>

          {/* Act 3: The Forecast Spots Trouble in Advance */}
          <div id="see-it-coming" className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center pt-8">
            <div className="lg:col-span-5 space-y-6 text-left">
              <h2 className="text-4xl sm:text-5xl font-black text-[#001435] leading-tight tracking-tight">
                See it coming.
              </h2>
              <p className="text-base sm:text-lg text-[#52627A] font-medium leading-relaxed">
                A rolling 14-day cash forecast maps every scheduled expense against expected sales after PayPal fees. You spot the gap eight days before it happens.
              </p>

              {/* Seamless Interactive 7-Day Horizon */}
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {timelineDays.slice(4, 11).map((t, sliceIdx) => {
                    const actualIdx = sliceIdx + 4;
                    const isSelected = selectedDayIndex === actualIdx;
                    const isCrunch = actualIdx === 7;
                    const isDayCovered = isCrunch ? isThursdayCovered : true;

                    return (
                      <button
                        key={t.label}
                        type="button"
                        onClick={() => setSelectedDayIndex(actualIdx)}
                        className={`py-2 px-1 rounded-xl text-center transition-all ${
                          isSelected
                            ? "ring-2 ring-[#0070E0] shadow-md scale-105"
                            : "hover:bg-[#F1F5F9]"
                        } ${
                          isDayCovered
                            ? "bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]"
                            : "bg-[#FEF2F2] text-[#DC2626] border border-[#F87171] font-bold"
                        }`}
                      >
                        <div className="text-[10px] font-semibold opacity-80">{t.day}</div>
                        <div className="text-xs font-extrabold">{t.date.split(" ")[1]}</div>
                        <div className="text-[9px] mt-1 font-bold">
                          {isDayCovered ? "✓" : `-$${currentShortfall}`}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-xs shadow-sm">
                  <div>
                    <span className="font-extrabold text-[#001435] mr-1.5">{currentActiveDay.label}:</span>
                    <span className="text-[#52627A] font-medium">{currentActiveDay.note}</span>
                  </div>
                  <div className="font-mono font-bold text-[#0070E0] whitespace-nowrap ml-3">
                    ${currentActiveDay.balance.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Magnifying Glass Floating Animation over Calendar */}
            <div className="lg:col-span-7 relative">
              <div className="relative w-full rounded-3xl overflow-hidden bg-white min-h-[320px]">
                <Image
                  src="/landing/scene_forecast_custom.jpg"
                  alt="Shopkeeper looking through magnifying glass at crunch calendar date"
                  width={1376}
                  height={768}
                  priority
                  loading="eager"
                  unoptimized
                  className="w-full h-auto object-contain transition-transform duration-500 hover:scale-[1.008]"
                />

                {/* Gliding Optical Lens Highlighting Thu 12 */}
                <div className="absolute top-[34%] right-[30%] pointer-events-none animate-lens-glide z-20">
                  <div className="w-24 h-24 rounded-full border-[3.5px] border-[#0070E0] shadow-[0_20px_50px_rgba(0,112,224,0.35)] bg-[#0070E0]/15 flex items-center justify-center backdrop-blur-[1.5px] animate-lens-pulse">
                    <span className="text-xs font-black text-[#DC2626] bg-white/95 px-2.5 py-1 rounded-full shadow-md border border-[#FCA5A5]">
                      {isThursdayCovered ? "✓ Covered" : `-$${currentShortfall}`}
                    </span>
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
                    <span>Paid! +$69.60 Net Arrived via PayPal</span>
                  </>
                ) : isAnimatingCoins ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin text-base">🔄</span>
                    <span>Capturing PayPal Sandbox Payment...</span>
                  </span>
                ) : (
                  <>
                    <span>Recover Order #83K9 ($72.00)</span>
                    <span className="opacity-75 font-normal text-xs">→</span>
                  </>
                )}
              </button>

              <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#52627A]">
                <span>Thursday Crunch Status:</span>
                <span className="font-mono font-bold text-[#001435]">
                  {isMayaPaid ? (
                    <span className="text-[#16A34A]">Reduced from -$90 to -$21</span>
                  ) : (
                    <span className="text-[#DC2626]">-$90.00 Shortfall</span>
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
              {isThursdayCovered ? "Stay one step ahead." : "Cover the gap before it hits."}
            </h2>

            {/* TRUTHFUL NARRATIVE: Changes strictly based on actual math state */}
            {!isThursdayCovered && !isMayaPaid && sliderStep === 0 && (
              <p className="text-base sm:text-lg text-[#52627A] font-medium leading-relaxed max-w-2xl mx-auto">
                On Thursday 12 Nov, Loop Audio faces a <span className="font-bold text-[#DC2626]">-$90.00 crunch</span> when Volta Audio Parts ($300) and rent ($600) fall due on the same day. Recover Maya&apos;s dropped checkout above, or set aside a small daily amount from sales below to bridge the gap.
              </p>
            )}

            {!isThursdayCovered && isMayaPaid && sliderStep === 0 && (
              <p className="text-base sm:text-lg text-[#52627A] font-medium leading-relaxed max-w-2xl mx-auto">
                Maya&apos;s recovered order captured $69.60 net, reducing Thursday&apos;s shortfall to <span className="font-bold text-[#DC2626]">-$21.00</span>. Set aside just $7 a day from routine daily sales below to fully cover Thursday.
              </p>
            )}

            {!isThursdayCovered && sliderStep > 0 && (
              <p className="text-base sm:text-lg text-[#52627A] font-medium leading-relaxed max-w-2xl mx-auto">
                Setting aside ${sliderStep * 21}.00 reduces Thursday&apos;s gap to <span className="font-bold text-[#DC2626]">-${currentShortfall}.00</span>. Increase your daily set-aside or recover Maya&apos;s checkout above to fully protect your cash flow.
              </p>
            )}

            {isThursdayCovered && (
              <p className="text-base sm:text-lg text-[#52627A] font-medium leading-relaxed max-w-2xl mx-auto">
                <span className="font-bold text-[#16A34A]">Thursday 12 Nov is 100% covered.</span> {isMayaPaid ? `Maya's recovered checkout ($69.60 net) combined with your daily set-aside ($${savedAmount}) covers both Volta and store rent.` : `Your daily set-aside of $${savedAmount} completely bridges the gap without any emergency loans or missed bills.`}
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

            {/* Tactile Stamp Slam: ONLY appears when Thursday is mathematically 100% covered */}
            {isThursdayCovered && (
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
              <span className="text-[#64748B]">Set aside from daily sales:</span>
              <span className="text-[#0070E0] text-sm font-mono font-black">${sliderStep * 7}.00 / day (${sliderStep * 21}.00 total)</span>
            </div>

            <input
              type="range"
              min="0"
              max="3"
              step="1"
              value={sliderStep}
              onChange={(e) => setSliderStep(Number(e.target.value))}
              className="w-full accent-[#0070E0] cursor-pointer"
              aria-label="Daily set aside amount"
            />

            <div className="flex justify-between text-[11px] text-[#94A3B8] font-bold">
              <span>$0/day</span>
              <span>$7/day</span>
              <span>$14/day</span>
              <span>$21/day</span>
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
              <span className="text-[#64748B] font-semibold">Thursday 12 Nov Status:</span>
              <span
                className={`font-mono font-black text-sm ${
                  isThursdayCovered ? "text-[#16A34A]" : "text-[#DC2626]"
                }`}
              >
                {isThursdayCovered ? "FULLY COVERED ✓" : `-$${currentShortfall}.00 SHORT`}
              </span>
            </div>
          </div>

          {/* Grand Finale CTAs */}
          <div className="pt-8 text-center space-y-4 max-w-xl mx-auto">
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/demo"
                className="bg-[#0070E0] hover:bg-[#005bb8] text-white font-black text-base sm:text-lg px-10 py-4 rounded-full shadow-lg shadow-[#0070E0]/25 transition-all hover:scale-105 active:scale-95"
              >
                Launch Demo Store →
              </Link>
              <Link
                href="/today"
                className="bg-[#001435] hover:bg-[#002868] text-white font-bold text-base px-8 py-4 rounded-full shadow transition-all hover:scale-[1.02]"
              >
                Open Live Store Till ↗
              </Link>
            </div>

            {/* Sandbox Credentials Badge with 1-Click Copy */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="text-xs text-[#64748B] hover:text-[#001435] inline-flex items-center gap-1.5 transition-colors bg-[#F1F5F9] hover:bg-[#E2E8F0] px-3.5 py-1.5 rounded-full border border-[#CBD5E1]"
              >
                <span>PayPal Sandbox Buyer:</span>
                <code className="font-mono text-[#0070E0] font-bold">
                  buyer@loopaudio.com
                </code>
                <span>{copiedLogin ? "✓ Copied!" : "(Click to copy)"}</span>
              </button>
            </div>

            <div>
              <button
                type="button"
                onClick={handleResetStory}
                className="text-xs text-[#94A3B8] hover:text-[#64748B] underline transition-colors"
              >
                Reset Story to Day 1
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#F1F5F9] bg-white py-12 px-6">
        <div className="max-w-6xl xl:max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[#64748B]">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-[#001435] text-base">NeverShort</span>
            <span>•</span>
            <span>PayPal AI Hackathon 2026</span>
          </div>

          <div className="flex items-center gap-6 font-semibold">
            <Link href="/demo" className="hover:text-[#0070E0]">Judge Walkthrough</Link>
            <Link href="/today" className="hover:text-[#0070E0]">Store Till</Link>
            <Link href="/" className="hover:text-[#0070E0]">Home</Link>
          </div>

          <div className="text-[11px] text-[#94A3B8]">
            Simulated store copy per visitor. PayPal Sandbox only.
          </div>
        </div>
      </footer>
    </div>
  );
}
