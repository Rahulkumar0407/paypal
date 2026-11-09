"use client";

import React from "react";
import Link from "next/link";

interface ScenicFooterV2Props {
  onResetStory?: () => void;
}

export function ScenicFooterV2({ onResetStory }: ScenicFooterV2Props) {
  return (
    <footer className="w-full bg-gradient-to-b from-[#F8FAFC] via-[#FFFDF9] to-[#F5F2EB] text-[#001435] overflow-hidden select-none border-t border-[#E2E8F0]/70">
      {/* ── 1. SCENIC ILLUSTRATED CTA BAND ── */}
      <section
        aria-label="Call to action"
        className="relative w-full pt-16 sm:pt-20 pb-0 overflow-hidden"
      >
        {/* Subtle ambient radial sunlit glow in the upper center */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[340px] bg-radial from-[#FEEFB3]/35 via-[#E0F2FE]/25 to-transparent blur-3xl -z-10"
        />

        {/* Content Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col lg:flex-row items-end justify-between gap-8 lg:gap-4 relative z-10">
            
            {/* ── LEFT SCENE: Storefront Boutique ("Loop Audio") ── */}
            <div className="w-full sm:w-[320px] md:w-[360px] lg:w-[380px] xl:w-[400px] shrink-0 mx-auto lg:mx-0 flex flex-col items-center lg:items-start order-2 lg:order-1">
              <svg
                viewBox="0 0 380 280"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-auto max-w-[360px] sm:max-w-[380px] drop-shadow-sm select-none"
                aria-label="Illustrated Loop Audio storefront"
              >
                <defs>
                  {/* Awning drop shadow */}
                  <filter id="awningDropShadow" x="-10%" y="0%" width="120%" height="150%">
                    <feDropShadow dx="0" dy="7" stdDeviation="5" floodColor="#001435" floodOpacity="0.12" />
                  </filter>
                  <filter id="boardDropShadow" x="-10%" y="0%" width="120%" height="140%">
                    <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#001435" floodOpacity="0.15" />
                  </filter>
                  {/* Warm window interior glow */}
                  <linearGradient id="windowGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.95" />
                    <stop offset="60%" stopColor="#FFFBEB" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#FDE68A" stopOpacity="0.75" />
                  </linearGradient>
                  {/* Awning Blue Stripe */}
                  <linearGradient id="awningBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0070E0" />
                    <stop offset="100%" stopColor="#0058B3" />
                  </linearGradient>
                  {/* Facade plaster gradient */}
                  <linearGradient id="facadeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F8F3E6" />
                    <stop offset="100%" stopColor="#EDE5D3" />
                  </linearGradient>
                </defs>

                {/* Sky / wall baseline backdrop */}
                <rect x="10" y="40" width="350" height="230" rx="4" fill="url(#facadeGrad)" stroke="#DFD7C2" strokeWidth="2" />

                {/* Decorative architectural cornices & dentil molding at roofline */}
                <rect x="6" y="32" width="358" height="10" rx="2" fill="#D6CBB5" />
                <rect x="2" y="26" width="366" height="8" rx="2" fill="#C7BBA2" />

                {/* Upper Fascia Sign: "LOOP AUDIO • AUDIO GEAR" */}
                <rect x="24" y="46" width="322" height="34" rx="4" fill="#001435" stroke="#002255" strokeWidth="1.5" />
                <rect x="28" y="50" width="314" height="26" rx="2" fill="none" stroke="#FBBF24" strokeWidth="0.75" strokeDasharray="3 3" />
                <text x="185" y="67" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="900" letterSpacing="2.5" fontFamily="var(--font-sans, system-ui)">
                  LOOP AUDIO
                </text>
                <text x="185" y="74" textAnchor="middle" fill="#93C5FD" fontSize="6.5" fontWeight="700" letterSpacing="1.8" fontFamily="var(--font-sans, system-ui)">
                  AUDIO • INSTRUMENTS • GEAR
                </text>

                {/* ── STORE DISPLAY WINDOW (Left side) ── */}
                <rect x="24" y="112" width="194" height="136" rx="4" fill="#6B4F35" />
                <rect x="28" y="116" width="186" height="128" rx="2" fill="url(#windowGlow)" />
                
                {/* Inside window display: Shelves, speaker monitor, headphone stand */}
                <rect x="36" y="196" width="170" height="6" rx="1.5" fill="#B45309" />
                {/* Turntable / speaker silhouette */}
                <rect x="44" y="162" width="42" height="34" rx="3" fill="#1E293B" />
                <circle cx="65" cy="179" r="10" fill="#334155" />
                <circle cx="65" cy="179" r="4" fill="#0070E0" />
                {/* Headphone display stand */}
                <path d="M120 160 C120 150 144 150 144 160 L144 186 C144 188 140 190 132 190 C124 190 120 188 120 186 Z" fill="#475569" />
                <path d="M122 158 C122 147 142 147 142 158" stroke="#0070E0" strokeWidth="4" strokeLinecap="round" fill="none" />
                <rect x="117" y="162" width="7" height="13" rx="3.5" fill="#001435" />
                <rect x="140" y="162" width="7" height="13" rx="3.5" fill="#001435" />
                {/* Hanging pendant bulb inside shop */}
                <line x1="120" y1="116" x2="120" y2="134" stroke="#78350F" strokeWidth="1.5" />
                <path d="M112 134 Q120 130 128 134 L126 138 L114 138 Z" fill="#F59E0B" />
                <circle cx="120" cy="140" r="3.5" fill="#FEF08A" />

                {/* Window panes dividers (wooden mullions) */}
                <line x1="120" y1="116" x2="120" y2="244" stroke="#6B4F35" strokeWidth="3" />
                <line x1="28" y1="180" x2="214" y2="180" stroke="#6B4F35" strokeWidth="2.5" />
                {/* Window glass reflections */}
                <path d="M40 122 L110 122 L70 236 L32 236 Z" fill="#FFFFFF" fillOpacity="0.22" />
                <path d="M130 122 L180 122 L150 210 L124 210 Z" fill="#FFFFFF" fillOpacity="0.16" />

                {/* ── STORE FRONT ENTRANCE DOOR (Right side) ── */}
                <rect x="232" y="108" width="114" height="142" rx="3" fill="#6B4F35" />
                {/* Door Frame & Upper Transom Window */}
                <rect x="238" y="114" width="102" height="42" rx="2" fill="url(#windowGlow)" stroke="#543A26" strokeWidth="2" />
                <line x1="289" y1="114" x2="289" y2="156" stroke="#543A26" strokeWidth="2" />
                {/* Door Wood Panels */}
                <rect x="238" y="162" width="102" height="88" rx="2" fill="#854D0E" stroke="#543A26" strokeWidth="2" />
                <rect x="246" y="170" width="38" height="34" rx="2" fill="#A16207" stroke="#78350F" strokeWidth="1.5" />
                <rect x="294" y="170" width="38" height="34" rx="2" fill="#A16207" stroke="#78350F" strokeWidth="1.5" />
                <rect x="246" y="210" width="38" height="34" rx="2" fill="#A16207" stroke="#78350F" strokeWidth="1.5" />
                <rect x="294" y="210" width="38" height="34" rx="2" fill="#A16207" stroke="#78350F" strokeWidth="1.5" />
                {/* Polished Brass Door Handle */}
                <rect x="242" y="196" width="3" height="16" rx="1.5" fill="#FBBF24" />
                <circle cx="243.5" cy="204" r="2.5" fill="#D97706" />

                {/* ── BLUE & WHITE STRIPED CANOPY / AWNING ── */}
                <g filter="url(#awningDropShadow)">
                  {/* Awning main slope (top pitch) */}
                  {/* 10 alternating stripes of blue and white */}
                  <polygon points="12,82 48,82 42,106 8,106" fill="url(#awningBlue)" />
                  <polygon points="48,82 84,82 80,106 42,106" fill="#FFFFFF" />
                  <polygon points="84,82 120,82 118,106 80,106" fill="url(#awningBlue)" />
                  <polygon points="120,82 156,82 156,106 118,106" fill="#FFFFFF" />
                  <polygon points="156,82 192,82 194,106 156,106" fill="url(#awningBlue)" />
                  <polygon points="192,82 228,82 232,106 194,106" fill="#FFFFFF" />
                  <polygon points="228,82 264,82 270,106 232,106" fill="url(#awningBlue)" />
                  <polygon points="264,82 300,82 308,106 270,106" fill="#FFFFFF" />
                  <polygon points="300,82 336,82 346,106 308,106" fill="url(#awningBlue)" />
                  <polygon points="336,82 358,82 368,106 346,106" fill="#FFFFFF" />

                  {/* Scalloped hanging valance edge (bottom trim) */}
                  <path d="M8 106 Q25 116 42 106 Q61 116 80 106 Q99 116 118 106 Q137 116 156 106 Q175 116 194 106 Q213 116 232 106 Q251 116 270 106 Q289 116 308 106 Q327 116 346 106 Q357 116 368 106 L368 110 Q357 120 346 110 Q327 120 308 110 Q289 120 270 110 Q251 120 232 110 Q213 120 194 110 Q175 120 156 110 Q137 120 118 110 Q99 120 80 110 Q61 120 42 110 Q25 120 8 110 Z" fill="#0058B3" />
                  
                  {/* Front scallops individual fills matching the stripes */}
                  <path d="M8 106 Q25 116 42 106 L42 109 Q25 119 8 109 Z" fill="#0070E0" />
                  <path d="M42 106 Q61 116 80 106 L80 109 Q61 119 42 109 Z" fill="#F8FAFC" />
                  <path d="M80 106 Q99 116 118 106 L118 109 Q99 119 80 109 Z" fill="#0070E0" />
                  <path d="M118 106 Q137 116 156 106 L156 109 Q137 119 118 109 Z" fill="#F8FAFC" />
                  <path d="M156 106 Q175 116 194 106 L194 109 Q175 119 156 109 Z" fill="#0070E0" />
                  <path d="M194 106 Q213 116 232 106 L232 109 Q213 119 194 109 Z" fill="#F8FAFC" />
                  <path d="M232 106 Q251 116 270 106 L270 109 Q251 119 232 109 Z" fill="#0070E0" />
                  <path d="M270 106 Q289 116 308 106 L308 109 Q289 119 270 109 Z" fill="#F8FAFC" />
                  <path d="M308 106 Q327 116 346 106 L346 109 Q327 119 308 109 Z" fill="#0070E0" />
                  <path d="M346 106 Q357 116 368 106 L368 109 Q357 119 346 109 Z" fill="#F8FAFC" />
                </g>

                {/* ── SIDEWALK & PAVEMENT GROUND LINE ── */}
                <rect x="0" y="248" width="380" height="32" fill="#E2E8F0" />
                <line x1="0" y1="248" x2="380" y2="248" stroke="#CBD5E1" strokeWidth="2.5" />
                {/* Sidewalk stone joint lines */}
                <line x1="70" y1="248" x2="50" y2="280" stroke="#CBD5E1" strokeWidth="1.5" />
                <line x1="160" y1="248" x2="140" y2="280" stroke="#CBD5E1" strokeWidth="1.5" />
                <line x1="250" y1="248" x2="230" y2="280" stroke="#CBD5E1" strokeWidth="1.5" />
                <line x1="330" y1="248" x2="310" y2="280" stroke="#CBD5E1" strokeWidth="1.5" />

                {/* ── BOTANICAL PLANTERS (Potted plants at front entrance) ── */}
                <g className="scenic-plant-breeze">
                  {/* Planter 1: Large ceramic pot */}
                  <path d="M12 254 L16 238 L36 238 L40 254 Z" fill="#EA580C" stroke="#C2410C" strokeWidth="1.5" />
                  <rect x="14" y="235" width="24" height="4" rx="1.5" fill="#F97316" />
                  {/* Leaves cluster */}
                  <ellipse cx="26" cy="226" rx="11" ry="14" fill="#15803D" />
                  <ellipse cx="18" cy="229" rx="8" ry="11" fill="#16A34A" />
                  <ellipse cx="34" cy="229" rx="8" ry="11" fill="#22C55E" />
                  <ellipse cx="26" cy="220" rx="7" ry="10" fill="#4ADE80" />

                  {/* Planter 2: Terracotta square planter */}
                  <path d="M42 254 L44 242 L66 242 L68 254 Z" fill="#D97706" stroke="#B45309" strokeWidth="1.5" />
                  <rect x="43" y="239" width="24" height="4" rx="1.5" fill="#F59E0B" />
                  {/* Fern / leafy shrub */}
                  <ellipse cx="55" cy="232" rx="9" ry="12" fill="#166534" />
                  <ellipse cx="48" cy="234" rx="7" ry="9" fill="#15803D" />
                  <ellipse cx="62" cy="234" rx="7" ry="9" fill="#22C55E" />
                </g>

                {/* ── A-FRAME SIDEWALK CHALKBOARD SIGN ("Loop Audio") ── */}
                <g filter="url(#boardDropShadow)">
                  {/* Wooden easel back legs */}
                  <line x1="96" y1="228" x2="88" y2="268" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
                  <line x1="130" y1="228" x2="138" y2="268" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
                  {/* Front chalkboard board with wooden frame */}
                  <polygon points="90,214 136,214 142,266 84,266" fill="#9A3412" stroke="#78350F" strokeWidth="2" />
                  <polygon points="94,218 132,218 137,260 89,260" fill="#1E293B" />
                  {/* Chalkboard text */}
                  <text x="113" y="230" textAnchor="middle" fill="#FFFFFF" fontSize="6.5" fontWeight="900" letterSpacing="0.8" fontFamily="var(--font-sans, system-ui)">
                    Loop Audio
                  </text>
                  <line x1="100" y1="233" x2="126" y2="233" stroke="#FBBF24" strokeWidth="0.8" />
                  <text x="113" y="242" textAnchor="middle" fill="#E2E8F0" fontSize="5.2" fontWeight="700" letterSpacing="0.4" fontFamily="var(--font-sans, system-ui)">
                    Audio Repairs
                  </text>
                  <text x="113" y="251" textAnchor="middle" fill="#93C5FD" fontSize="4.8" fontWeight="600" letterSpacing="0.5" fontFamily="var(--font-sans, system-ui)">
                    Open Today ♫
                  </text>
                  {/* Chalkboard hinge */}
                  <circle cx="113" cy="214" r="2.5" fill="#CBD5E1" />
                </g>
              </svg>
            </div>

            {/* ── CENTER: PRIMARY HERO CTA CONTENT ── */}
            <div className="w-full lg:flex-1 max-w-xl mx-auto text-center px-4 pt-2 pb-10 sm:pb-12 z-20 order-1 lg:order-2">
              {/* Eyebrow badge */}
              <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-[#0070E0]/10 border border-[#0070E0]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0070E0] animate-pulse" />
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-[0.22em] text-[#0070E0]">
                  BE PREPARED, NOT SURPRISED
                </span>
              </div>

              {/* Bold headline matching reference */}
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#001435] leading-[1.12] tracking-tight mb-6">
                See tomorrow’s cash flow today.
              </h2>

              {/* Primary CTA Button */}
              <div className="flex items-center justify-center mb-3">
                <Link
                  href="/demo"
                  className="inline-flex items-center justify-center gap-2.5 bg-[#0070E0] hover:bg-[#005bb8] text-white font-black text-base sm:text-lg px-10 py-4 rounded-full shadow-xl shadow-[#0070E0]/30 transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-hidden focus:ring-4 focus:ring-[#0070E0]/30"
                >
                  <span>Try the demo</span>
                  <span className="text-xl leading-none transition-transform duration-200 group-hover:translate-x-1">→</span>
                </Link>
              </div>

              {/* Optional Discreet Story Reset */}
              {onResetStory && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onResetStory}
                    className="text-[11px] text-[#94A3B8] hover:text-[#475569] underline transition-colors cursor-pointer"
                  >
                    Reset interactive story
                  </button>
                </div>
              )}
            </div>

            {/* ── RIGHT SCENE: Park Trees & Rolling Greenery ── */}
            <div className="w-full sm:w-[320px] md:w-[360px] lg:w-[380px] xl:w-[400px] shrink-0 mx-auto lg:mx-0 flex flex-col items-center lg:items-end order-3">
              <svg
                viewBox="0 0 380 280"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-auto max-w-[360px] sm:max-w-[380px] drop-shadow-sm select-none"
                aria-label="Illustrated park trees and landscape"
              >
                <defs>
                  {/* Foliage Gradients */}
                  <linearGradient id="treeDeepGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#15803D" />
                    <stop offset="100%" stopColor="#14532D" />
                  </linearGradient>
                  <linearGradient id="treeMidGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22C55E" />
                    <stop offset="100%" stopColor="#15803D" />
                  </linearGradient>
                  <linearGradient id="treeLightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#86EFAC" />
                    <stop offset="100%" stopColor="#22C55E" />
                  </linearGradient>
                  <linearGradient id="hillGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4ADE80" />
                    <stop offset="100%" stopColor="#16A34A" />
                  </linearGradient>
                </defs>

                {/* Background Rolling Hill / Grassy Knoll */}
                <path d="M-20 252 Q90 205 240 220 Q320 228 400 216 L400 280 L-20 280 Z" fill="url(#hillGrad)" />
                <path d="M80 248 Q180 216 320 234 Q360 240 400 238 L400 280 L80 280 Z" fill="#15803D" fillOpacity="0.35" />

                {/* ── TREE 1 (Background soft birch/poplar tree) ── */}
                <g className="scenic-sway-2">
                  {/* Trunk */}
                  <path d="M120 248 C120 200 134 160 138 120" stroke="#78350F" strokeWidth="5.5" strokeLinecap="round" />
                  <path d="M136 150 C146 140 156 134 164 132" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
                  {/* Light layered canopy */}
                  <circle cx="140" cy="110" r="34" fill="#86EFAC" fillOpacity="0.8" />
                  <circle cx="160" cy="118" r="26" fill="#4ADE80" fillOpacity="0.75" />
                  <circle cx="124" cy="118" r="24" fill="#22C55E" fillOpacity="0.85" />
                </g>

                {/* ── TREE 2 (Center stately oak tree with lush canopy) ── */}
                <g className="scenic-sway-1">
                  {/* Root flares and thick curved trunk */}
                  <path d="M228 254 Q232 200 242 140 Q246 110 248 86" stroke="#5C3317" strokeWidth="12" strokeLinecap="round" />
                  {/* Main branches */}
                  <path d="M242 160 Q220 136 198 124" stroke="#5C3317" strokeWidth="6" strokeLinecap="round" />
                  <path d="M245 142 Q270 120 292 108" stroke="#5C3317" strokeWidth="6" strokeLinecap="round" />
                  <path d="M240 178 Q260 162 278 156" stroke="#5C3317" strokeWidth="4.5" strokeLinecap="round" />

                  {/* Dense layered green canopy clusters */}
                  {/* Bottom shadow volume */}
                  <circle cx="198" cy="120" r="38" fill="url(#treeDeepGrad)" />
                  <circle cx="288" cy="106" r="38" fill="url(#treeDeepGrad)" />
                  <circle cx="248" cy="80" r="46" fill="url(#treeDeepGrad)" />

                  {/* Mid-tone canopy leaf clumps */}
                  <circle cx="194" cy="112" r="34" fill="url(#treeMidGrad)" />
                  <circle cx="292" cy="98" r="34" fill="url(#treeMidGrad)" />
                  <circle cx="244" cy="72" r="42" fill="url(#treeMidGrad)" />
                  <circle cx="218" cy="88" r="32" fill="url(#treeMidGrad)" />
                  <circle cx="270" cy="82" r="32" fill="url(#treeMidGrad)" />

                  {/* Sunlight canopy highlights */}
                  <circle cx="236" cy="60" r="30" fill="url(#treeLightGrad)" />
                  <circle cx="264" cy="68" r="24" fill="url(#treeLightGrad)" />
                  <circle cx="190" cy="100" r="22" fill="url(#treeLightGrad)" />
                  <circle cx="298" cy="88" r="20" fill="url(#treeLightGrad)" />
                </g>

                {/* ── TREE 3 (Right edge foreground spreading tree) ── */}
                <g className="scenic-sway-2">
                  <path d="M338 252 Q342 190 350 144" stroke="#78350F" strokeWidth="9" strokeLinecap="round" />
                  <path d="M346 170 Q324 150 312 142" stroke="#78350F" strokeWidth="4.5" strokeLinecap="round" />
                  <circle cx="316" cy="136" r="28" fill="url(#treeDeepGrad)" />
                  <circle cx="352" cy="122" r="36" fill="url(#treeMidGrad)" />
                  <circle cx="344" cy="108" r="28" fill="url(#treeLightGrad)" />
                </g>

                {/* Ground Grass Tufts & Small Wildflowers */}
                <g>
                  {/* Bush clumps on hillside */}
                  <ellipse cx="140" cy="242" rx="22" ry="10" fill="#15803D" />
                  <ellipse cx="152" cy="240" rx="16" ry="8" fill="#22C55E" />
                  <ellipse cx="280" cy="246" rx="26" ry="11" fill="#15803D" />
                  <ellipse cx="292" cy="244" rx="18" ry="8" fill="#4ADE80" />

                  {/* Tiny sunny flower dots */}
                  <circle cx="160" cy="240" r="2.5" fill="#FEF08A" />
                  <circle cx="172" cy="243" r="2" fill="#F472B6" />
                  <circle cx="265" cy="247" r="2.5" fill="#FEF08A" />
                  <circle cx="305" cy="248" r="2" fill="#93C5FD" />
                </g>

                {/* Connecting Sidewalk / Pavement Baseline */}
                <rect x="0" y="248" width="120" height="32" fill="#E2E8F0" />
                <line x1="0" y1="248" x2="120" y2="248" stroke="#CBD5E1" strokeWidth="2.5" />
                <line x1="40" y1="248" x2="20" y2="280" stroke="#CBD5E1" strokeWidth="1.5" />
                <line x1="90" y1="248" x2="70" y2="280" stroke="#CBD5E1" strokeWidth="1.5" />
                {/* Grass verge overlap */}
                <path d="M110 248 Q130 246 160 252 L120 280 L90 280 Z" fill="#22C55E" fillOpacity="0.4" />
              </svg>
            </div>

          </div>
        </div>
      </section>

      {/* ── 2. BOTTOM MINIMAL LEGAL & NAVIGATION BAR ── */}
      <div className="w-full border-t border-[#E2E8F0] bg-white py-6 px-4 sm:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5 text-xs sm:text-sm text-[#64748B]">
          
          {/* Left: Logo & Descriptor */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-2.5">
            <span className="font-black text-[#001435] text-base tracking-tight">
              NeverShort
            </span>
            <span className="text-[#CBD5E1]">•</span>
            <span className="text-xs sm:text-[13px] text-[#64748B] font-medium">
              The cash-flow co-pilot for small business
            </span>
          </div>

          {/* Center: Storybook Nav Links */}
          <nav
            aria-label="Footer Navigation"
            className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 font-semibold text-xs sm:text-[13px] text-[#475569]"
          >
            <a href="#story" className="hover:text-[#0070E0] transition-colors">
              The Story
            </a>
            <a href="#future-lens" className="hover:text-[#0070E0] transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-[#0070E0] transition-colors">
              How It Works
            </a>
            <Link href="/demo" className="hover:text-[#0070E0] transition-colors">
              The App
            </Link>
          </nav>

          {/* Right: Copyright notice */}
          <div className="text-[11px] sm:text-xs text-[#94A3B8] font-normal text-center md:text-right">
            © 2025 NeverShort. All rights reserved.
          </div>

        </div>
      </div>
    </footer>
  );
}
