"use client";

import { Button } from "@/components/ui/Button";

/** Shown when a page fails to load. No money moved: reads failing never touch payments. */
export default function OwnerError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="max-w-[560px] rounded-card bg-paper p-6">
      <p className="font-serif text-[2rem] leading-[1.1] text-ink">This page didn&apos;t load.</p>
      <p className="mt-3 text-[15px] leading-6 text-ink-muted">
        Your money hasn&apos;t moved: nothing is paid or sent unless the Guard approves it. Try again, and if it keeps happening, reset
        the demo from Demo controls.
      </p>
      {error.digest ? <p className="mt-2 font-mono text-[12px] text-ink-muted">Reference {error.digest}</p> : null}
      <div className="mt-5">
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
