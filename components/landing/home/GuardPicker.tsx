"use client";

import Image from "next/image";
import { useState } from "react";
import type { Decision } from "@/types";
import type { StoryReceipt } from "@/lib/landing";
import { Receipt } from "@/components/ui/Receipt";
import { formatDollars } from "@/lib/shared/money";

const WORD: Record<Decision, string> = { APPROVE: "Approved", ESCALATE: "Needs your OK", BLOCK: "Blocked" };
/** Where each of the guard's signs is in v2's picture (green, amber, red), and its glow. */
const SIGN: Record<Decision, { left: string; top: string; glow: string }> = {
  APPROVE: { left: "50.2%", top: "12.4%", glow: "rgb(34 165 91 / 0.55)" },
  ESCALATE: { left: "57.5%", top: "25.7%", glow: "rgb(242 169 59 / 0.6)" },
  BLOCK: { left: "60.5%", top: "37%", glow: "rgb(229 72 77 / 0.55)" },
};

/**
 * "Nothing moves without passing it", in v2's scene: the guard holding her three signs. Three real decisions (lib/landing
 * runs the actual 9 rules); pick one and its sign glows and its receipt prints.
 */
export function GuardPicker({ receipts, shop }: { receipts: StoryReceipt[]; shop: string }) {
  const [picked, setPicked] = useState(0);
  const current = receipts[picked];
  if (!current) return null;
  const decision = current.receipt.decision.decision;
  const sign = SIGN[decision];
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12">
      <div className="min-w-0">
        <div className="h-art relative">
          <div className="h-parallax">
            <Image src="/landing/scene_guard_custom.jpg" alt="The Margin Guard holds up green, amber and red signs while the shopkeeper watches" width={1376} height={768} unoptimized className="h-auto w-full" />
          </div>
          <span key={picked} aria-hidden className="h-glow" style={{ left: sign.left, top: sign.top, ["--glow" as string]: sign.glow }} />
        </div>
        <div role="group" aria-label="Three decisions the safety check made" className="mt-5 grid gap-2.5 sm:grid-cols-3">
          {receipts.map(({ receipt }, i) => {
            const d = receipt.decision.decision;
            return (
              <button
                key={receipt.id}
                type="button"
                aria-pressed={picked === i}
                onClick={() => setPicked(i)}
                className={`flex items-center gap-3 rounded-[18px] px-4 py-3 text-left transition-all ${
                  picked === i ? "bg-[var(--h-ink)] text-white shadow-[0_10px_24px_-12px_rgb(0_20_53_/_0.7)]" : "bg-white text-[var(--h-ink)] shadow-[0_0_0_1px_var(--h-line)] hover:shadow-[0_0_0_1.5px_#cbd5e1]"
                }`}
              >
                <span aria-hidden className={`h-ref h-ref-${d} !h-[30px] !w-[22px]`} />
                <span>
                  <span className="block text-[14.5px] font-extrabold">{WORD[d]}</span>
                  <span className={`block text-[12.5px] ${picked === i ? "text-white/70" : "text-[var(--h-muted)]"}`}>
                    {receipt.proposal.target.label.replace(/^Order #\d+, /, "")}, {formatDollars(receipt.proposal.amountCents)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <p key={`c-${picked}`} className="h-slip-in mt-5 text-[16px] leading-7 text-[var(--h-strong)]">
          {current.caption}
        </p>
      </div>
      <div key={current.receipt.id} className="h-receipt-swap mx-auto w-full max-w-[380px]">
        <Receipt receipt={current.receipt} storeName={shop} compact />
      </div>
    </div>
  );
}
