import Link from "next/link";

/** The landing page's top bar: the name, and the one thing to do. */
export function TopBar() {
  return (
    <header className="relative z-20 mx-auto flex w-full max-w-[1240px] items-center justify-between gap-4 px-5 pt-5 lg:px-10 lg:pt-7">
      <Link href="/" className="font-serif text-[26px] leading-none text-ink lg:text-[30px]">
        NeverShort
      </Link>
      <nav aria-label="Main" className="flex items-center gap-5">
        <Link href="/today" className="hidden text-[15px] text-ink-muted hover:text-ink sm:inline">
          The app
        </Link>
        <Link href="/demo" className="key key-sm !min-h-11 !px-4 !text-[11.5px] !tracking-[0.08em]">
          Open the live demo
        </Link>
      </nav>
    </header>
  );
}
