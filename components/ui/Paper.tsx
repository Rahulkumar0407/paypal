import { guillocheRing } from "./Banknote";

/**
 * Banknote paper: the background behind every owner page. A soft surface tone with the note's fine lathe
 * engraving, one faint rosette watermark and a few security fibres. Very low contrast on purpose: content sits
 * on white cards above it. Decorative only. Owner: Person 1.
 */

function fibres(count: number, seed: number) {
  let s = seed >>> 0;
  const rand = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  return Array.from({ length: count }, () => {
    const x = rand() * 1600;
    const y = rand() * 1000;
    const len = 7 + rand() * 11;
    const a = rand() * Math.PI;
    const bend = (rand() - 0.5) * 6;
    const x2 = x + Math.cos(a) * len;
    const y2 = y + Math.sin(a) * len;
    return { d: `M${x.toFixed(1)},${y.toFixed(1)} Q${((x + x2) / 2 + bend).toFixed(1)},${((y + y2) / 2 - bend).toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`, red: rand() < 0.45 };
  });
}

const FIBRES = fibres(70, 1105);
const ROSETTE_OUTER = guillocheRing(1450, 880, 300, 16, 36, 6);
const ROSETTE_INNER = guillocheRing(1450, 880, 220, 20, 24, 5);

export function PaperBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-surface">
      <svg className="absolute inset-0 h-full w-full">
        <defs>
          <pattern id="paper-lathe-a" width={44} height={8} patternUnits="userSpaceOnUse">
            <path d="M0 4 Q11 1.5 22 4 T44 4" fill="none" stroke="#0e3b2c" strokeOpacity={0.075} strokeWidth={0.6} />
          </pattern>
          <pattern id="paper-lathe-b" width={44} height={8} patternUnits="userSpaceOnUse">
            <path d="M0 4 Q11 6.5 22 4 T44 4" fill="none" stroke="#1e9e5e" strokeOpacity={0.09} strokeWidth={0.6} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#paper-lathe-a)" />
        <rect width="100%" height="100%" fill="url(#paper-lathe-b)" />
      </svg>
      <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <g fill="none" stroke="#0e3b2c" strokeOpacity={0.1} strokeWidth={0.8}>
          {ROSETTE_OUTER.map((d, i) => (
            <path key={`o${i}`} d={d} />
          ))}
          {ROSETTE_INNER.map((d, i) => (
            <path key={`i${i}`} d={d} />
          ))}
        </g>
        <g fill="none" strokeWidth={0.9} strokeLinecap="round">
          {FIBRES.map((f, i) => (
            <path key={i} d={f.d} stroke={f.red ? "#e5484d" : "#1e9e5e"} strokeOpacity={0.28} />
          ))}
        </g>
      </svg>
    </div>
  );
}

/** A short engraved rope rule, like the note's border, used under each page's opening sentence. */
export function RopeRule({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden className={`block h-[14px] w-[180px] ${className}`}>
      <defs>
        <pattern id="rope-rule" width={14} height={14} patternUnits="userSpaceOnUse">
          <path d="M0 7 Q3.5 1.5 7 7 T14 7" fill="none" stroke="#0e3b2c" strokeOpacity={0.55} strokeWidth={0.8} />
          <path d="M0 7 Q3.5 12.5 7 7 T14 7" fill="none" stroke="#0e3b2c" strokeOpacity={0.55} strokeWidth={0.8} />
          <circle cx={3.5} cy={7} r={1} fill="#1e9e5e" />
          <circle cx={10.5} cy={7} r={1} fill="#1e9e5e" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#rope-rule)" />
    </svg>
  );
}
