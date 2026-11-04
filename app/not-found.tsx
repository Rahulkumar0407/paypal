import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[560px] flex-col justify-center px-5">
      <p className="font-serif text-[2.5rem] leading-[1.08] text-ink">There&apos;s nothing at this address.</p>
      <p className="mt-3 text-[16px] leading-7 text-ink-muted">The page may have moved. Today&apos;s forecast is one tap away.</p>
      <p className="mt-6">
        <Link href="/today" className="inline-flex min-h-11 items-center rounded-control bg-brand px-4 text-[15px] font-medium text-white hover:bg-ink">
          Go to today
        </Link>
      </p>
    </main>
  );
}
