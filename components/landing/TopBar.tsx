import Link from "next/link";

/** The landing page's top bar: the name, how it works, your own numbers, and the sample shop. */
export function TopBar() {
  return (
    <header className="mx-auto flex w-full max-w-[1240px] items-center justify-between gap-4 px-5 pt-5 lg:px-10 lg:pt-7">
      <Link href="/" className="display text-[28px] leading-none text-ink lg:text-[32px]">
        NeverShort
      </Link>
      <nav aria-label="Main" className="flex items-center gap-6">
        <Link href="/#how" className="hidden text-[15px] text-ink-muted hover:text-ink sm:inline">
          How it works
        </Link>
        <Link href="/try" className="hidden text-[15px] text-ink-muted hover:text-ink md:inline">
          Try your own numbers
        </Link>
        <Link href="/demo" className="btn-chunky btn-sm whitespace-nowrap">
          <span className="sm:hidden">Sample shop</span>
          <span className="hidden sm:inline">Try the sample shop</span>
        </Link>
      </nav>
    </header>
  );
}
