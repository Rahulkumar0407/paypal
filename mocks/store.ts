import type { Order, Product } from "@/types";
import { MOCK_STORE_ID } from "./forecast";

/** FAKE catalogue and recent orders. Same products and prices as the seed (a test checks this). */

const product = (sku: string, name: string, description: string, priceCents: number, costCents: number): Product => ({
  id: `prod_${sku.toLowerCase()}`,
  storeId: MOCK_STORE_ID,
  sku,
  name,
  description,
  priceCents,
  costCents,
});

export const mockProducts: Product[] = [
  product("LA-ONE", "Loop One wireless headphones", "Over-ear, 40-hour battery, folds flat.", 14_900, 6_400),
  product("LA-STUDIO", "Loop Studio monitor headphones", "Closed-back, flat response, detachable cable.", 18_900, 8_300),
  product("LA-BUDS-PRO", "Loop Buds Pro", "Noise-cancelling earbuds with a pocket case.", 11_900, 4_900),
  product("LA-BUDS", "Loop Buds", "Everyday earbuds, 8 hours per charge.", 5_900, 2_300),
  product("LA-KIDS", "Loop Kids volume-safe headphones", "Capped at 85 dB, with a bendable headband.", 4_500, 1_700),
  product("LA-CUSH", "Replacement ear cushions", "Memory foam. Fits Loop One and Loop Studio.", 2_700, 800),
  product("LA-CABLE", "Braided audio cable, 1.5 m", "3.5 mm both ends, with a 6.35 mm adapter.", 1_800, 500),
  product("LA-CASE", "Hard travel case", "Fits every Loop over-ear model.", 2_900, 900),
];

const fee = (total: number) => Math.round(total * 0.0349) + 49;

const order = (
  number: number,
  customerName: string,
  status: Order["status"],
  placedOn: string,
  totalCents: number,
  extra: Partial<Order> = {},
): Order => {
  const captured = status === "CAPTURED";
  return {
    id: `ord_${number}`,
    storeId: MOCK_STORE_ID,
    number,
    customerId: `cust_${number}`,
    customerName,
    status,
    placedOn,
    totalCents,
    feeCents: captured ? fee(totalCents) : null,
    netCents: captured ? totalCents - fee(totalCents) : null,
    failedAttempts: 0,
    riskHold: false,
    paypalOrderId: captured ? `SIM-${number}-ORDER` : null,
    paypalCaptureId: captured ? `SIM-${number}-CAPTURE` : null,
    simulated: true,
    ...extra,
  };
};

export const mockRecentOrders: Order[] = [
  order(1246, "Sam Whitfield", "FAILED", "2026-11-04", 11_900, { failedAttempts: 3 }),
  order(1245, "Jordan Reyes", "PENDING", "2026-11-04", 56_700),
  order(1244, "Hana Sato", "ABANDONED", "2026-11-04", 4_500),
  order(1243, "Maya Okafor", "ABANDONED", "2026-11-03", 7_200),
  order(1242, "Liam Chen", "CAPTURED", "2026-11-04", 14_900),
  order(1241, "Priya Raman", "CAPTURED", "2026-11-04", 8_600),
  order(1240, "Ethan Brooks", "CAPTURED", "2026-11-03", 5_900),
  order(1239, "Sofia Martins", "CAPTURED", "2026-11-03", 21_800),
  order(1238, "Noah Adeyemi", "CAPTURED", "2026-11-02", 2_700),
  order(1237, "Grace Kim", "CAPTURED", "2026-11-02", 11_900),
  order(1236, "Mateo Rossi", "CAPTURED", "2026-11-01", 4_700),
  order(1235, "Ava Lindqvist", "CAPTURED", "2026-11-01", 18_900),
];
