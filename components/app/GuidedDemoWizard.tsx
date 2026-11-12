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

/** The judges' PayPal sandbox BUYER account: a test account with play money, the only login we publish (AGENTS.md section 6). */
const SANDBOX_BUYER: { email: string; password: string } | null = { email: "sb-awbkq53701713@personal.example.com", password: "Rahul1234" };

/** What happens under the hood at each step, with the demo story's numbers (DEMO.md; checked by lib/forecast/demo-story.test.ts). */
const TECHNICAL_DETAILS: Record<number, { title: string; points: string[] }> = {
  0: {
    title: "30-day forecast and the first short day",
    points: [
      "Money in: the average net sales for each weekday over the last 8 weeks. Money out: bills and the regular payments found in the history.",
      "Finds Thu 12 Nov: rent ($1,500) and the bean order ($400) land together. $1,900 is due, $1,780 is free above the $200 minimum: $120 short.",
      "Pure TypeScript in lib/forecast. AI never calculates money.",
    ],
  },
  1: {
    title: "Reminder helper and the Margin Guard",
    points: [
      "The reminder helper finds Ivory & Vow's unpaid $240 order (#1760). They agreed to be contacted.",
      "Rules 1 to 3 pass (not paid, consent, no reminder in 48 hours). Rule 8 fails: $240 is over the $100 the Guard approves on its own.",
      "Decision: Needs your OK. After Approve, the blocking rules run again, then the executor creates a fresh PayPal sandbox order and puts the reminder in the simulated outbox.",
    ],
  },
  2: {
    title: "PayPal sandbox Orders v2 and webhooks",
    points: [
      "The reminder carries a fresh PayPal sandbox checkout link, made when the reminder was approved.",
      "The buyer pays. The shop captures on the buyer's return and the signed webhook confirms it; whichever arrives second changes nothing.",
      "Records gross $240.00, PayPal's fee $8.87 and net $231.13. Only the net reaches the forecast: Thu 12 Nov now closes at $311, covered.",
    ],
  },
  3: {
    title: "Rule 1: already paid",
    points: [
      "A follow-up reminder for the same order is proposed.",
      "The Margin Guard asks PayPal for the order's status: captured.",
      "Decision: Blocked. The receipt is stamped BLOCKED and the customer isn't bothered again.",
    ],
  },
  4: {
    title: "Other ways to fix the short day",
    points: [
      "Move Bean There's $400 to Sat 14 Nov: Thu 12 Nov closes at $480, covered.",
      "Or a $120 short-term loan, $122.40 back on Sat 14 Nov: Thu 12 Nov closes at $200, tight.",
      "Rule 8: moves and loans always need your OK. Rule 6 checks no day drops below the minimum. Both are simulated.",
    ],
  },
  5: {
    title: "Ask: read-only tools, calculated answers",
    points: [
      "The question goes to the AI SDK with four read-only tools; it answers through canAfford(200, Mon 9 Nov).",
      "Before Ivory & Vow pays: no. Mon 9 Nov ends at $1,233, but Thu 12 Nov would be $320 short.",
      "After they pay: still no, $89 short on Thu 12 Nov. Every number comes from the tool, never from the model.",
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
