export interface NavItem {
  href: string;
  label: string;
  icon?: string;
  description?: string;
}

/** Primary owner navigation for modern fintech dashboard. */
export const PRIMARY_NAV: NavItem[] = [
  { href: "/today", label: "Overview", icon: "overview", description: "Cash position & critical alerts" },
  { href: "/dashboard", label: "Forecast", icon: "forecast", description: "30-day cashflow trajectory" },
  { href: "/dues", label: "Payments", icon: "payments", description: "Bills, suppliers & dues" },
  { href: "/approvals", label: "Decisions", icon: "decisions", description: "Margin Guard approvals inbox" },
];

export const SECONDARY_NAV: NavItem[] = [
  { href: "/ask", label: "Ask Co-pilot", icon: "ask", description: "AI cash queries with tools" },
  { href: "/receipts", label: "Receipts", icon: "receipts", description: "Audit trail & guard logs" },
  { href: "/data", label: "Financial Data", icon: "receipts", description: "Enter, import and correct records" },
  { href: "/onboarding", label: "Merchant Setup", icon: "setup", description: "Real store onboarding" },
  { href: "/settings", label: "Settings", icon: "settings", description: "Store rules & limits" },
];

export const UTILITY_NAV: NavItem[] = [
  { href: "/demo", label: "Demo Guide", icon: "demo", description: "Step-by-step walkthrough" },
  { href: "/try", label: "Try Your Numbers", icon: "calculator", description: "Custom cashflow scenario" },
  { href: "/store", label: "Customer Storefront", icon: "store", description: "Live buyer checkout view" },
];

export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
