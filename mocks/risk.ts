import type { Alert, RiskFlag } from "@/types";
import { MOCK_STORE_ID } from "./forecast";

/** FAKE risk flags and alerts. The real checks are lib/risk (Person 4). */

export const mockRiskFlags: RiskFlag[] = [
  {
    id: "risk_1",
    storeId: MOCK_STORE_ID,
    orderId: "ord_1245",
    orderNumber: 1245,
    kind: "NEW_BUYER_BIG_ORDER",
    detail: "First order from this buyer, and about 6 times the usual order size.",
    amountCents: 56_700,
    createdAt: "2026-11-05T08:01:00-05:00",
    held: false,
  },
  {
    id: "risk_2",
    storeId: MOCK_STORE_ID,
    orderId: "ord_1246",
    orderNumber: 1246,
    kind: "REPEATED_FAILED_ATTEMPTS",
    detail: "Three failed payment attempts in 20 minutes from a new buyer.",
    amountCents: 11_900,
    createdAt: "2026-11-05T08:01:00-05:00",
    held: false,
  },
];

export const mockAlerts: Alert[] = [
  {
    id: "alert_price",
    kind: "PRICE_RISE",
    title: "Store software went up $10",
    detail: "It was $89 for the last three months. The bill on Fri 13 Nov is $99.",
    confidence: "high",
  },
];
