"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActive, PRIMARY_NAV, SECONDARY_NAV, UTILITY_NAV } from "./nav";

export function SideNav() {
  const pathname = usePathname();
  const item = (href: string, label: string) => {
    const active = isActive(pathname, href);
    return (
      <li key={href}>
        <Link
          href={href}
          aria-current={active ? "page" : undefined}
          className={`block rounded-control px-3 py-2 text-[15px] leading-5 ${active ? "bg-surface font-semibold text-ink" : "text-ink-muted hover:text-ink"}`}
        >
          {label}
        </Link>
      </li>
    );
  };
  return (
    <nav aria-label="Main" className="flex flex-1 flex-col">
      <ul className="space-y-0.5">{[...PRIMARY_NAV, ...SECONDARY_NAV].map((n) => item(n.href, n.label))}</ul>
      <ul className="mt-auto space-y-0.5 border-t border-line pt-4">{UTILITY_NAV.map((n) => item(n.href, n.label))}</ul>
    </nav>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const moreActive = [...PRIMARY_NAV].every((n) => !isActive(pathname, n.href));
  const items = [...PRIMARY_NAV, { href: "/more", label: "More" }];
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto flex max-w-[560px]">
        {items.map((n) => {
          const active = n.href === "/more" ? moreActive : isActive(pathname, n.href);
          return (
            <li key={n.href} className="flex-1">
              <Link
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex h-14 items-center justify-center text-[14px] ${active ? "font-semibold text-ink" : "text-ink-muted"}`}
              >
                {active ? <span aria-hidden className="absolute top-0 h-[3px] w-8 rounded-b-full bg-ink" /> : null}
                {n.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
