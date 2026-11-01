import type { Forecast } from "@/types";
import { formatDay } from "@/lib/shared/dates";
import { formatDollars, formatShortfall } from "@/lib/shared/money";

/**
 * Background explorations for the home screen, shown only at /design/backgrounds. Owner: Person 1.
 * Every one is drawn from the forecast itself or from the visual language of money and weather.
 */

// ---- shared helpers ------------------------------------------------------------------------

/** The 14 closing balances as a smooth 0..1 curve over t in [0, 1]. */
function balanceCurve(forecast: Forecast) {
  const values = forecast.days.map((d) => d.closingCents);
  const min = Math.min(...values, 0);
  const max = Math.max(...values);
  const norm = values.map((v) => (v - min) / (max - min || 1));
  return (t: number) => {
    const f = Math.max(0, Math.min(1, t)) * (norm.length - 1);
    const i = Math.min(norm.length - 2, Math.floor(f));
    const u = f - i;
    const w = (1 - Math.cos(u * Math.PI)) / 2;
    return norm[i]! * (1 - w) + norm[i + 1]! * w;
  };
}

function shortIndex(forecast: Forecast): number {
  const i = forecast.days.findIndex((d) => d.state === "short");
  return i < 0 ? 7 : i;
}

const pt = (x: number, y: number) => `${x.toFixed(1)},${y.toFixed(1)}`;

// ---- A. Banknote: guilloché engraving, the security pattern of paper money ----------------------

function rosette(cx: number, cy: number, radius: number, i: number, petals: number, wobble: number): string {
  const points: string[] = [];
  for (let s = 0; s <= 360; s++) {
    const t = (s / 360) * Math.PI * 2;
    const r = radius + 14 * Math.sin(petals * t + i * 0.21) + wobble * Math.sin(5 * t - i * 0.13);
    points.push(pt(cx + Math.cos(t) * r, cy + Math.sin(t) * r));
  }
  return `M${points.join("L")}Z`;
}

