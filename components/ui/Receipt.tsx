import type { Proposer, Receipt as ReceiptData, RuleResult } from "@/types";
import { formatDayWithYear } from "@/lib/shared/dates";
import { formatCents } from "@/lib/shared/money";
import { ACTION_WORD } from "./meaning";

/**
 * Signature element 4: every Guard decision prints as a thermal shop receipt.
 * Monospace, dashed dividers, zig-zag edges, PASS / FAIL / N/A per rule, and a BLOCKED stamp
 * that lands when the decision is BLOCK. The only place in the app that uses mono or capitals.
 */

const DECISION_LINE = { APPROVE: "APPROVED", ESCALATE: "NEEDS YOUR OK", BLOCK: "BLOCKED" } as const;

function proposerName(p: Proposer): string {
  if (p.kind === "OWNER") return "You";
  return { RECOVERY: "Reminder helper", RISK: "Risky-order check", ASK: "Ask" }[p.agent];
}

function timeOf(iso: string): string {
  return iso.slice(11, 16);
}

function Rule({ rule }: { rule: RuleResult }) {
  const mark =
    rule.outcome === "PASS"
      ? "bg-green"
      : rule.outcome === "FAIL"
        ? rule.onFail === "BLOCK"
          ? "bg-red"
          : "bg-amber"
        : "border border-ink/40";
  return (
    <li className="py-[3px]">
      <div className="flex items-baseline gap-2">
        <span className="w-3 shrink-0 tabular">{rule.number}</span>
        <span className="min-w-0 flex-1 truncate">{rule.name}</span>
        <span className="flex shrink-0 items-center gap-1.5">
          <span aria-hidden className={`inline-block size-[7px] ${mark}`} />
          <span className={rule.outcome === "FAIL" ? "font-bold" : rule.outcome === "N/A" ? "text-ink-muted" : ""}>{rule.outcome}</span>
        </span>
      </div>
      {rule.outcome !== "N/A" ? <p className="pl-5 text-ink-muted">{rule.reason}</p> : null}
    </li>
  );
}

function Divider() {
  return <div aria-hidden className="my-3 border-t border-dashed border-ink/45" />;
}

export function Receipt({
  receipt,
  storeName = "Loop Audio",
  animateStamp = true,
}: {
  receipt: ReceiptData;
  storeName?: string;
  animateStamp?: boolean;
}) {
  const { proposal, decision } = receipt;
  const blocked = decision.decision === "BLOCK";
  return (
    <article
      className="receipt-shadow relative w-full max-w-[380px]"
      aria-label={`Receipt ${receipt.number}: ${ACTION_WORD[proposal.type]}, ${DECISION_LINE[decision.decision].toLowerCase()}`}
    >
      <div className="receipt-paper px-5 pt-8 pb-9 font-mono text-[12.5px] leading-[1.55] text-ink sm:px-6">
        <header className="text-center">
          <p className="font-bold tracking-[0.06em] uppercase">{storeName}</p>
          <p className="tracking-[0.06em] uppercase">Margin Guard receipt</p>
          <p className="mt-1 whitespace-pre text-ink-muted">
            {`No. ${String(receipt.number).padStart(4, "0")}  ${formatDayWithYear(decision.demoDate)}  ${timeOf(decision.decidedAt)}`}
          </p>
        </header>

        <Divider />
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-bold uppercase">{ACTION_WORD[proposal.type]}</span>
          <span className="font-bold tabular">{formatCents(proposal.amountCents)}</span>
        </div>
        <p>{proposal.target.label}</p>
        <p className="text-ink-muted">Proposed by: {proposerName(proposal.proposedBy)}</p>

        <Divider />
        <ol aria-label="Rules checked">
          {decision.rules.map((rule) => (
            <Rule key={rule.id} rule={rule} />
          ))}
        </ol>

        <Divider />
        <div className="flex items-baseline justify-between gap-3 text-[14px]">
          <span className="font-bold uppercase">Decision</span>
          <span className="font-bold tracking-[0.04em]">{DECISION_LINE[decision.decision]}</span>
        </div>
        <p className="mt-1">{decision.headlineReason}</p>

        {receipt.events.length > 1 ? (
          <ul className="mt-2 text-ink-muted">
            {receipt.events.slice(1).map((e) => (
              <li key={`${e.kind}-${e.at}`}>
                {timeOf(e.at)} {e.detail}
              </li>
            ))}
          </ul>
        ) : null}

        <Divider />
        <dl className="space-y-0.5 text-ink-muted">
          {receipt.paypalIds.checked.length > 0 ? (
            <div>
              <dt>PayPal checked</dt>
              <dd className="break-all text-ink">{receipt.paypalIds.checked.join(", ")}</dd>
            </div>
          ) : null}
          {receipt.paypalIds.created.length > 0 ? (
            <div>
              <dt>PayPal created</dt>
              <dd className="break-all text-ink">{receipt.paypalIds.created.join(", ")}</dd>
            </div>
          ) : null}
          <div>
            <dt className="inline">Ref </dt>
            <dd className="inline break-all">{proposal.idempotencyKey}</dd>
          </div>
        </dl>
        <p className="mt-4 text-center text-ink-muted">No money moves without the Margin Guard.</p>
      </div>

      {blocked ? (
        <div
          aria-hidden
          className={`stamp pointer-events-none absolute top-[34%] right-5 rounded-[6px] border-[3px] border-red px-3.5 py-1 font-sans text-[30px] leading-tight font-extrabold tracking-[0.1em] text-red uppercase opacity-90 mix-blend-multiply shadow-[inset_0_0_0_2px_var(--color-paper),inset_0_0_0_3px_var(--color-red)] ${animateStamp ? "stamp-animate" : ""}`}
        >
          Blocked
        </div>
      ) : null}
    </article>
  );
}
