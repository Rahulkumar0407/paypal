import type { DayState } from "@/types";
import { DAY_FILL, DAY_WORD } from "@/components/ui/meaning";
import { formatDollars, formatShortfall } from "@/lib/shared/money";

/**
 * A compact day ticket for the landing page: the day, a ticket stub coloured by how the day looks with its closing
 * balance, and the word. Text on red is 19px+ bold (AGENTS.md section 7 contrast); colour always has a word.
 */
export function MiniTicket({
  label,
  strong = false,
  closingCents,
  state,
  shortByCents,
  stamp,
  lit = false,
  narrow = false,
}: {
  label: string;
  strong?: boolean;
  closingCents: number;
  state: DayState;
  shortByCents: number;
  /** A stamp that lands on the ticket: SHORT, or COVERED/TIGHT when the day was just fixed. */
  stamp?: "short" | "covered" | "tight" | null;
  /** Highlighted during a replay. */
  lit?: boolean;
  /** For a row of 14 on a laptop: smaller amounts so "$2,260" fits a narrow stub. */
  narrow?: boolean;
}) {
  return (
    <>
      <p className={`text-[11px] leading-4 whitespace-nowrap sm:text-[12px] ${strong ? "font-semibold text-white" : "text-white/80"}`}>{label}</p>
      <div className={`ticket-wrap mt-1 ${lit ? "mini-lit" : ""}`}>
        <div className={`ticket hero-ticket strip-block flex h-[52px] items-end rounded-tile px-1.5 pb-1.5 sm:h-[64px] sm:px-2 ${DAY_FILL[state]}`}>
          <span
            className={`font-serif leading-none font-bold tracking-[-0.03em] whitespace-nowrap text-ink tabular ${state === "short" ? "text-[19px] sm:text-[21px]" : narrow ? "text-[13.5px] sm:text-[15px] lg:text-[13.5px]" : "text-[13.5px] sm:text-[15px]"}`}
          >
            {formatDollars(closingCents)}
          </span>
          {stamp ? (
            <span
              aria-hidden
              className={`ticket-stamp ${stamp === "short" ? "ticket-stamp-short" : "ticket-stamp-covered"} ${stamp === "short" ? "" : "ticket-stamp-land"}`}
            >
              {stamp === "short" ? "Short" : stamp === "tight" ? "Tight" : "Covered"}
            </span>
          ) : null}
        </div>
      </div>
      <p className={`mt-1 truncate text-[11px] leading-4 sm:text-[12px] ${state === "covered" ? "text-white/75" : "font-semibold text-white"}`}>
        {state === "short" ? `${formatShortfall(shortByCents)} short` : DAY_WORD[state]}
      </p>
    </>
  );
}
