import { runRecoveryAgent } from "@/lib/recovery";
import { runRiskCheck } from "@/lib/risk";

/**
 * The two helpers that propose actions on their own: the reminder helper and the risk check. Each proposal goes to the
 * Margin Guard. They start in the background as soon as a visitor's copy exists (and after a reset), so Approvals is
 * ready when the visitor gets there; Approvals also waits for them. One run per store at a time, never two at once
 * (which would only produce duplicate, blocked receipts). Server only.
 */

const state = globalThis as unknown as { nevershortAgents?: { running: Map<string, Promise<void>>; done: Set<string> } };
const agents = (state.nevershortAgents ??= { running: new Map(), done: new Set() });

export function runAgents(storeId: string): Promise<void> {
  const inFlight = agents.running.get(storeId);
  if (inFlight) return inFlight;
  const run = (async () => {
    // The two helpers side by side; each does its own proposals one at a time.
    const results = await Promise.allSettled([runRecoveryAgent(storeId), runRiskCheck(storeId)]);
    results.forEach((r, i) => {
      if (r.status === "rejected") console.error(`[agents] ${i === 0 ? "the reminder helper" : "the risk check"} didn't finish for ${storeId}:`, r.reason instanceof Error ? r.reason.message : r.reason);
    });
    // Only a run that finished counts as done; otherwise the next page view (or Approvals) tries again.
    if (results.every((r) => r.status === "fulfilled")) agents.done.add(storeId);
  })().finally(() => agents.running.delete(storeId));
  agents.running.set(storeId, run);
  return run;
}

/** True once the helpers have run for this store since this server started (or since its last reset). */
export function agentsHaveRun(storeId: string): boolean {
  return agents.done.has(storeId);
}

/** A reset brings back the unfinished checkouts and risky orders, so the helpers should look again. */
export function forgetAgents(storeId: string): void {
  agents.done.delete(storeId);
}
