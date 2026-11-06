/** One idea per card: clean white fintech card with subtle borders and shadows. */
export function Card({
  children,
  tone = "surface",
  className = "",
  as: Tag = "section",
}: {
  children: React.ReactNode;
  tone?: "surface" | "outline";
  className?: string;
  as?: "section" | "div" | "article" | "li";
}) {
  const toneClass =
    tone === "surface"
      ? "bg-white rounded-2xl border border-slate-200/80 shadow-sm"
      : "bg-white rounded-2xl border border-slate-200 shadow-sm";
  return <Tag className={`p-5 sm:p-6 ${toneClass} ${className}`}>{children}</Tag>;
}

/** A clean heading inside a card or section: crisp fintech typography. */
export function CardTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={`text-base font-semibold text-slate-900 tracking-tight ${className}`}>
      {children}
    </h2>
  );
}

/** A label that says something is simulated, not real (AGENTS.md section 3). */
export function SimulatedTag({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-2 py-0.5 text-[11px] font-mono font-medium text-slate-600 ${className}`}
    >
      Simulated
    </span>
  );
}

/** A label that says something runs on the real PayPal sandbox: real sandbox payments, no real money. */
export function SandboxTag({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-mono font-semibold text-blue-700 ${className}`}
    >
      PayPal Sandbox
    </span>
  );
}

/** A clean bar showing how much of a payment is ready. */
export function ReadyMeter({ readyCents, amountCents }: { readyCents: number; amountCents: number }) {
  const pct = amountCents === 0 ? 100 : Math.max(0, Math.min(100, Math.round((readyCents / amountCents) * 100)));
  const isFull = pct >= 100;
  return (
    <span aria-hidden className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200/60">
      <span
        className={`h-full rounded-full transition-all ${isFull ? "bg-emerald-500" : "bg-amber-500"}`}
        style={{ width: `${pct}%` }}
      />
    </span>
  );
}
