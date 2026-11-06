"use client";

import { useState } from "react";

export function CollapsibleSection({
  title,
  subtitle,
  children,
  defaultOpen = false,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
      >
        <div>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <span className="text-xs font-semibold text-blue-600 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100">
          {isOpen ? "Hide details ▲" : "Show details ▼"}
        </span>
      </button>

      {isOpen && (
        <div className="p-4 sm:p-6 border-t border-slate-100 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}
