export interface NavItem {
  href: string;
  label: string;
}

/** Owner navigation. Phone shows the first four plus More; the laptop sidebar shows all. */
export const PRIMARY_NAV: NavItem[] = [
  { href: "/", label: "Today" },
  { href: "/dues", label: "Dues" },
  { href: "/approvals", label: "Approvals" },
  { href: "/ask", label: "Ask" },
];

export const SECONDARY_NAV: NavItem[] = [
  { href: "/receipts", label: "Receipts" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/settings", label: "Settings" },
];

export const UTILITY_NAV: NavItem[] = [
  { href: "/demo", label: "Demo controls" },
  { href: "/store", label: "Open the store" },
  { href: "/design", label: "Design system" },
];

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
