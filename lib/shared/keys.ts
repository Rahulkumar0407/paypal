import type { ActionType, StoreId } from "@/types";
import { getDb } from "./db";

/**
 * The idempotency key for a new proposal (AGENTS.md section 4): `<demo run id>:<action type>:<target id>:<sequence>`,
 * where the sequence is 1 + how many times this action type has already been carried out on this target.
 * Server only. Lives in lib/shared so lib/forecast, lib/recovery and lib/guard can all use it without importing each other.
 */
export async function nextProposalKey(storeId: StoreId, type: ActionType, targetId: string): Promise<{ idempotencyKey: string; sequence: number }> {
  const db = getDb();
  const [store, executed] = await Promise.all([
    db.store.findUnique({ where: { id: storeId }, select: { demoRunId: true } }),
    db.proposal.count({ where: { storeId, type, targetId, status: "EXECUTED" } }),
  ]);
  if (!store) throw new Error(`Store ${storeId} has no data yet.`);
  const sequence = executed + 1;
  return { idempotencyKey: `${store.demoRunId}:${type}:${targetId}:${sequence}`, sequence };
}
