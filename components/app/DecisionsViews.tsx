"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Decision, InboxItem, OutboxMessage } from "@/types";
import { formatCents } from "@/lib/shared/money";
import { formatDay } from "@/lib/shared/dates";
import { receiptNo } from "@/components/app/receipt-words";
import { FollowUp } from "./FollowUp";
import { paypalSetup } from "./PayPalStatus";
import type { InboxOutcome } from "@/app/(owner)/approvals/actions";

interface DecisionsViewsProps {
  waiting: InboxItem[];
  decided: InboxItem[];
  outbox: OutboxMessage[];
  decide: (receiptId: string, choice: "approve" | "decline") => Promise<InboxOutcome>;
  sendFollowUp: (orderId: string) => Promise<{ ok: true; decision: Decision; reason: string; receiptId: string; receiptNumber: number } | { ok: false; message: string }>;
}

export function DecisionsViews({
  waiting,
  decided,
  outbox,
  decide,
  sendFollowUp,
}: DecisionsViewsProps) {
  const [activeTab, setActiveTab] = useState<"pending" | "history" | "outbox">("pending");
  const [openWhy, setOpenWhy] = useState<Record<string, boolean>>({});
  const [outcomes, setOutcomes] = useState<Record<string, InboxOutcome>>({});
  const [pendingReceipt, setPendingReceipt] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const toggleWhy = (id: string) => {
    setOpenWhy((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDecide = (receiptId: string, choice: "approve" | "decline") => {
    setPendingReceipt(receiptId);
    startTransition(async () => {
      try {
        const result = await decide(receiptId, choice);
        setOutcomes((prev) => ({ ...prev, [receiptId]: result }));
      } finally {
        setPendingReceipt(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* ── Three Segmented Views ── */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("pending")}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "pending"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>Needs your approval</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-mono ${
              waiting.length > 0
                ? "bg-amber-100 text-amber-800"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {waiting.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "history"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>History</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-slate-100 text-slate-600">
            {decided.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("outbox")}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "outbox"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>Sent reminders</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-slate-100 text-slate-600">
            {outbox.length}
          </span>
        </button>
      </div>

      {/* ── View 1: Needs Your Approval ── */}
      {activeTab === "pending" && (
        <div className="space-y-4">
          {waiting.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center shadow-xs">
              <h3 className="text-base font-semibold text-slate-900">All clear</h3>
              <p className="text-sm text-slate-500 mt-1">
                Zero actions are waiting for your approval. Routine proposals that met safety rules were approved automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {waiting.map((item) => {
                const { receipt } = item;
                const { proposal, decision } = receipt;
                const receiptId = receipt.id;
                const outcome = outcomes[receiptId];
                const isItemPending = pendingReceipt === receiptId;
                const isHold = proposal.type === "HOLD_ORDER";

                if (outcome) {
                  return (
                    <div
                      key={receiptId}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-900">
                          {proposal.target.label}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-500">
                          {formatCents(proposal.amountCents)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700">{outcome.message}</p>
                      <Link
                        href={`/receipts/${receiptId}`}
                        className="inline-block text-xs font-semibold text-blue-600 hover:underline pt-1"
                      >
                        View thermal receipt →
                      </Link>
                    </div>
                  );
                }

                return (
                  <div
                    key={receiptId}
                    className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            Needs Your OK
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatDay(decision.demoDate)}
                          </span>
                        </div>
                        <h3 className="text-base font-semibold text-slate-900 mt-1">
                          {proposal.target.label}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Proposed action: <strong className="text-slate-800 font-semibold">{proposal.type.replace(/_/g, " ")}</strong>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-xl font-bold text-slate-900 block">
                          {formatCents(proposal.amountCents)}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {receiptNo(receipt)}
                        </span>
                      </div>
                    </div>

                    <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/60 leading-relaxed">
                      {decision.headlineReason}
                    </div>

                    {/* Action buttons & Why toggle */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isItemPending}
                          onClick={() => handleDecide(receiptId, "approve")}
                          className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-xs"
                        >
                          {isItemPending ? "Verifying..." : isHold ? "Hold order" : "Approve"}
                        </button>
                        <button
                          type="button"
                          disabled={isItemPending}
                          onClick={() => handleDecide(receiptId, "decline")}
                          className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50 transition-colors"
                        >
                          {isHold ? "It's fine, count it" : "Decline"}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleWhy(receiptId)}
                        className="text-xs text-slate-500 hover:text-slate-900 font-medium"
                      >
                        {openWhy[receiptId] ? "Hide details ▲" : "Why? ▼"}
                      </button>
                    </div>

                    {/* Expandable Why details on demand */}
                    {openWhy[receiptId] && (
                      <div className="pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-2">
                        <span className="font-semibold text-slate-800 block">Safety Rule Evaluation:</span>
                        <ul className="space-y-1 list-disc list-inside">
                          {decision.rules.filter((r) => r.outcome !== "N/A").map((r) => (
                            <li key={r.number}>
                              <strong className="text-slate-700">{r.name}:</strong> {r.outcome} — {r.reason}
                            </li>
                          ))}
                        </ul>
                        <div className="pt-1">
                          <Link
                            href={`/receipts/${receiptId}`}
                            className="text-blue-600 hover:underline font-semibold"
                          >
                            Open full audit receipt →
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── View 2: History (Decided) ── */}
      {activeTab === "history" && (
        <div className="space-y-3">
          {decided.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center shadow-xs">
              <h3 className="text-base font-semibold text-slate-900">No decisions yet</h3>
              <p className="text-sm text-slate-500 mt-1">
                Completed decisions and evaluated proposals will be archived here.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
              {decided.map((item) => {
                const { receipt } = item;
                const { proposal, decision } = receipt;
                const isApproved = decision.decision === "APPROVE";
                const isBlocked = decision.decision === "BLOCK";

                return (
                  <div key={receipt.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            isApproved
                              ? "bg-emerald-100 text-emerald-800"
                              : isBlocked
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {decision.decision}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatDay(decision.demoDate)}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900 mt-1">
                        {proposal.target.label}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {decision.headlineReason}
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0">
                      <span className="font-mono text-sm font-bold text-slate-900">
                        {formatCents(proposal.amountCents)}
                      </span>
                      <Link
                        href={`/receipts/${receipt.id}`}
                        className="text-xs text-blue-600 hover:underline font-semibold"
                      >
                        {receiptNo(receipt)} →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── View 3: Sent Reminders (Simulated Outbox) ── */}
      {activeTab === "outbox" && (
        <div className="space-y-3">
          {outbox.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center shadow-xs">
              <h3 className="text-base font-semibold text-slate-900">Outbox empty</h3>
              <p className="text-sm text-slate-500 mt-1">
                When a payment recovery reminder is approved, it appears here with a live PayPal sandbox checkout link.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {outbox.map((m) => (
                <div
                  key={m.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-mono text-slate-500">
                        To: {m.to}
                      </span>
                      <h4 className="text-sm font-semibold text-slate-900 mt-0.5">
                        {m.subject}
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200/60">
                      Simulated
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/60 leading-relaxed italic">
                    &ldquo;{m.body}&rdquo;
                  </p>

                  <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {m.checkoutUrl ? (
                      <a
                        href={m.checkoutUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
                      >
                        {paypalSetup() === "fake" ? "Open Checkout (Simulated PayPal)" : "Pay in PayPal Sandbox →"}
                      </a>
                    ) : (
                      <span className="text-xs font-mono text-slate-400">
                        Checkout settled or unavailable
                      </span>
                    )}

                    <div className="shrink-0">
                      <FollowUp orderId={m.orderId} send={sendFollowUp} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
