import type { Decision } from "@/types";
import { DECISION_FILL, DECISION_WORD } from "./meaning";

/**
 * Signature element 3: a Margin Guard decision shown as a referee's card, held up at a slight tilt,
 * followed by the word. Green Approved, amber Escalated, red Blocked.
 */
export function RefereeCard({ decision, size = "md", label }: { decision: Decision; size?: "sm" | "md" | "lg"; label?: string }) {
  const card = { sm: "h-[15px] w-[11px]", md: "h-[19px] w-[14px]", lg: "h-[30px] w-[22px]" }[size];
  const text = { sm: "text-[13px]", md: "text-[14px]", lg: "text-[18px]" }[size];
  return (
    <span className="inline-flex items-center gap-2 align-middle">
      <span
        aria-hidden
        className={`inline-block shrink-0 -rotate-[11deg] rounded-[2px] shadow-[1px_1.5px_0_rgb(20_32_27/0.3)] ${card} ${DECISION_FILL[decision]}`}
      />
      <span className={`font-medium leading-none text-ink ${text}`}>{label ?? DECISION_WORD[decision]}</span>
    </span>
  );
}
