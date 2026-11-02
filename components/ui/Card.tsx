/** One idea per card: white on the banknote paper. `outline` adds a firmer hairline. No shadows. */
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
  const toneClass = tone === "surface" ? "bg-paper ring-1 ring-ink/[0.06]" : "bg-paper ring-1 ring-line ring-inset";
  return <Tag className={`rounded-card p-5 lg:p-6 ${toneClass} ${className}`}>{children}</Tag>;
}

/** A small heading inside a card or section: sentence case, no capitals. */
export function CardTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-[17px] leading-6 font-semibold text-ink ${className}`}>{children}</h2>;
}

/** A label that says something is simulated, not real (AGENTS.md section 3). */
export function SimulatedTag({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-chip border border-dashed whitespace-nowrap border-ink-muted/70 px-1.5 py-px text-[12px] leading-4 font-medium text-ink-muted ${className}`}
    >
      Simulated
    </span>
  );
}

/** A label that says something runs on the real PayPal sandbox: real sandbox payments, no real money. */
export function SandboxTag({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-chip border border-brand whitespace-nowrap px-1.5 py-px text-[12px] leading-4 font-medium text-brand ${className}`}>
      PayPal test mode
    </span>
  );
}

/** A thin bar showing how much of a payment is ready. Always shown next to the words that say it. */
export function ReadyMeter({ readyCents, amountCents }: { readyCents: number; amountCents: number }) {
  const pct = amountCents === 0 ? 100 : Math.max(0, Math.min(100, Math.round((readyCents / amountCents) * 100)));
  return (
    <span aria-hidden className="flex h-1.5 w-full overflow-hidden rounded-full bg-red">
      <span className="h-full bg-green" style={{ width: `${pct}%` }} />
    </span>
  );
}
