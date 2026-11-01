import type { Headline } from "@/types";

/**
 * Signature element 1: the forecast read aloud. One plain sentence in a large serif.
 * Pure ink: no coloured words. When the sentence changes, it settles in (reduced motion: instant).
 */
export function HeadlineSentence({
  headline,
  as: Tag = "h1",
  inverse = false,
}: {
  headline: Headline;
  as?: "h1" | "p";
  /** White text, for a dark background. */
  inverse?: boolean;
}) {
  return (
    <Tag
      aria-live="polite"
      className={`max-w-[22ch] font-serif text-[2rem] leading-[1.1] font-normal tracking-[-0.02em] text-pretty sm:text-[2.6rem] lg:text-[3.15rem] lg:leading-[1.06] ${inverse ? "text-white" : "text-ink"}`}
    >
      <span key={headline.text} className="headline-settle block">
        {headline.text}
      </span>
    </Tag>
  );
}

/** The sentence that opens every other page, slightly smaller than the home headline. */
export function PageSentence({ children, inverse = false }: { children: React.ReactNode; inverse?: boolean }) {
  return (
    <h1
      className={`max-w-[26ch] font-serif text-[1.875rem] leading-[1.12] tracking-[-0.018em] text-pretty lg:text-[2.6rem] lg:leading-[1.08] ${inverse ? "text-white" : "text-ink"}`}
    >
      {children}
    </h1>
  );
}
