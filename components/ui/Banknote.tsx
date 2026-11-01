/**
 * The banknote panel: the home screen's top band (chosen design A2, see /design/backgrounds). Owner: Person 1.
 * Precise, symmetric engraving like a real note: a fine lathe tint, a rope border with a 14 in each corner,
 * a rosette medallion, the Margin Guard seal, serials, plaques and signatures. All decorative (aria-hidden);
 * the meaning lives in the headline and strip placed inside it. Medallion, seal and signatures appear from
 * xl widths up, so they never collide with the headline.
 */

const pt = (x: number, y: number) => `${x.toFixed(1)},${y.toFixed(1)}`;

// Precise, symmetric engraving only: a fine lathe tint, a straight rope border, scalloped corner counters,
// a symmetric rosette medallion, a serrated seal, serials, plaques and signatures.

/** A woven guilloché ring: `copies` interlaced k-petal curves around a base radius. Regular and symmetric. */
export function guillocheRing(cx: number, cy: number, base: number, amp: number, k: number, copies: number): string[] {
  return Array.from({ length: copies }, (_, j) => {
    const shift = (j / copies) * ((Math.PI * 2) / k);
    const p: string[] = [];
    for (let s = 0; s <= 720; s++) {
      const t = (s / 720) * Math.PI * 2;
      const r = base + amp * Math.sin(k * (t - shift));
      p.push(pt(cx + Math.cos(t) * r, cy + Math.sin(t) * r));
    }
    return `M${p.join("L")}Z`;
  });
}

/** A circle with a scalloped edge, like the rim of a coin or a banknote counter. */
function scalloped(cx: number, cy: number, r: number, n: number): string {
  const chord = 2 * r * Math.sin(Math.PI / n);
  const bump = chord * 0.56;
  let d = `M${pt(cx + r, cy)}`;
  for (let i = 1; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    d += ` A${bump.toFixed(2)},${bump.toFixed(2)} 0 0 1 ${pt(cx + Math.cos(a) * r, cy + Math.sin(a) * r)}`;
  }
  return `${d} Z`;
}

