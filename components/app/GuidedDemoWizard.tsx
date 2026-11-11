"use client";

import { useState } from "react";
import Link from "next/link";
import { SandboxTag, SimulatedTag } from "@/components/ui";
import { CopyText } from "@/components/app/CopyText";

export interface GuidedStep {
  title: string;
  todo: string;
  see: string;
  uses: ("simulated" | "sandbox")[];
  link: { label: string; href: string };
  buyerLogin?: boolean;
  technicalNote?: string;
}

const SANDBOX_BUYER: { email: string; password: string } | null = null;

const TECHNICAL_DETAILS: Record<number, { title: string; points: string[] }> = {
  0: {
    title: "30-Day Trajectory & First Shortfall Detection",
    points: [
      "Calculated deterministically using weekday-weighted moving averages of net sales minus known obligations.",
      "Identifies Thu 12 Nov shortfall: Volta Audio Parts ($300) and Studio Rent ($600) collide on the same day.",
      "Pure TypeScript rules in lib/forecast/engine.ts. AI is never permitted to calculate money.",
    ],
  },
  1: {
    title: "Recovery Agent & Margin Guard Evaluation",
    points: [
      "Recovery agent identifies abandoned cart checkout (Order #1042, $72.00) with customer contact consent.",
      "Passes to Margin Guard: checks Rule 1 (Already paid? No), Rule 2 (Consent? Yes), Rule 3 (Frequency? 0 in 48h).",
      "Decision: APPROVE. Generates an immutable thermal receipt and creates a simulated outbox draft.",
    ],
  },
  2: {
    title: "PayPal Sandbox Orders v2 & Webhook Reconciliation",
    points: [
      "Generates a fresh PayPal Sandbox Orders v2 checkout link on demand.",
      "Buyer captures payment via PayPal Sandbox; webhook verifies transmission signature.",
      "App records gross ($72.00), fee ($2.39), and actual net ($69.61) to immediately improve cash balance.",
    ],
  },
  3: {
    title: "Deterministic Safety Enforcement (Rule 1: Already Paid)",
    points: [
      "Agent attempts to submit a follow-up reminder for the same target order.",
      "Margin Guard checks PayPal order capture state in real-time.",
      "Decision: BLOCK. Rule 1 triggers. BLOCKED stamp rendered on thermal receipt. Customer is protected.",
    ],
  },
  4: {
    title: "Cashflow Gap Resolution (Set-Aside Allocation)",
    points: [
      "Owner selects 'Set aside a little each day' from upcoming sales before Thu 12 Nov.",
      "Evaluated against Rule 7 (Set-aside cap <= 30% of daily sales) and Rule 6 (Minimum balance preservation).",
      "Decision: APPROVE. Thu 12 Nov balance shifts from short to covered. Strip tile stamps COVERED.",
    ],
  },
  5: {
    title: "Tool-Calling AI Co-pilot (Read-Only Financial Queries)",
    points: [
      "User queries 'Can I afford a $200 order on Monday?' in natural language.",
      "AI SDK invokes canAfford() deterministic tool with simulated $200 expenditure on Mon 9 Nov.",
      "Returns exact closing balance and impact on subsequent buffer without hallucinating numbers.",
    ],
  },
};

