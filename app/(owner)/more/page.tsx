import type { Metadata } from "next";
import Link from "next/link";
import { SECONDARY_NAV, UTILITY_NAV } from "@/components/app/nav";

export const metadata: Metadata = { title: "More • tmrw" };

export default function MorePage() {
  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <h1 className="text-2xl font-serif font-black text-slate-900 tracking-tight">
          Tools & Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Co-pilot assistance, audit logs, scenario modeling, and system configurations.
        </p>
      </div>

      <div className="space-y-6">
        {/* Tools Section */}
        <div className="space-y-2">
          <span className="text-xs font-mono uppercase font-bold text-slate-500 tracking-wider px-1">
            Tools & Audit
          </span>
          <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 shadow-sm overflow-hidden">
            {SECONDARY_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors group"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {item.label}
                  </span>
                  {item.description && (
                    <span className="text-xs text-slate-500 mt-0.5">
                      {item.description}
                    </span>
                  )}
                </div>
                <span className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all text-sm font-bold">
                  →
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Resources & Demos */}
        <div className="space-y-2">
          <span className="text-xs font-mono uppercase font-bold text-slate-500 tracking-wider px-1">
            Demonstration & Simulation
          </span>
          <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 shadow-sm overflow-hidden">
            {UTILITY_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors group"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {item.label}
                  </span>
                  {item.description && (
                    <span className="text-xs text-slate-500 mt-0.5">
                      {item.description}
                    </span>
                  )}
                </div>
                <span className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all text-sm font-bold">
                  →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