export function Banknote({ medallion = true }: { medallion?: boolean } = {}) {
  const big = Array.from({ length: 44 }, (_, i) => rosette(985, 205, 84 + i * 4.4, i, 12, 7));
  const small = Array.from({ length: 22 }, (_, i) => rosette(150, 640, 40 + i * 4, i, 9, 4));
  const waves = Array.from({ length: 26 }, (_, i) => {
    const points: string[] = [];
    for (let x = -10; x <= 1210; x += 6) {
      const y = 600 + i * 3.6 + 16 * Math.sin(x * 0.018 + i * 0.32) + 7 * Math.sin(x * 0.047 - i * 0.21);
      points.push(pt(x, y));
    }
    return `M${points.join("L")}`;
  });
  const micro = "NEVERSHORT   LOOP AUDIO   FOURTEEN DAYS AHEAD   ".repeat(8);
  return (
    <svg aria-hidden viewBox="0 0 1200 720" preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 h-full w-full">
      <rect width="1200" height="720" fill="#0e3b2c" />
      <g fill="none" stroke="#f3f5f2" strokeOpacity={0.16} strokeWidth={0.7}>
        {big.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <g fill="none" stroke="#1e9e5e" strokeOpacity={0.45} strokeWidth={0.7}>
        {small.map((d, i) => (
          <path key={i} d={d} />
        ))}
        {waves.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      {medallion ? (
        <>
      <circle cx={985} cy={205} r={76} fill="#0e3b2c" />
      <circle cx={985} cy={205} r={70} fill="none" stroke="#f3f5f2" strokeOpacity={0.35} strokeWidth={1} />
      <text x={985} y={236} textAnchor="middle" fontFamily="var(--font-serif)" fontSize={86} fill="#f3f5f2" fillOpacity={0.85}>
        14
      </text>
      <text x={985} y={264} textAnchor="middle" fontFamily="var(--font-sans)" fontSize={11} letterSpacing={4} fill="#f3f5f2" fillOpacity={0.6}>
        DAYS
      </text>
        </>
      ) : null}
      <text x={0} y={22} fontFamily="var(--font-sans)" fontSize={8.5} letterSpacing={2} fill="#f3f5f2" fillOpacity={0.3}>
        {micro}
      </text>
      <text x={0} y={712} fontFamily="var(--font-sans)" fontSize={8.5} letterSpacing={2} fill="#f3f5f2" fillOpacity={0.3}>
        {micro}
      </text>
    </svg>
  );
}

// ---- B. Ridgelines: the fortnight as a mountain range, Thursday's valley cut in red ----------------

export function Ridgelines({ forecast }: { forecast: Forecast }) {
  const curve = balanceCurve(forecast);
  const W = 1200;
  const lines = 30;
  const si = shortIndex(forecast);
  const bandX = (si / (forecast.days.length - 1)) * W;
  const ridges = Array.from({ length: lines }, (_, i) => {
    const base = 150 + i * 9.4;
    const weight = 0.45 + (i / lines) * 0.55;
    const points: string[] = [];
    for (let x = -8; x <= W + 8; x += 8) {
      const t = x / W;
      const noise = Math.sin(x * 0.031 + i * 1.7) * 0.5 + Math.sin(x * 0.077 + i * 0.9) * 0.3 + Math.sin(x * 0.013 + i * 2.3) * 0.2;
      const peak = Math.exp(-Math.pow((t - 0.5) / 0.42, 2));
      const y = base - (curve(t) * 110 * weight + noise * 8 * (0.4 + peak));
      points.push(pt(x, y));
    }
    return `M${points.join("L")}`;
  });
  return (
    <>
      <div aria-hidden className="absolute inset-0 bg-ink" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[440px]">
        <svg viewBox="0 0 1200 440" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          <defs>
            <clipPath id="ridge-short">
              <rect x={bandX - 42} y={0} width={84} height={440} />
            </clipPath>
          </defs>
          {ridges.map((d, i) => (
            <g key={i}>
              <path d={`${d} L${W + 8},440 L-8,440 Z`} fill="#14201b" />
              <path d={d} fill="none" stroke="#f3f5f2" strokeOpacity={0.5} strokeWidth={1.1} vectorEffect="non-scaling-stroke" />
              <path d={d} fill="none" stroke="#e5484d" strokeOpacity={0.95} strokeWidth={1.5} vectorEffect="non-scaling-stroke" clipPath="url(#ridge-short)" />
            </g>
          ))}
        </svg>
        <span className="absolute bottom-3 -translate-x-1/2 text-[13px] font-semibold text-red" style={{ left: `${(bandX / W) * 100}%` }}>
          {formatDay(forecast.days[si]!.date)}
        </span>
      </div>
    </>
  );
}

// ---- C. Radar: a weather-radar sweep, each day a blip spiralling out from today ------------------

export function Radar({ forecast }: { forecast: Forecast }) {
  const cx = 975;
  const cy = 195;
  const fill = { covered: "#1e9e5e", tight: "#f2a93b", short: "#e5484d" } as const;
  const blips = forecast.days.map((day, i) => {
    const angle = -Math.PI / 2 + (i / forecast.days.length) * Math.PI * 2;
    const r = 22 + i * 11.5;
    return { day, x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
  });
  const wedges = Array.from({ length: 7 }, (_, k) => {
    const a0 = (-90 - k * 6) * (Math.PI / 180);
    const a1 = (-90 - (k + 1) * 6) * (Math.PI / 180);
    const R = 190;
    return {
      d: `M${cx},${cy} L${pt(cx + Math.cos(a0) * R, cy + Math.sin(a0) * R)} A${R},${R} 0 0 0 ${pt(cx + Math.cos(a1) * R, cy + Math.sin(a1) * R)} Z`,
      opacity: 0.24 - k * 0.032,
    };
  });
  const short = blips.find((b) => b.day.state === "short");
  return (
    <svg aria-hidden viewBox="0 0 1200 720" preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 h-full w-full">
      <rect width="1200" height="720" fill="#0d1a15" />
      <g fill="none" stroke="#1e9e5e" strokeOpacity={0.32}>
        {[48, 96, 144, 192].map((r) => (
          <circle key={r} cx={cx} cy={cy} r={r} />
        ))}
        <line x1={cx - 210} x2={cx + 210} y1={cy} y2={cy} />
        <line x1={cx} x2={cx} y1={cy - 210} y2={cy + 210} />
      </g>
      <g className="bgx-spin" style={{ transformOrigin: `${cx}px ${cy}px`, transformBox: "view-box" }}>
        {wedges.map((w, k) => (
          <path key={k} d={w.d} fill="#1e9e5e" fillOpacity={Math.max(0.02, w.opacity)} />
        ))}
        <line x1={cx} y1={cy} x2={cx} y2={cy - 190} stroke="#7ee0a8" strokeOpacity={0.7} strokeWidth={1.5} />
      </g>
      {blips.map(({ day, x, y }) => (
        <circle key={day.date} cx={x} cy={y} r={day.state === "covered" ? 4 : 6} fill={fill[day.state]} />
      ))}
      {short ? (
        <g>
          <circle
            cx={short.x}
            cy={short.y}
            r={6}
            fill="none"
            stroke="#e5484d"
            strokeWidth={2}
            className="bgx-ping"
            style={{ transformOrigin: `${short.x}px ${short.y}px`, transformBox: "view-box" }}
          />
          <text x={short.x + 14} y={short.y + 5} fontFamily="var(--font-sans)" fontSize={13} fontWeight={600} fill="#f3f5f2">
            {formatDay(short.day.date)}, {formatShortfall(short.day.shortByCents)} short
          </text>
        </g>
      ) : null}
      <text x={cx} y={cy - 8} textAnchor="middle" fontFamily="var(--font-sans)" fontSize={10} fill="#f3f5f2" fillOpacity={0.6}>
        Today
      </text>
    </svg>
  );
}

// ---- D. Low tide: your money as water. The minimum is the red line; on Thursday the tide drops below it -----

export function LowTide({ forecast }: { forecast: Forecast }) {
  const curve = balanceCurve(forecast);
  const W = 1200;
  const H = 300;
  const level = (t: number) => 70 + (1 - curve(t)) * 190;
  const surface: string[] = [];
  for (let x = 0; x <= W; x += 6) surface.push(pt(x, level(x / W)));
  const water = `M${surface.join("L")} L${W},${H} L0,${H} Z`;
  const values = forecast.days.map((d) => d.closingCents);
  const min = Math.min(...values, 0);
  const max = Math.max(...values);
  const minLine = 70 + (1 - (forecast.minimumBalanceCents - min) / (max - min)) * 190;
  const ripple = (y: number) => {
    const p: string[] = [];
    for (let x = 0; x <= W * 2; x += 10) p.push(pt(x, y + 4 * Math.sin((x / 120) * Math.PI * 2)));
    return `M${p.join("L")}`;
  };
  const si = shortIndex(forecast);
  const sx = (si / (forecast.days.length - 1)) * W;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[300px]">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <defs>
          <clipPath id="tide-water">
            <path d={water} />
          </clipPath>
        </defs>
        <path d={water} transform="translate(0,-10)" fill="#1e9e5e" fillOpacity={0.35} />
        <path d={water} fill="#0e3b2c" />
        <g clipPath="url(#tide-water)" fill="none" stroke="#f3f5f2" strokeOpacity={0.14} strokeWidth={1.2}>
          {[120, 170, 220, 265].map((y, i) => (
            <path key={y} d={ripple(y)} className={i % 2 ? "bgx-drift-slow" : "bgx-drift"} />
          ))}
        </g>
        <line x1={0} x2={W} y1={minLine} y2={minLine} stroke="#e5484d" strokeWidth={2} strokeDasharray="10 8" vectorEffect="non-scaling-stroke" />
      </svg>
      <span
        className="absolute -translate-x-1/2 rounded-full bg-paper px-2.5 py-0.5 text-[13px] font-semibold whitespace-nowrap text-red shadow-[0_1px_0_rgb(20_32_27/0.15)]"
        style={{ left: `${(sx / W) * 100}%`, top: `${(level(si / (forecast.days.length - 1)) / H) * 100 - 16}%` }}
      >
        Low tide, {formatDay(forecast.days[si]!.date)}
      </span>
      <span className="absolute right-5 text-[12px] font-medium text-white/80" style={{ top: `${(minLine / H) * 100 + 3}%` }}>
        Your minimum, {formatDollars(forecast.minimumBalanceCents)}
      </span>
    </div>
  );
}

// ---- E. Halftone: a newspaper print of the fortnight. Bigger dots, more money; the short day prints red ---------

export function Halftone({ forecast }: { forecast: Forecast }) {
  const curve = balanceCurve(forecast);
  const W = 1200;
  const H = 820;
  const step = 17;
  const si = shortIndex(forecast);
  const n = forecast.days.length - 1;
  const dots: { x: number; y: number; r: number; tone: string }[] = [];
  for (let row = 0, y = step / 2; y < H; row++, y += step * 0.866) {
    for (let x = (row % 2) * (step / 2); x < W + step; x += step) {
      const t = x / W;
      const rise = Math.max(0, (y / H - 0.6) / 0.4);
      const r = (step / 2) * Math.min(1, Math.pow(rise, 1.2) * (0.25 + curve(t) * 1.05));
      if (r < 0.6) continue;
      const day = Math.round(t * n);
      const tone = day === si ? "#e5484d" : forecast.days[day]?.state === "tight" ? "#f2a93b" : "#14201b";
      dots.push({ x, y, r, tone });
    }
  }
  return (
    <svg aria-hidden viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 h-full w-full">
      <rect width={W} height={H} fill="#ffffff" />
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.tone} />
      ))}
    </svg>
  );
}

