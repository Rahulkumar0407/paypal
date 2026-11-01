/**
 * lib/risk: the risk check and the extras (alerts). Owner: Person 4.
 * Flags risky orders and PROPOSES holds through the Guard. Deterministic rules, no AI needed.
 * Foundation stubs by Person 1 return FAKE data from mocks/.
 */
import type { ActionProposal, Alert, RiskFlag, StoreId } from "@/types";
import { mockHoldProposal } from "@/mocks/guard";
import { mockAlerts, mockRiskFlags } from "@/mocks/risk";

/** Risk flags on recent orders: unusual amount, new buyer with a big order, repeated failures. */
export async function listRiskFlags(storeId: StoreId): Promise<RiskFlag[]> {
  // TODO(Person 4): run the checks over PENDING / FAILED orders (P4-3).
  void storeId;
  return mockRiskFlags;
}

/** A HOLD_ORDER proposal for a flagged order (the Guard decides). */
export async function proposeHold(storeId: StoreId, orderId: string): Promise<ActionProposal> {
  // TODO(Person 4): build the proposal with the next sequence number (P4-3).
  return { ...mockHoldProposal, storeId, target: { ...mockHoldProposal.target, id: orderId } };
}

/** Price-rise, slow-week and below-minimum alerts. Quiet when confidence is low. */
export async function getAlerts(storeId: StoreId): Promise<Alert[]> {
  // TODO(Person 4): return nothing when the forecast's confidence is "low" (P4-4).
  void storeId;
  return mockAlerts;
}
