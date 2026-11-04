"use client";

import { useState } from "react";
import type { Forecast, Headline, Receipt as ReceiptData } from "@/types";
import { Button } from "@/components/ui/Button";
import { HeadlineSentence } from "@/components/ui/HeadlineSentence";
import { MoneyStrip } from "@/components/ui/MoneyStrip";
import { Receipt } from "@/components/ui/Receipt";

/** Shows the one meaningful motion: the gap is fixed, Thursday's tile turns green, the sentence updates. */
export function StripFixDemo({
  before,
  after,
  headlineBefore,
  headlineAfter,
}: {
  before: Forecast;
  after: Forecast;
  headlineBefore: Headline;
  headlineAfter: Headline;
}) {
  const [fixed, setFixed] = useState(false);
  return (
    <div className="space-y-6">
      <HeadlineSentence headline={fixed ? headlineAfter : headlineBefore} as="p" />
      <MoneyStrip days={(fixed ? after : before).days} />
      <Button variant={fixed ? "secondary" : "primary"} onClick={() => setFixed((f) => !f)}>
        {fixed ? "Undo the fix" : "Fix the gap: recover $72 and set aside $11 a day"}
      </Button>
    </div>
  );
}

/** Replays the BLOCKED stamp landing on a receipt. */
export function StampReplay({ receipt }: { receipt: ReceiptData }) {
  const [round, setRound] = useState(0);
  return (
    <div className="flex flex-col items-center gap-4">
      <Receipt key={round} receipt={receipt} />
      <Button variant="secondary" onClick={() => setRound((r) => r + 1)}>
        Stamp it again
      </Button>
    </div>
  );
}

const SCREENS = [
  { path: "/today", label: "Today" },
  { path: "/dues", label: "Dues" },
  { path: "/approvals", label: "Approvals" },
  { path: "/receipts", label: "Receipts" },
  { path: "/ask", label: "Ask" },
  { path: "/dashboard", label: "Dashboard" },
  { path: "/settings", label: "Settings" },
  { path: "/demo", label: "Demo guide" },
  { path: "/store", label: "Store" },
];

/** The real pages, framed at phone (390px) and laptop (1280px) widths. */
export function ScreenPreview() {
  const [path, setPath] = useState("/today");
  return (
    <div className="space-y-6">
      <div role="tablist" aria-label="Screen to preview" className="flex flex-wrap gap-2">
        {SCREENS.map((s) => (
          <button
            key={s.path}
            role="tab"
            aria-selected={s.path === path}
            type="button"
            onClick={() => setPath(s.path)}
            className={`rounded-full px-3.5 py-2 text-[14px] ${s.path === path ? "bg-ink text-white" : "bg-surface text-ink hover:bg-line"}`}
          >
            {s.label}
          </button>
        ))}
      </div>
      {/* Fixed-width frames: on a narrow screen they scroll inside this box, never the page. */}
      <div className="flex flex-col gap-8 overflow-x-auto p-2 xl:flex-row xl:items-start">
        <figure className="shrink-0">
          <figcaption className="mb-2 text-[13px] text-ink-muted">Phone, 390 × 844</figcaption>
          <iframe
            title={`${path} at phone width`}
            src={path}
            width={390}
            height={844}
            className="rounded-[28px] bg-paper ring-8 ring-ink"
          />
        </figure>
        <figure className="min-w-0 flex-1">
          <figcaption className="mb-2 text-[13px] text-ink-muted">Laptop, 1280 × 800, shown at 60%</figcaption>
          <div className="overflow-hidden rounded-tile ring-1 ring-line" style={{ width: 768, height: 480 }}>
            <iframe
              title={`${path} at laptop width`}
              src={path}
              width={1280}
              height={800}
              style={{ transform: "scale(0.6)", transformOrigin: "0 0" }}
            />
          </div>
        </figure>
      </div>
    </div>
  );
}