// ---- F. Night map: isobars on deep green. High pressure over the best day, a red low near the gap -----------

function ring(cx: number, cy: number, r: number, sx: number, seed: number): string {
  const points: string[] = [];
  for (let i = 0; i < 120; i++) {
    const t = (i / 120) * Math.PI * 2;
    const k = 1 + 0.08 * Math.sin(3 * t + seed) + 0.045 * Math.sin(5 * t + seed * 1.7) + 0.02 * Math.sin(9 * t + seed * 0.6);
    points.push(pt(cx + Math.cos(t) * r * k * sx, cy + Math.sin(t) * r * k));
  }
  return `M${points.join("L")}Z`;
}

export function NightMap({ forecast }: { forecast: Forecast }) {
  const best = Math.max(...forecast.days.map((d) => d.closingCents));
  return (
    <svg aria-hidden viewBox="0 0 1200 720" preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 h-full w-full">
      <rect width="1200" height="720" fill="#0e3b2c" />
      <g fill="none" stroke="#ffffff" strokeOpacity={0.13} strokeWidth={1.2}>
        {Array.from({ length: 10 }, (_, i) => (
          <path key={i} d={ring(1000, 170, 54 + i * 58, 1.75, 0.4 + i * 0.35)} />
        ))}
      </g>
      <g fill="none" stroke="#e5484d" strokeOpacity={0.6} strokeWidth={1.3}>
        {Array.from({ length: 8 }, (_, i) => (
          <path key={i} d={ring(40, 600, 22 + i * 32, 1.3, 2.1 + i * 0.5)} />
        ))}
      </g>
      <g fontFamily="var(--font-serif)">
        <text x={1000} y={192} fontSize={64} textAnchor="middle" fill="#ffffff" fillOpacity={0.3}>
          H
        </text>
        <text x={1000} y={230} fontSize={16} textAnchor="middle" fill="#ffffff" fillOpacity={0.65}>
          {formatDollars(best)}, your best day
        </text>
        <text x={40} y={615} fontSize={44} textAnchor="middle" fill="#e5484d">
          L
        </text>
      </g>
    </svg>
  );
}