/** A circle with a sawtooth edge, like a treasury seal. */
function serrated(cx: number, cy: number, outer: number, inner: number, teeth: number): string {
  const p: string[] = [];
  for (let i = 0; i < teeth * 2; i++) {
    const a = (i / (teeth * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? outer : inner;
    p.push(pt(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
  }
  return `M${p.join("L")}Z`;
}

const PALE = "#f3f5f2";
const INK_GREEN = "#1e9e5e";

function CornerCounter({ className }: { className: string }) {
  return (
    <svg aria-hidden viewBox="0 0 100 100" className={`pointer-events-none absolute h-[60px] w-[60px] lg:h-[88px] lg:w-[88px] ${className}`}>
      <path d={scalloped(50, 50, 44, 28)} fill="#0e3b2c" stroke={PALE} strokeOpacity={0.75} strokeWidth={0.8} />
      <circle cx={50} cy={50} r={39} fill="none" stroke={PALE} strokeOpacity={0.4} strokeWidth={0.5} />
      <g fill="none" stroke={INK_GREEN} strokeOpacity={0.95} strokeWidth={0.45}>
        {guillocheRing(50, 50, 31, 5, 14, 4).map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <circle cx={50} cy={50} r={22} fill="#0e3b2c" stroke={PALE} strokeOpacity={0.7} strokeWidth={0.7} />
      <text x={50} y={58} textAnchor="middle" fontFamily="var(--font-serif)" fontSize={23} fill={PALE}>
        14
      </text>
    </svg>
  );
}

function RopeBand({ side }: { side: "top" | "bottom" | "left" | "right" }) {
  const horizontal = side === "top" || side === "bottom";
  const id = `rope-${side}`;
  // An SVG keeps its default 300px width unless sized explicitly, so each band sets both dimensions.
  const place = {
    top: "left-[18px] top-[18px] h-[20px] w-[calc(100%-36px)] lg:left-[28px] lg:top-[28px] lg:h-[26px] lg:w-[calc(100%-56px)]",
    bottom: "left-[18px] bottom-[18px] h-[20px] w-[calc(100%-36px)] lg:left-[28px] lg:bottom-[28px] lg:h-[26px] lg:w-[calc(100%-56px)]",
    left: "top-[18px] left-[18px] w-[20px] h-[calc(100%-36px)] lg:top-[28px] lg:left-[28px] lg:w-[26px] lg:h-[calc(100%-56px)]",
    right: "top-[18px] right-[18px] w-[20px] h-[calc(100%-36px)] lg:top-[28px] lg:right-[28px] lg:w-[26px] lg:h-[calc(100%-56px)]",
  }[side];
  return (
    <svg aria-hidden className={`pointer-events-none absolute ${place}`}>
      <defs>
        {horizontal ? (
          <pattern id={id} width={22} height={26} patternUnits="userSpaceOnUse">
            <path d="M0 13 Q5.5 4 11 13 T22 13" fill="none" stroke={PALE} strokeOpacity={0.6} strokeWidth={0.8} />
            <path d="M0 13 Q5.5 22 11 13 T22 13" fill="none" stroke={PALE} strokeOpacity={0.6} strokeWidth={0.8} />
            <circle cx={5.5} cy={13} r={1.3} fill={INK_GREEN} />
            <circle cx={16.5} cy={13} r={1.3} fill={INK_GREEN} />
            <line x1={0} x2={22} y1={1.5} y2={1.5} stroke={PALE} strokeOpacity={0.5} strokeWidth={0.6} />
            <line x1={0} x2={22} y1={24.5} y2={24.5} stroke={PALE} strokeOpacity={0.5} strokeWidth={0.6} />
          </pattern>
        ) : (
          <pattern id={id} width={26} height={22} patternUnits="userSpaceOnUse">
            <path d="M13 0 Q4 5.5 13 11 T13 22" fill="none" stroke={PALE} strokeOpacity={0.6} strokeWidth={0.8} />
            <path d="M13 0 Q22 5.5 13 11 T13 22" fill="none" stroke={PALE} strokeOpacity={0.6} strokeWidth={0.8} />
            <circle cx={13} cy={5.5} r={1.3} fill={INK_GREEN} />
            <circle cx={13} cy={16.5} r={1.3} fill={INK_GREEN} />
            <line x1={1.5} x2={1.5} y1={0} y2={22} stroke={PALE} strokeOpacity={0.5} strokeWidth={0.6} />
            <line x1={24.5} x2={24.5} y1={0} y2={22} stroke={PALE} strokeOpacity={0.5} strokeWidth={0.6} />
          </pattern>
        )}
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

function NoteMedallion({ className }: { className: string }) {
  return (
    <svg aria-hidden viewBox="0 0 300 300" className={`pointer-events-none absolute ${className}`}>
      <path d={scalloped(150, 150, 142, 64)} fill="#0e3b2c" stroke={PALE} strokeOpacity={0.6} strokeWidth={0.8} />
      <circle cx={150} cy={150} r={134} fill="none" stroke={PALE} strokeOpacity={0.45} strokeWidth={0.6} />
      <g fill="none" stroke={PALE} strokeOpacity={0.42} strokeWidth={0.5}>
        {guillocheRing(150, 150, 120, 9, 30, 6).map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <circle cx={150} cy={150} r={106} fill="none" stroke={PALE} strokeOpacity={0.5} strokeWidth={0.7} />
      <g fill="none" stroke={INK_GREEN} strokeOpacity={0.95} strokeWidth={0.55}>
        {guillocheRing(150, 150, 88, 13, 18, 5).map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <circle cx={150} cy={150} r={70} fill="#0e3b2c" stroke={PALE} strokeOpacity={0.65} strokeWidth={0.8} />
      <g stroke={PALE} strokeOpacity={0.22} strokeWidth={0.5}>
        {Array.from({ length: 144 }, (_, i) => {
          const a = (i / 144) * Math.PI * 2;
          return <line key={i} x1={150 + Math.cos(a) * 54} y1={150 + Math.sin(a) * 54} x2={150 + Math.cos(a) * 67} y2={150 + Math.sin(a) * 67} />;
        })}
      </g>
      <text x={150} y={168} textAnchor="middle" fontFamily="var(--font-serif)" fontSize={62} fill={PALE}>
        14
      </text>
      <text x={150} y={190} textAnchor="middle" fontFamily="var(--font-sans)" fontSize={9.5} letterSpacing={4} fill={PALE} fillOpacity={0.75}>
        DAYS
      </text>
    </svg>
  );
}

function GuardSeal({ className }: { className: string }) {
  return (
    <svg aria-hidden viewBox="0 0 160 160" className={`pointer-events-none absolute ${className}`}>
      <defs>
        <path id="note-seal-ring" d="M80,80 m-53,0 a53,53 0 1,1 106,0 a53,53 0 1,1 -106,0" />
      </defs>
      <path d={serrated(80, 80, 77, 71, 72)} fill="#0e3b2c" stroke={PALE} strokeOpacity={0.8} strokeWidth={0.7} />
      <circle cx={80} cy={80} r={65} fill="none" stroke={PALE} strokeOpacity={0.6} strokeWidth={0.7} />
      <text fontFamily="var(--font-sans)" fontSize={8.6} letterSpacing={1.9} fill={PALE} fillOpacity={0.85}>
        <textPath href="#note-seal-ring">THE MARGIN GUARD  ·  NO MONEY MOVES WITHOUT IT  ·  </textPath>
      </text>
      <circle cx={80} cy={80} r={42} fill="none" stroke={PALE} strokeOpacity={0.6} strokeWidth={0.7} />
      <g fill="none" stroke={INK_GREEN} strokeOpacity={1} strokeWidth={0.45}>
        {guillocheRing(80, 80, 32, 6, 12, 4).map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <circle cx={80} cy={80} r={21} fill="#0e3b2c" stroke={PALE} strokeOpacity={0.7} strokeWidth={0.6} />
      <text x={80} y={88} textAnchor="middle" fontFamily="var(--font-serif)" fontSize={21} fill={PALE}>
        NS
      </text>
    </svg>
  );
}

function Plaque({ text, short, className }: { text: string; short?: string; className: string }) {
  return (
    <p
      aria-hidden
      className={`pointer-events-none absolute left-1/2 -translate-x-1/2 border border-white/45 bg-brand px-3 py-[3px] text-[9px] tracking-[0.32em] whitespace-nowrap text-white/90 lg:px-6 lg:py-1 lg:text-[11px] lg:tracking-[0.4em] ${className}`}
    >
      {short ? (
        <>
          <span className="lg:hidden">{short}</span>
          <span className="hidden lg:inline">{text}</span>
        </>
      ) : (
        text
      )}
    </p>
  );
}

function Signature({ name, role, className }: { name: string; role: string; className: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute hidden text-center @min-[700px]:block ${className}`}>
      <p className="font-serif text-[26px] leading-none text-white/85 italic">{name}</p>
      <div className="mt-2 h-px w-[190px] bg-white/45" />
      <p className="mt-1.5 text-[9px] tracking-[0.3em] text-white/60">{role}</p>
    </div>
  );
}

export function BanknoteArt() {
  return (
    <>
      <div aria-hidden className="absolute inset-0 bg-brand" />
      {/* The lathe tint: two families of fine, even waves crossing, like the background of a banknote. */}
      <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full">
        <defs>
          <pattern id="note-lathe-a" width={40} height={7} patternUnits="userSpaceOnUse">
            <path d="M0 3.5 Q10 1 20 3.5 T40 3.5" fill="none" stroke={PALE} strokeOpacity={0.07} strokeWidth={0.6} />
          </pattern>
          <pattern id="note-lathe-b" width={40} height={7} patternUnits="userSpaceOnUse">
            <path d="M0 3.5 Q10 6 20 3.5 T40 3.5" fill="none" stroke={INK_GREEN} strokeOpacity={0.16} strokeWidth={0.6} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#note-lathe-a)" />
        <rect width="100%" height="100%" fill="url(#note-lathe-b)" />
      </svg>

      {/* The frame: outer and inner rules with a rope border between them. */}
      <div aria-hidden className="pointer-events-none absolute inset-[12px] border border-white/40 lg:inset-[20px]" />
      <div aria-hidden className="pointer-events-none absolute inset-[42px] border border-white/30 lg:inset-[58px]" />
      <RopeBand side="top" />
      <RopeBand side="bottom" />
      <RopeBand side="left" />
      <RopeBand side="right" />
      <CornerCounter className="top-[-2px] left-[-2px] lg:top-[-3px] lg:left-[-3px]" />
      <CornerCounter className="top-[-2px] right-[-2px] lg:top-[-3px] lg:right-[-3px]" />
      <CornerCounter className="bottom-[-2px] left-[-2px] lg:bottom-[-3px] lg:left-[-3px]" />
      <CornerCounter className="right-[-2px] bottom-[-2px] lg:right-[-3px] lg:bottom-[-3px]" />

      <Plaque text="NEVERSHORT" className="top-[16px] lg:top-[29px]" />
      <Plaque text="THIS FORECAST IS GOOD FOR FOURTEEN DAYS" short="GOOD FOR FOURTEEN DAYS" className="bottom-[16px] lg:bottom-[29px]" />

      <p aria-hidden className="pointer-events-none absolute top-[78px] left-[96px] hidden font-mono text-[15px] tracking-[0.2em] text-red lg:block">
        NS 05112026 A
      </p>
      <p aria-hidden className="pointer-events-none absolute top-[80px] right-[96px] hidden text-[10px] tracking-[0.35em] text-white/60 lg:block">
        SERIES 2026
      </p>
      <p aria-hidden className="pointer-events-none absolute right-[96px] bottom-[80px] hidden font-mono text-[15px] tracking-[0.2em] text-red lg:block">
        NS 05112026 A
      </p>

      {/* Sized by the note's own width (container queries), not the window: wide note = medallion and seal,
          medium = the seal alone, narrow = neither. Content inside reserves room with NOTE_ROOM below. */}
      <NoteMedallion className="top-[100px] right-[5%] hidden h-[230px] w-[230px] @min-[940px]:block" />
      <GuardSeal className="top-[212px] right-[calc(5%-34px)] hidden h-[128px] w-[128px] @min-[940px]:block" />
      <GuardSeal className="top-[96px] right-[6%] hidden h-[136px] w-[136px] @min-[760px]:block @min-[940px]:hidden" />

      <Signature name="Margin Guard" role="KEEPER OF THE GUARD" className="bottom-[96px] left-[112px]" />
      <Signature name="Loop Audio" role="OWNER" className="right-[24%] bottom-[96px]" />
    </>
  );
}


/** Put on the content that sits beside the medallion or seal, so it never runs underneath them. */
export const NOTE_ROOM = "@min-[760px]:pr-[170px] @min-[940px]:pr-[290px]";

/** The deep green note with the engraving behind its content. Content inside is white (use `inverse`). */
export function BanknotePanel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`@container relative overflow-hidden bg-brand text-white ${className}`}>
      <BanknoteArt />
      <div className="relative">{children}</div>
    </section>
  );
}
