"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

/**
 * Shown when an owner page fails to load.
 * Guarantees clear feedback: states that no money moved and provides a direct retry action.
 * Loading skeletons never remain indefinitely.
 */
export default function OwnerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[OwnerError boundary caught]:", error);
  }, [error]);

  return (
    <div
      role="alert"
      className="max-w-xl mx-auto p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 text-center sm:text-left"
    >
      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
        <span className="w-2 h-2 rounded-full bg-rose-600" />
        Connection / Loading Interruption
      </div>

      <h1 className="text-2xl font-serif font-black text-slate-900 tracking-tight">
        This screen couldn&apos;t finish loading.
      </h1>

      <p className="text-sm text-slate-600 leading-relaxed">
        Your funds and account are completely safe. All financial operations and reads fail closed: nothing is paid, scheduled, or transferred without explicit Margin Guard validation.
      </p>

      {error.digest ? (
        <p className="font-mono text-xs text-slate-400">
          Error reference: {error.digest}
        </p>
      ) : null}

      <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
        <Button onClick={reset}>
          Try loading again
        </Button>
        <a
          href="/today"
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Return to Overview
        </a>
      </div>
    </div>
  );
}
