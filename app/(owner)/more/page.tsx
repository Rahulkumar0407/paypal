import type { Metadata } from "next";
import Link from "next/link";
import { PageSentence } from "@/components/ui";
import { SECONDARY_NAV, UTILITY_NAV } from "@/components/app/nav";

export const metadata: Metadata = { title: "More" };

/** Phone only: the pages that don't fit in the tab bar. */
export default function MorePage() {
  return (
    <div className="space-y-8">
      <PageSentence>Everything else.</PageSentence>
      {[SECONDARY_NAV, UTILITY_NAV].map((group, i) => (
        <ul key={i} className="divide-y divide-line border-y border-line">
          {group.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="flex min-h-14 items-center text-[17px] text-ink">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}
