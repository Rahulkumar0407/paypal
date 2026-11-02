"use client";

import { useState } from "react";

/** A value with a small Copy button, for the sandbox buyer login on a phone. */
export function CopyText({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="text-[13px] leading-5 text-ink-muted">{label}</p>
        <p className="text-[16px] leading-6 font-semibold break-all text-ink select-all">{value}</p>
      </div>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(value).then(
            () => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1600);
            },
            () => setCopied(false),
          );
        }}
        className="min-h-10 shrink-0 rounded-control bg-paper px-3 text-[14px] font-medium text-ink ring-1 ring-line ring-inset hover:bg-surface"
        aria-label={`Copy ${label.toLowerCase()}`}
      >
        <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
      </button>
    </div>
  );
}
