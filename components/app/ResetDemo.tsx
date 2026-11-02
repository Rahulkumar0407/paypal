"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";

type ResetResult = { status: "idle" } | { status: "done"; runId: string } | { status: "failed"; message: string };

/** The reset button. Works without JavaScript too (a plain form post); with it, shows progress and the result in place. */
export function ResetDemo({ action, startDay, disabled }: { action: (previous: ResetResult) => Promise<ResetResult>; startDay: string; disabled: boolean }) {
  const [result, formAction, pending] = useActionState(action, { status: "idle" });
  return (
    <form action={formAction} className="space-y-3">
      <Button type="submit" disabled={disabled || pending} className="w-full sm:w-auto">
        {pending ? "Resetting" : "Reset the demo"}
      </Button>
      <div aria-live="polite">
        {result.status === "done" ? (
          <p role="status" className="flex items-start gap-2 rounded-tile bg-surface p-3 text-[15px] leading-6 text-ink">
            <span aria-hidden className="mt-2 inline-block size-2 shrink-0 rounded-full bg-green" />
            <span>
              Back at the start: {startDay}, before step 1. Nobody else&apos;s demo was touched.
            </span>
          </p>
        ) : result.status === "failed" ? (
          <p role="alert" className="flex items-start gap-2 rounded-tile bg-surface p-3 text-[15px] leading-6 text-ink">
            <span aria-hidden className="mt-2 inline-block size-2 shrink-0 rounded-full bg-red" />
            <span>{result.message}</span>
          </p>
        ) : null}
      </div>
    </form>
  );
}
