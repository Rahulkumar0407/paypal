import React from "react";

interface CashflowForecastSvgProps {
  isCovered?: boolean;
  shortfall?: number;
  selectedDayIndex?: number;
  className?: string;
}

export function CashflowForecastSvg({
  isCovered = false,
  shortfall = 90,
  selectedDayIndex = 7,
  className = "",
}: CashflowForecastSvgProps) {
  // 14 days data points mapping to SVG coordinates
  // X range: 80 to 920. Step ~ 64.6
  // Y range: 100 (high balance ~$3600) to 460 (zero/negative balance)
  const days = [
    { label: "Thu 5", balance: 2197, x: 90, y: 280 },
    { label: "Fri 6", balance: 2427, x: 154, y: 255 },
    { label: "Sat 7", balance: 2667, x: 218, y: 230 },
    { label: "Sun 8", balance: 2867, x: 282, y: 210 },
    { label: "Mon 9", balance: 3077, x: 346, y: 190 },
    { label: "Tue 10", balance: 3327, x: 410, y: 165 },
    { label: "Wed 11", balance: 3607, x: 474, y: 140 },
    // Thu 12 is the crunch day!
    {
      label: "Thu 12",
      balance: isCovered ? 210 : -shortfall,
      x: 538,
      y: isCovered ? 430 : 490,
      isCrunch: true,
    },
    { label: "Fri 13", balance: isCovered ? 380 : 120, x: 602, y: isCovered ? 410 : 445 },
    { label: "Sat 14", balance: isCovered ? 620 : 360, x: 666, y: isCovered ? 390 : 425 },
    { label: "Sun 15", balance: isCovered ? 830 : 570, x: 730, y: isCovered ? 370 : 405 },
    { label: "Mon 16", balance: isCovered ? 1040 : 780, x: 794, y: isCovered ? 350 : 385 },
    { label: "Tue 17", balance: isCovered ? 1290 : 1030, x: 858, y: isCovered ? 325 : 360 },
    { label: "Wed 18", balance: isCovered ? 1540 : 1280, x: 922, y: isCovered ? 300 : 335 },
  ];

  // SVG path generation
  const pathD = days.reduce(
    (acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`,
    ""
  );

  const fillAreaD = `${pathD} L 922 470 L 90 470 Z`;

  const crunchDay = days[7];

  return (
    <svg
      viewBox="0 0 1000 560"
      className={`w-full h-auto select-none ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="14-day cash flow forecast timeline showing cash dip on Thursday November 12"
    >
      <defs>
        {/* Soft paper backdrop gradient */}
        <linearGradient id="cf-bg" x1="0" y1="0" x2="0" y2="560" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F9FAF7" />
          <stop offset="100%" stopColor="#F1F4EE" />
        </linearGradient>

        {/* Emerald curve gradient for healthy balance */}
        <linearGradient id="cf-healthy-curve" x1="0" y1="140" x2="0" y2="470" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E9E5E" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#1E9E5E" stopOpacity="0.02" />
        </linearGradient>

        {/* Warning shortfall curve gradient */}
        <linearGradient id="cf-shortfall-curve" x1="0" y1="140" x2="0" y2="520" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E9E5E" stopOpacity="0.25" />
          <stop offset="70%" stopColor="#F2A93B" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#E5484D" stopOpacity="0.35" />
        </linearGradient>

        {/* Optical Glass Lens filter & gradient */}
        <radialGradient id="cf-lens-glass" cx="48%" cy="42%" r="60%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="40%" stopColor="#0070E0" stopOpacity="0.12" />
          <stop offset="85%" stopColor="#005BB8" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#003E8A" stopOpacity="0.4" />
        </radialGradient>

        <filter id="cf-lens-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="16" stdDeviation="18" floodColor="#0070E0" floodOpacity="0.3" />
        </filter>

        <filter id="cf-paper-shadow" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#14201B" floodOpacity="0.06" />
        </filter>
      </defs>

      {/* Frame / Matte */}
      <rect width="1000" height="560" rx="24" fill="url(#cf-bg)" />
      <rect x="1.5" y="1.5" width="997" height="557" rx="22.5" stroke="#E2E8F0" strokeWidth="2" />

      {/* Top Ledger Header Bar */}
      <rect x="24" y="24" width="952" height="52" rx="12" fill="#FFFFFF" filter="url(#cf-paper-shadow)" />
      <circle cx="52" cy="50" r="14" fill="#0E3B2C" />
      <path d="M48 50L51 53L56 47" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <text x="76" y="55" fill="#14201B" fontSize="15" fontWeight="800" fontFamily="system-ui, sans-serif">
        14-DAY CASH HORIZON FORECAST
      </text>
      <text x="360" y="55" fill="#52605B" fontSize="13" fontWeight="500" fontFamily="system-ui, sans-serif">
        Loop Audio • Real-time Net Settlement Projection (Nov 5 – Nov 18)
      </text>

      {/* Status indicator on top right */}
      <g transform="translate(810, 36)">
        <rect
          width="150"
          height="28"
          rx="14"
          fill={isCovered ? "#DCFCE7" : "#FEE2E2"}
          stroke={isCovered ? "#86EFAC" : "#FCA5A5"}
          strokeWidth="1.5"
        />
        <circle cx="16" cy="14" r="5" fill={isCovered ? "#16A34A" : "#DC2626"} />
        <text
          x="30"
          y="18"
          fill={isCovered ? "#166534" : "#991B1B"}
          fontSize="11"
          fontWeight="800"
          fontFamily="system-ui, sans-serif"
        >
          {isCovered ? "ALL DAYS COVERED" : "SHORTFALL DETECTED"}
        </text>
      </g>

      {/* Grid Lines & Axis */}
      <g stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 4">
        {/* Horizontal balance guide lines */}
        <line x1="80" y1="140" x2="940" y2="140" />
        <line x1="80" y1="220" x2="940" y2="220" />
        <line x1="80" y1="300" x2="940" y2="300" />
        <line x1="80" y1="380" x2="940" y2="380" />
      </g>

      {/* Balance Y-axis labels */}
      <g fill="#94A3B8" fontSize="10" fontWeight="700" fontFamily="monospace" textAnchor="end">
        <text x="72" y="144">$3,600</text>
        <text x="72" y="224">$2,700</text>
        <text x="72" y="304">$1,800</text>
        <text x="72" y="384">$900</text>
        <text x="72" y="464">$0</text>
      </g>

      {/* ZERO THRESHOLD LINE (Solid warning guide) */}
      <line x1="80" y1="460" x2="940" y2="460" stroke="#CBD5E1" strokeWidth="1.5" />
      <rect x="80" y="460" width="860" height="40" fill="#EF4444" fillOpacity="0.04" />

      {/* Balance Area Fill */}
      <path
        d={fillAreaD}
        fill={isCovered ? "url(#cf-healthy-curve)" : "url(#cf-shortfall-curve)"}
        className="transition-all duration-700 ease-in-out"
      />

      {/* Main Cashflow Curve */}
      <path
        d={pathD}
        fill="none"
        stroke={isCovered ? "#1E9E5E" : "#E5484D"}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-700 ease-in-out"
      />

      {/* Day Columns, Dots & X-axis Labels */}
      {days.map((d, index) => {
        const isSelected = index === selectedDayIndex;
        const isThu12 = d.isCrunch;

        return (
          <g key={d.label}>
            {/* Vertical tick guide */}
            <line
              x1={d.x}
              y1={96}
              x2={d.x}
              y2={468}
              stroke={isThu12 ? (isCovered ? "#16A34A" : "#EF4444") : isSelected ? "#0070E0" : "#F1F5F9"}
              strokeWidth={isThu12 ? "2" : "1"}
              strokeDasharray={isThu12 ? "3 3" : undefined}
            />

            {/* Day marker dot */}
            <circle
              cx={d.x}
              cy={d.y}
              r={isThu12 ? "7" : isSelected ? "6" : "4.5"}
              fill={isThu12 ? (isCovered ? "#16A34A" : "#DC2626") : "#FFFFFF"}
              stroke={isThu12 ? "#FFFFFF" : "#0E3B2C"}
              strokeWidth={isThu12 ? "2.5" : "2"}
            />

            {/* Day Text Labels at Bottom */}
            <rect
              x={d.x - 24}
              y={482}
              width="48"
              height="28"
              rx="6"
              fill={isThu12 ? (isCovered ? "#DCFCE7" : "#FEE2E2") : isSelected ? "#0E3B2C" : "transparent"}
            />
            <text
              x={d.x}
              y={500}
              textAnchor="middle"
              fill={isThu12 ? (isCovered ? "#166534" : "#B91C1C") : isSelected ? "#FFFFFF" : "#64748B"}
              fontSize="11"
              fontWeight={isThu12 || isSelected ? "800" : "600"}
              fontFamily="system-ui, sans-serif"
            >
              {d.label}
            </text>
          </g>
        );
      })}

      {/* ── OPTICAL MAGNIFYING LENS FOCUSED ON THU 12 ── */}
      <g transform={`translate(${crunchDay.x - 70}, ${crunchDay.y - 70})`} filter="url(#cf-lens-shadow)">
        {/* Brass Lens Handle & Rim */}
        <circle cx="70" cy="70" r="64" fill="url(#cf-lens-glass)" stroke="#0070E0" strokeWidth="4.5" />
        <circle cx="70" cy="70" r="61" fill="none" stroke="#60A5FA" strokeWidth="1.5" strokeOpacity="0.8" />

        {/* Specular Glint Highlight on glass curve */}
        <path
          d="M32 46C42 32 60 24 82 24C92 24 100 27 106 31"
          stroke="#FFFFFF"
          strokeWidth="3"
          strokeLinecap="round"
          strokeOpacity="0.75"
        />

        {/* Magnified inspection indicator inside the lens */}
        <g transform="translate(18, 48)">
          <rect
            width="104"
            height="44"
            rx="10"
            fill="#FFFFFF"
            stroke={isCovered ? "#16A34A" : "#DC2626"}
            strokeWidth="2"
            filter="url(#cf-paper-shadow)"
          />
          <text x="52" y="18" textAnchor="middle" fill="#64748B" fontSize="9" fontWeight="800" fontFamily="system-ui, sans-serif">
            THU 12 NOV
          </text>
          <text
            x="52"
            y="35"
            textAnchor="middle"
            fill={isCovered ? "#16A34A" : "#DC2626"}
            fontSize="14"
            fontWeight="900"
            fontFamily="monospace"
          >
            {isCovered ? "✓ COVERED" : `-$${shortfall}.00`}
          </text>
        </g>
      </g>

      {/* Bills Collision Detail Callout (when in shortfall state) */}
      {!isCovered && (
        <g transform="translate(580, 240)">
          <rect width="210" height="74" rx="10" fill="#FFFFFF" stroke="#FCA5A5" strokeWidth="1.5" filter="url(#cf-paper-shadow)" />
          <path d="M-8 20L0 15L0 25Z" fill="#FFFFFF" stroke="#FCA5A5" strokeWidth="1.5" />
          <text x="14" y="22" fill="#991B1B" fontSize="10" fontWeight="800" fontFamily="system-ui, sans-serif">
            COLLISION ON THU 12:
          </text>
          <text x="14" y="40" fill="#64748B" fontSize="10" fontWeight="600" fontFamily="monospace">
            • Volta Parts: -$300.00
          </text>
          <text x="14" y="56" fill="#64748B" fontSize="10" fontWeight="600" fontFamily="monospace">
            • Store Rent: -$800.00
          </text>
        </g>
      )}

      {/* Covered Detail Callout (when solved) */}
      {isCovered && (
        <g transform="translate(580, 240)">
          <rect width="220" height="74" rx="10" fill="#FFFFFF" stroke="#86EFAC" strokeWidth="1.5" filter="url(#cf-paper-shadow)" />
          <path d="M-8 20L0 15L0 25Z" fill="#FFFFFF" stroke="#86EFAC" strokeWidth="1.5" />
          <text x="14" y="22" fill="#166534" fontSize="10" fontWeight="800" fontFamily="system-ui, sans-serif">
            PROTECTION CONFIRMED:
          </text>
          <text x="14" y="40" fill="#15803D" fontSize="10" fontWeight="700" fontFamily="monospace">
            • Maya Checkout: +$69.36 net
          </text>
          <text x="14" y="56" fill="#15803D" fontSize="10" fontWeight="700" fontFamily="monospace">
            • Daily Set-Aside: +$21.00/day
          </text>
        </g>
      )}
    </svg>
  );
}
