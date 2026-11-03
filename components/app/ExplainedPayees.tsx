import type { RecurringPayee, StoreId } from "@/types";
import { explainRegularPayments } from "@/lib/ai";
import { DetectedPayees } from "./DetectedPayees";

/** The found regular payments, each with one line on what it was found from. Server only; wrap in Suspense. */
export async function ExplainedPayees({ storeId, payees }: { storeId: StoreId; payees: RecurringPayee[] }) {
  const explanations = await explainRegularPayments(storeId, payees).catch(() => ({}));
  return <DetectedPayees payees={payees} explanations={explanations} />;
}