// =============================================================================================
// The banknote family, pushed further (A2 to A5), and the ticker tape (G)
// =============================================================================================

/** Tiny deterministic random numbers, so the paper fibres land in the same place on every render. */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function waveLines(count: number, length: number, base: number, gap: number, amp: number, freq: number): string[] {
  return Array.from({ length: count }, (_, i) => {
    const p: string[] = [];
    for (let x = 0; x <= length; x += 6) p.push(pt(x, base + i * gap + amp * Math.sin(x * freq + i * 0.5) + amp * 0.4 * Math.sin(x * freq * 2.7 - i * 0.3)));
    return `M${p.join("L")}`;
  });
}

// ---- A2. Full note: now in the design system (components/ui/Banknote.tsx) ---------------------

export { BanknoteArt as FullNote } from "@/components/ui/Banknote";

// ---- A3. Forecast rosette: a guilloché medallion with one lobe per day, shaped by your balances --------------

export function ForecastRosette({ forecast }: { forecast: Forecast }) {
  const values = forecast.days.map((d) => d.closingCents);
  const min = Math.min(...values, 0);
  const max = Math.max(...values);
  const norm = values.map((v) => (v - min) / (max - min || 1));
  const n = norm.length;
  const at = (theta: number) => {
    const f = (((theta / (Math.PI * 2)) % 1) + 1) % 1 * n;
    const i = Math.floor(f) % n;
    const j = (i + 1) % n;
    const u = f - Math.floor(f);
    const w = (1 - Math.cos(u * Math.PI)) / 2;
    return norm[i]! * (1 - w) + norm[j]! * w;
  };
  void at;
  const cx = 990;
  const cy = 172;
  const sector = (Math.PI * 2) / n;
  const line = (i: number) => {
    const p: string[] = [];
    for (let s = 0; s <= 1400; s++) {
      const a = (s / 1400) * Math.PI * 2; // 0 = today, at the top, clockwise
      const k = Math.min(n - 1, Math.floor(a / sector));
      const u = (a - k * sector) / sector;
      const petal = Math.pow(Math.sin(Math.PI * u), 0.85) * (14 + 82 * norm[k]!) * (1 - i * 0.012);
      const r = 40 + i * 2.2 + petal + 1.2 * Math.sin(60 * a + i * 0.4);
      p.push(pt(cx + Math.sin(a) * r, cy - Math.cos(a) * r));
    }
    return `M${p.join("L")}Z`;
  };
  const lines = Array.from({ length: 24 }, (_, i) => line(i));
  const si = shortIndex(forecast);
  const half = Math.PI / n;
  const a0 = (si / n) * Math.PI * 2 - half;
  const a1 = (si / n) * Math.PI * 2 + half;
  const R = 320;
  const wedge = `M${cx},${cy} L${pt(cx + Math.sin(a0) * R, cy - Math.cos(a0) * R)} A${R},${R} 0 0 1 ${pt(cx + Math.sin(a1) * R, cy - Math.cos(a1) * R)} Z`;
  const labelA = (si / n) * Math.PI * 2;
  return (
    <svg aria-hidden viewBox="0 0 1200 720" preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 h-full w-full">
      <defs>
        <clipPath id="rosette-short">
          <path d={wedge} />
        </clipPath>
      </defs>
      <rect width="1200" height="720" fill="#0e3b2c" />
      <g fill="none" stroke="#1e9e5e" strokeOpacity={0.4} strokeWidth={0.7}>
        {waveLines(22, 1200, 610, 3.4, 14, 0.019).map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <g fill="none" stroke="#f3f5f2" strokeOpacity={0.3} strokeWidth={0.7}>
        {lines.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <g fill="none" stroke="#e5484d" strokeOpacity={1} strokeWidth={1} clipPath="url(#rosette-short)">
        {lines.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <circle cx={cx} cy={cy} r={40} fill="#0e3b2c" stroke="#f3f5f2" strokeOpacity={0.5} />
      <text x={cx} y={cy + 9} textAnchor="middle" fontFamily="var(--font-serif)" fontSize={26} fill="#f3f5f2">
        14
      </text>
      <text x={cx + 26} y={cy - 178} textAnchor="start" fontFamily="var(--font-sans)" fontSize={11} letterSpacing={2} fill="#f3f5f2" fillOpacity={0.7}>
        TODAY
      </text>
      <line
        x1={cx + Math.sin(labelA) * 100}
        y1={cy - Math.cos(labelA) * 100}
        x2={cx + 58}
        y2={cy + 116}
        stroke="#e5484d"
        strokeOpacity={0.8}
      />
      <text x={cx + 62} y={cy + 120} textAnchor="start" fontFamily="var(--font-sans)" fontSize={12} fontWeight={600} fill="#e5484d">
        {formatDay(forecast.days[si]!.date)}, {formatShortfall(forecast.days[si]!.shortByCents)} short
      </text>
    </svg>
  );
}

// ---- A4. Currency paper: the light version. Fibres, a watermark and a security thread ------------------------

export function CurrencyPaper() {
  const rand = seeded(511);
  const fibres = Array.from({ length: 170 }, () => {
    const x = rand() * 1200;
    const y = rand() * 760;
    const len = 6 + rand() * 12;
    const a = rand() * Math.PI;
    const bend = (rand() - 0.5) * 6;
    const x2 = x + Math.cos(a) * len;
    const y2 = y + Math.sin(a) * len;
    return { d: `M${pt(x, y)} Q${pt((x + x2) / 2 + bend, (y + y2) / 2 - bend)} ${pt(x2, y2)}`, red: rand() < 0.5 };
  });
  return (
    <svg aria-hidden viewBox="0 0 1200 760" preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 h-full w-full">
      <rect width="1200" height="760" fill="#f3f5f2" />
      <g fill="none" stroke="#0e3b2c" strokeOpacity={0.09} strokeWidth={0.7}>
        {Array.from({ length: 34 }, (_, i) => (
          <path key={i} d={rosette(1010, 250, 70 + i * 4.4, i, 12, 7)} />
        ))}
        {waveLines(18, 1200, 650, 3.6, 13, 0.018).map((d, i) => (
          <path key={`w${i}`} d={d} />
        ))}
      </g>
      <text x={1010} y={330} textAnchor="middle" fontFamily="var(--font-serif)" fontSize={260} fill="#14201b" fillOpacity={0.05}>
        14
      </text>
      <g fill="none" strokeWidth={0.9} strokeLinecap="round">
        {fibres.map((f, i) => (
          <path key={i} d={f.d} stroke={f.red ? "#e5484d" : "#1e9e5e"} strokeOpacity={0.45} />
        ))}
      </g>
      <line x1={1150} x2={1150} y1={0} y2={760} stroke="#0e3b2c" strokeOpacity={0.12} strokeWidth={3} />
      {Array.from({ length: 20 }, (_, i) => (
        <rect key={i} x={1146} y={i * 40 + 6} width={8} height={24} rx={2} fill="#0e3b2c" fillOpacity={0.55} />
      ))}
    </svg>
  );
}

// ---- A5. Engraved vignette: the little engraved landscape on a banknote, drawn from your forecast -----------

export function EngravedVignette({ forecast }: { forecast: Forecast }) {
  const curve = balanceCurve(forecast);
  const values = forecast.days.map((d) => d.closingCents);
  const min = Math.min(...values, 0);
  const max = Math.max(...values);
  const cx = 940;
  const cy = 200;
  const rx = 165;
  const ry = 108;
  const x0 = cx - rx;
  // Square-root height so the low end spreads out and Thursday's dip below the minimum is visible.
  const ground = (x: number) => cy + 66 - Math.pow(curve((x - x0) / (2 * rx)), 0.35) * 120;
  const sea = cy + 66 - Math.pow((forecast.minimumBalanceCents - min) / (max - min), 0.35) * 120;
  const g: string[] = [];
  for (let x = x0; x <= cx + rx; x += 3) g.push(pt(x, ground(x)));
  const groundPath = `M${g.join("L")} L${cx + rx},${cy + ry + 4} L${x0},${cy + ry + 4} Z`;
  const hatch = (from: number, to: number, gap: number) => {
    const out: string[] = [];
    for (let y = from; y <= to; y += gap) out.push(`M${x0},${y.toFixed(1)}L${cx + rx},${y.toFixed(1)}`);
    return out.join("");
  };
  return (
    <svg aria-hidden viewBox="0 0 1200 720" preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 h-full w-full">
      <defs>
        <clipPath id="vig-oval">
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} />
        </clipPath>
        <clipPath id="vig-ground">
          <path d={groundPath} />
        </clipPath>
        <clipPath id="vig-sea">
          <rect x={x0} y={sea} width={rx * 2} height={ry * 2} />
        </clipPath>
      </defs>
      <rect width="1200" height="720" fill="#0e3b2c" />
      <g fill="none" stroke="#1e9e5e" strokeOpacity={0.4} strokeWidth={0.7}>
        {Array.from({ length: 22 }, (_, i) => (
          <path key={i} d={rosette(150, 640, 40 + i * 4, i, 9, 4)} />
        ))}
        {waveLines(22, 1200, 615, 3.4, 14, 0.019).map((d, i) => (
          <path key={`w${i}`} d={d} />
        ))}
      </g>
      <g clipPath="url(#vig-oval)">
        <path d={hatch(cy - ry, cy + ry, 5)} stroke="#f3f5f2" strokeOpacity={0.22} strokeWidth={0.8} />
        <path d={hatch(cy - ry, cy + ry, 2.6)} stroke="#e5484d" strokeOpacity={0.9} strokeWidth={1} clipPath="url(#vig-sea)" />
        <path d={groundPath} fill="#0e3b2c" />
        <path d={hatch(cy - ry, cy + ry, 2.4)} stroke="#f3f5f2" strokeOpacity={0.62} strokeWidth={1} clipPath="url(#vig-ground)" />
        <path d={`M${g.join("L")}`} fill="none" stroke="#f3f5f2" strokeOpacity={0.95} strokeWidth={1.4} />
      </g>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="#f3f5f2" strokeOpacity={0.7} strokeWidth={2} />
      <g fill="none" stroke="#1e9e5e" strokeOpacity={0.7} strokeWidth={0.6}>
        {Array.from({ length: 6 }, (_, i) => (
          <ellipse key={i} cx={cx} cy={cy} rx={rx + 6 + i * 2.2} ry={ry + 6 + i * 2.2} strokeDasharray={i % 2 ? "2 3" : undefined} />
        ))}
      </g>
      <ellipse cx={cx} cy={cy} rx={rx + 22} ry={ry + 22} fill="none" stroke="#f3f5f2" strokeOpacity={0.35} />
      <text x={cx} y={cy - ry - 34} textAnchor="middle" fontFamily="var(--font-sans)" fontSize={11} letterSpacing={4} fill="#f3f5f2" fillOpacity={0.7}>
        THE NEXT FOURTEEN DAYS
      </text>
    </svg>
  );
}

// ---- G. Ticker tape: market tickers scrolling past, quoting your days -----------------------------------

export function TickerTape({ forecast }: { forecast: Forecast }) {
  const items = forecast.days.map((day, i) => {
    const prev = i === 0 ? day.openingCents : forecast.days[i - 1]!.closingCents;
    const up = day.closingCents >= prev;
    const name = day.isToday ? "TODAY" : formatDay(day.date).toUpperCase();
    const extra = day.state === "short" ? ` SHORT ${formatShortfall(day.shortByCents)}` : day.state === "tight" ? " TIGHT" : "";
    return { key: day.date, text: `${name} ${formatDollars(day.closingCents)} ${up ? "▲" : "▼"}${extra}`, tone: day.state };
  });
  const band = (speed: string, rotate: string, top: string, opacity: string) => (
    <div className={`absolute -inset-x-[20%] ${top} ${rotate} ${opacity} border-y border-white/15 bg-white/[0.04] py-2.5`}>
      <div className={`flex w-max gap-10 whitespace-nowrap font-mono text-[15px] tracking-[0.12em] ${speed}`}>
        {[...items, ...items, ...items, ...items].map((it, i) => (
          <span key={`${it.key}-${i}`} className={it.tone === "short" ? "text-red" : it.tone === "tight" ? "text-amber" : "text-green"}>
            {it.text}
          </span>
        ))}
      </div>
    </div>
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden bg-ink">
      {band("bgx-ticker", "-rotate-[7deg]", "top-[10%]", "opacity-60")}
      {band("bgx-ticker-rev", "-rotate-[7deg]", "top-[46%]", "opacity-40")}
      {band("bgx-ticker-slow", "-rotate-[7deg]", "top-[82%]", "opacity-70")}
    </div>
  );
}
