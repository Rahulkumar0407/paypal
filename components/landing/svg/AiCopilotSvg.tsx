import React from "react";

interface AiCopilotSvgProps {
  className?: string;
  isCovered?: boolean;
}

export function AiCopilotSvg({
  className = "",
  isCovered = false,
}: AiCopilotSvgProps) {
  return (
    <svg
      viewBox="0 0 1000 560"
      className={`w-full h-auto select-none ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="NeverShort AI Co-pilot analyzing store cash flow and proposing deterministic solutions"
    >
      <defs>
        <linearGradient id="ai-bg" x1="0" y1="0" x2="0" y2="560" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="100%" stopColor="#EFF6FF" />
        </linearGradient>

        <radialGradient id="ai-radar-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0070E0" stopOpacity="0.25" />
          <stop offset="60%" stopColor="#0070E0" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#0070E0" stopOpacity="0" />
        </radialGradient>

        <filter id="ai-drop" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#0070E0" floodOpacity="0.12" />
        </filter>
      </defs>

      {/* Frame */}
      <rect width="1000" height="560" rx="24" fill="url(#ai-bg)" />
      <rect x="1.5" y="1.5" width="997" height="557" rx="22.5" stroke="#BFDBFE" strokeWidth="2" />

      {/* ── RADAR CONCENTRIC CIRCLES IN BACKGROUND ── */}
      <g transform="translate(500, 280)">
        <circle cx="0" cy="0" r="240" fill="url(#ai-radar-glow)" />
        <circle cx="0" cy="0" r="220" stroke="#93C5FD" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.5" />
        <circle cx="0" cy="0" r="160" stroke="#60A5FA" strokeWidth="1" strokeDasharray="6 6" strokeOpacity="0.6" />
        <circle cx="0" cy="0" r="100" stroke="#3B82F6" strokeWidth="1.5" strokeOpacity="0.7" />
        <circle cx="0" cy="0" r="40" fill="#0070E0" fillOpacity="0.1" stroke="#0070E0" strokeWidth="2" />

        {/* Crosshair Axes */}
        <line x1="-240" y1="0" x2="240" y2="0" stroke="#93C5FD" strokeWidth="1" strokeOpacity="0.4" />
        <line x1="0" y1="-240" x2="0" y2="240" stroke="#93C5FD" strokeWidth="1" strokeOpacity="0.4" />
      </g>

      {/* ── LEFT: INPUT SIGNALS (DISCOVERED PATTERNS) ── */}
      <g transform="translate(70, 90)" filter="url(#ai-drop)">
        <rect width="280" height="380" rx="20" fill="#FFFFFF" stroke="#DBEAFE" strokeWidth="1.5" />
        <rect x="0" y="0" width="280" height="42" rx="20" fill="#0E3B2C" />
        <rect x="0" y="22" width="280" height="20" fill="#0E3B2C" />
        <text x="20" y="26" fill="#FFFFFF" fontSize="12" fontWeight="900" fontFamily="system-ui, sans-serif">
          STORE SIGNALS DETECTED
        </text>

        {/* Signal 1: Volta recurring pattern */}
        <g transform="translate(18, 58)">
          <rect width="244" height="68" rx="10" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
          <circle cx="20" cy="22" r="8" fill="#F59E0B" />
          <text x="36" y="26" fill="#001435" fontSize="11" fontWeight="800" fontFamily="system-ui, sans-serif">
            Volta Audio Parts
          </text>
          <text x="18" y="46" fill="#64748B" fontSize="9" fontWeight="500" fontFamily="system-ui, sans-serif">
            Recurring supplier: ~$300 every 10 days
          </text>
          <text x="18" y="60" fill="#DC2626" fontSize="10" fontWeight="800" fontFamily="monospace">
            Next due: Thu 12 Nov (-$300)
          </text>
        </g>

        {/* Signal 2: Store Rent */}
        <g transform="translate(18, 138)">
          <rect width="244" height="68" rx="10" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
          <circle cx="20" cy="22" r="8" fill="#DC2626" />
          <text x="36" y="26" fill="#001435" fontSize="11" fontWeight="800" fontFamily="system-ui, sans-serif">
            Downtown Commercial Rent
          </text>
          <text x="18" y="46" fill="#64748B" fontSize="9" fontWeight="500" fontFamily="system-ui, sans-serif">
            Fixed lease due 12th of month
          </text>
          <text x="18" y="60" fill="#DC2626" fontSize="10" fontWeight="800" fontFamily="monospace">
            Next due: Thu 12 Nov (-$800)
          </text>
        </g>

        {/* Signal 3: Abandoned Checkout */}
        <g transform="translate(18, 218)">
          <rect width="244" height="68" rx="10" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
          <circle cx="20" cy="22" r="8" fill="#3B82F6" />
          <text x="36" y="26" fill="#001435" fontSize="11" fontWeight="800" fontFamily="system-ui, sans-serif">
            Maya K. (Abandoned Cart)
          </text>
          <text x="18" y="46" fill="#64748B" fontSize="9" fontWeight="500" fontFamily="system-ui, sans-serif">
            Consent verified • Dropped at checkout
          </text>
          <text x="18" y="60" fill="#0070E0" fontSize="10" fontWeight="800" fontFamily="monospace">
            Recoverable: $72.00 (+$69.36 net)
          </text>
        </g>

        {/* Summary note */}
        <text x="140" y="325" textAnchor="middle" fill="#64748B" fontSize="9" fontWeight="600" fontFamily="system-ui, sans-serif">
          Signals updated live via PayPal webhooks
        </text>
      </g>

      {/* ── CENTER: AI CO-PILOT SYNAPSE ENGINE ── */}
      <g transform="translate(500, 280)" filter="url(#ai-drop)">
        {/* Core Pulsing Hexagon */}
        <polygon
          points="0,-50 44,-25 44,25 0,50 -44,25 -44,-25"
          fill="#0070E0"
          stroke="#FFFFFF"
          strokeWidth="3"
        />
        <circle cx="0" cy="0" r="22" fill="#FFFFFF" />
        <path d="M-8 0L-2 6L8 -4" stroke="#0070E0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        <text x="0" y="80" textAnchor="middle" fill="#001435" fontSize="14" fontWeight="900" fontFamily="system-ui, sans-serif">
          NEVERSHORT AI CO-PILOT
        </text>
        <text x="0" y="98" textAnchor="middle" fill="#52627A" fontSize="11" fontWeight="600" fontFamily="system-ui, sans-serif">
          Zero-Calculation Money Safety
        </text>
      </g>

      {/* ── RIGHT: SAFE PROPOSED ACTIONS CARD ── */}
      <g transform="translate(650, 90)" filter="url(#ai-drop)">
        <rect width="280" height="380" rx="20" fill="#FFFFFF" stroke="#DBEAFE" strokeWidth="1.5" />
        <rect x="0" y="0" width="280" height="42" rx="20" fill="#0070E0" />
        <rect x="0" y="22" width="280" height="20" fill="#0070E0" />
        <text x="20" y="26" fill="#FFFFFF" fontSize="12" fontWeight="900" fontFamily="system-ui, sans-serif">
          PROPOSED SAFE ACTIONS
        </text>

        {/* Action 1: Recovery proposal */}
        <g transform="translate(18, 58)">
          <rect width="244" height="96" rx="12" fill="#F0FDF4" stroke="#BBF7D0" strokeWidth="1.5" />
          <div className="flex justify-between items-center">
            <text x="14" y="24" fill="#166534" fontSize="11" fontWeight="900" fontFamily="system-ui, sans-serif">
              1. SEND RECOVERY REMINDER
            </text>
          </div>
          <text x="14" y="44" fill="#14201B" fontSize="10" fontWeight="600" fontFamily="system-ui, sans-serif">
            Draft polite reminder to Maya K.
          </text>
          <text x="14" y="60" fill="#64748B" fontSize="9" fontWeight="500" fontFamily="system-ui, sans-serif">
            Fresh PayPal sandbox checkout link
          </text>
          <rect x="14" y="70" width="80" height="18" rx="9" fill={isCovered ? "#15803D" : "#16A34A"} />
          <text x="54" y="82" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="800" fontFamily="system-ui, sans-serif">
            {isCovered ? "RECOVERED ✓" : "PASSES GUARD"}
          </text>
        </g>

        {/* Action 2: Set-aside proposal */}
        <g transform="translate(18, 168)">
          <rect width="244" height="96" rx="12" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1.5" />
          <text x="14" y="24" fill="#1E40AF" fontSize="11" fontWeight="900" fontFamily="system-ui, sans-serif">
            2. SET ASIDE $7.00 / DAY
          </text>
          <text x="14" y="44" fill="#14201B" fontSize="10" fontWeight="600" fontFamily="system-ui, sans-serif">
            Retain $21 total from bank transfer
          </text>
          <text x="14" y="60" fill="#64748B" fontSize="9" fontWeight="500" fontFamily="system-ui, sans-serif">
            Caps at 30% of daily projected sales
          </text>
          <rect x="14" y="70" width="80" height="18" rx="9" fill="#1E40AF" />
          <text x="54" y="82" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="800" fontFamily="system-ui, sans-serif">
            PASSES GUARD
          </text>
        </g>

        {/* Margin Guard Guarantee Note */}
        <g transform="translate(18, 280)">
          <rect width="244" height="74" rx="10" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
          <text x="14" y="20" fill="#0E3B2C" fontSize="10" fontWeight="800" fontFamily="system-ui, sans-serif">
            NON-NEGOTIABLE SAFETY RULE:
          </text>
          <text x="14" y="38" fill="#52605B" fontSize="9" fontWeight="500" fontFamily="system-ui, sans-serif">
            AI never calculates money or calls PayPal.
          </text>
          <text x="14" y="52" fill="#52605B" fontSize="9" fontWeight="500" fontFamily="system-ui, sans-serif">
            Every action requires Margin Guard approval.
          </text>
        </g>
      </g>
    </svg>
  );
}