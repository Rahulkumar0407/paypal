import { ButtonLink } from "./Button";

/**
 * Empty, loading and error states, in the product's voice: say what happened and what to do next.
 * Errors don't apologise and are never vague. Loading doesn't animate for decoration.
 */

export function EmptyState({ title, body, action }: { title: string; body: string; action?: { label: string; href: string } }) {
  return (
    <div className="rounded-card border border-dashed border-ink/20 bg-paper/70 px-5 py-8 text-center lg:py-10">
      <p className="text-[17px] leading-6 font-semibold text-ink">{title}</p>
      <p className="mx-auto mt-1 max-w-[42ch] text-[15px] leading-6 text-ink-muted">{body}</p>
      {action ? (
        <div className="mt-4">
          <ButtonLink href={action.href} variant="secondary">
            {action.label}
          </ButtonLink>
        </div>
      ) : null}
    </div>
  );
}

export function LoadingState({ label = "Working out your numbers." }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="rounded-card bg-paper p-5 lg:p-6">
      <p className="text-[15px] leading-6 text-ink-muted">{label}</p>
      <div aria-hidden className="mt-4 space-y-2.5">
        <div className="h-3 w-3/4 rounded-full bg-line" />
        <div className="h-3 w-1/2 rounded-full bg-line" />
        <div className="h-3 w-2/3 rounded-full bg-line" />
      </div>
    </div>
  );
}

export function ErrorState({
  title,
  body,
  retryHref,
  retryLabel = "Try again",
}: {
  title: string;
  body: string;
  retryHref?: string;
  retryLabel?: string;
}) {
  return (
    <div role="alert" className="rounded-card bg-paper p-5 lg:p-6">
      <div className="flex items-start gap-3">
        <span aria-hidden className="mt-1.5 inline-block size-2.5 shrink-0 rounded-full bg-red" />
        <div>
          <p className="text-[17px] leading-6 font-semibold text-ink">{title}</p>
          <p className="mt-1 max-w-[52ch] text-[15px] leading-6 text-ink-muted">{body}</p>
          {retryHref ? (
            <div className="mt-4">
              <ButtonLink href={retryHref} variant="secondary">
                {retryLabel}
              </ButtonLink>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