export function GuidedDemoWizard({
  steps,
  startDay,
}: {
  steps: GuidedStep[];
  startDay: string;
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [showTechDetails, setShowTechDetails] = useState(false);

  const step = steps[activeStep]!;
  const progressPercent = Math.round(((activeStep + 1) / steps.length) * 100);
  const tech = TECHNICAL_DETAILS[activeStep];

  return (
    <div className="space-y-6">
      {/* ── Stepper Navigation Tabs ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="font-bold text-slate-700 uppercase tracking-wider">
            Step {activeStep + 1} of {steps.length}
          </span>
          <span className="text-slate-500 font-medium">{progressPercent}% Completed</span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Step Indicator Pills */}
        <div className="grid grid-cols-6 gap-1.5 sm:gap-2 pt-2">
          {steps.map((s, index) => {
            const isCurrent = index === activeStep;
            const isCompleted = index < activeStep;

            return (
              <button
                key={s.title}
                type="button"
                onClick={() => setActiveStep(index)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs transition-all border ${
                  isCurrent
                    ? "bg-blue-600 text-white font-bold border-blue-600 shadow-sm"
                    : isCompleted
                      ? "bg-blue-50 text-blue-700 font-semibold border-blue-200/80 hover:bg-blue-100"
                      : "bg-slate-50 text-slate-500 border-slate-200/70 hover:bg-slate-100"
                }`}
              >
                <span className="text-[10px] font-mono leading-none">0{index + 1}</span>
                <span className="hidden sm:inline-block text-[11px] truncate max-w-[90px] mt-1 text-center">
                  {s.title.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Active Step Card ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Step Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 pb-5 border-b border-slate-100">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-600">
              Interactive Story Walkthrough {startDay ? `• Baseline: ${startDay}` : ""}
            </span>
            <h2 className="text-2xl font-serif font-black text-slate-900 tracking-tight mt-1">
              Step {activeStep + 1}: {step.title}
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            {step.uses.includes("simulated") && <SimulatedTag />}
            {step.uses.includes("sandbox") && <SandboxTag />}
          </div>
        </div>

        {/* Instruction Rows */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/70 space-y-1">
            <span className="text-[11px] font-mono uppercase font-bold text-slate-500 tracking-wider">
              1. What to do
            </span>
            <p className="text-sm font-semibold text-slate-900 leading-relaxed pt-1">
              {step.todo}
            </p>
          </div>

          <div className="bg-blue-50/40 rounded-xl p-4 border border-blue-100 space-y-1">
            <span className="text-[11px] font-mono uppercase font-bold text-blue-700 tracking-wider">
              2. What you&apos;ll see
            </span>
            <p className="text-sm text-slate-700 leading-relaxed pt-1">
              {step.see}
            </p>
          </div>
        </div>

        {/* Test Buyer Credentials (Step 3) */}
        {step.buyerLogin && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase font-bold text-amber-800">
                PayPal Sandbox Buyer Login
              </span>
              <SandboxTag />
            </div>
            {SANDBOX_BUYER ? (
              <div className="divide-y divide-amber-200/60 bg-white rounded-lg p-3 border border-amber-200">
                <CopyText label="Email" value={SANDBOX_BUYER.email} />
                <CopyText label="Password" value={SANDBOX_BUYER.password} />
              </div>
            ) : (
              <p className="text-xs text-amber-800 leading-relaxed">
                Use your PayPal sandbox buyer personal account credentials when redirected to PayPal Checkout.
              </p>
            )}
          </div>
        )}

        {/* Primary Action Button */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
          <Link
            href={step.link.href}
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 shadow-sm transition-all hover:scale-[1.01]"
          >
            {step.link.label} →
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={activeStep === 0}
              onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              ← Previous
            </button>
            <button
              type="button"
              disabled={activeStep === steps.length - 1}
              onClick={() => setActiveStep((prev) => Math.min(steps.length - 1, prev + 1))}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              Next Step →
            </button>
          </div>
        </div>

        {/* Collapsible Technical Drawer for Hackathon Judges */}
        {tech && (
          <div className="pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowTechDetails((prev) => !prev)}
              className="flex items-center justify-between w-full text-left py-2 text-xs font-mono font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                {showTechDetails ? "Hide" : "Inspect"} Hackathon Judge Technical Architecture ({tech.title})
              </span>
              <span>{showTechDetails ? "▲" : "▼"}</span>
            </button>

            {showTechDetails && (
              <div className="mt-3 p-4 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono space-y-2 border border-slate-800">
                <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px] pb-1 border-b border-slate-800">
                  Verification Specifications
                </div>
                <ul className="space-y-1.5 list-disc list-inside text-slate-300">
                  {tech.points.map((pt, i) => (
                    <li key={i} className="leading-relaxed">
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
