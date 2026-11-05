import Link from "next/link";

/** The landing page's top bar: the name, the two places on the page, and the one thing to do. */
export function TopBar() {
  return (
    <header className="mx-auto flex w-full max-w-[1240px] items-center justify-between gap-4 px-5 pt-5 lg:px-10 lg:pt-7">
      <Link href="/" className="display text-[28px] leading-none text-ink lg:text-[32px]">
        NeverShort
      </Link>
      <nav aria-label="Main" className="flex items-center gap-6">
        <a href="#how" className="hidden text-[15px] text-ink-muted hover:text-ink sm:inline">
          How it works
        </a>
        <a href="#save" className="hidden text-[15px] text-ink-muted hover:text-ink sm:inline">
          Try it
        </a>
        <Link href="/demo" className="btn-chunky btn-sm">
          Live demo
        </Link>
      </nav>
    </header>
  );
}
