"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { isActive, PRIMARY_NAV, SECONDARY_NAV, UTILITY_NAV } from "./nav";

const KEYS = [...PRIMARY_NAV, ...SECONDARY_NAV];

/** Number keys 1 to 7 press the till keys, unless the owner is typing or working in a table. */
function useTillShortcuts() {
  const router = useRouter();
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || event.repeat) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) ||
          target.closest('[role="grid"]'))
      )
        return;
      if (!/^[1-9]$/.test(event.key)) return;
      const item = KEYS[Number(event.key) - 1];
      if (item) router.push(item.href);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);
}

/**
 * The laptop menu: a block of register keys on the till, Today as the wide key. Each cap carries its number, which
 * is also its keyboard shortcut. The current page's key stays pressed down. Utility links sit quietly below.
 */
export function SideNav() {
  const pathname = usePathname();
  useTillShortcuts();
  return (
    <nav aria-label="Main" className="flex flex-1 flex-col">
      <ul className="grid grid-cols-2 gap-x-2.5 gap-y-3">
        {KEYS.map((n, i) => {
          const active = isActive(pathname, n.href);
          return (
            <li key={n.href} className={i === 0 ? "col-span-2" : undefined}>
              <Link
                href={n.href}
                aria-current={active ? "page" : undefined}
                aria-keyshortcuts={String(i + 1)}
                className="key"
              >
                <span aria-hidden className="key-num">
                  {i + 1}
                </span>
                {n.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <ul className="mt-auto space-y-0.5 border-t border-line pt-4">
        {UTILITY_NAV.map((n) => {
          const active = isActive(pathname, n.href);
          return (
            <li key={n.href}>
              <Link
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={`block rounded-control px-1 py-1.5 text-[14px] leading-5 ${active ? "font-semibold text-ink" : "text-ink-muted hover:text-ink"}`}
              >
                {n.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** The phone menu: a strip of the till along the bottom, with a row of keys. */
export function BottomNav() {
  const pathname = usePathname();
  const moreActive = [...PRIMARY_NAV].every((n) => !isActive(pathname, n.href));
  const items = [...PRIMARY_NAV, { href: "/more", label: "More" }];
  return (
    <nav
      aria-label="Main"
      className="till-body fixed inset-x-0 bottom-0 z-20 rounded-t-[18px] px-2 pt-2.5 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] lg:hidden"
    >
      <ul className="mx-auto flex max-w-[560px] gap-1.5">
        {items.map((n) => {
          const active = n.href === "/more" ? moreActive : isActive(pathname, n.href);
          return (
            <li key={n.href} className="flex-1">
              <Link href={n.href} aria-current={active ? "page" : undefined} className="key key-sm">
                {n.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
