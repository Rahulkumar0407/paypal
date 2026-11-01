/**
 * lib/store: reading the store's catalogue, orders and settings. Owner: Person 2.
 * Used by the buyer-facing store page (app/store), the dashboard (Person 4) and settings.
 * Foundation stubs by Person 1 return FAKE data from mocks/.
 */
import type { Order, Product, StoreId, StoreSettings } from "@/types";
import { MOCK_MINIMUM_BALANCE, MOCK_TIGHT_MARGIN } from "@/mocks/forecast";
import { mockProducts, mockRecentOrders } from "@/mocks/store";

export async function listProducts(storeId: StoreId): Promise<Product[]> {
  // TODO(Person 2): read Product rows (P2-1).
  return mockProducts.map((p) => ({ ...p, storeId }));
}

export async function listRecentOrders(storeId: StoreId, limit = 50): Promise<Order[]> {
  // TODO(Person 2): newest first, with the customer's name.
  return mockRecentOrders.slice(0, limit).map((o) => ({ ...o, storeId }));
}

export async function getStoreSettings(storeId: StoreId): Promise<StoreSettings> {
  // TODO(Person 2): read the Store row.
  return {
    storeId,
    name: "Loop Audio",
    currency: "USD",
    timezone: "America/New_York",
    minimumBalanceCents: MOCK_MINIMUM_BALANCE,
    tightMarginCents: MOCK_TIGHT_MARGIN,
    whatYouSell: "Headphones, earbuds and spare parts, sold online across the US.",
    supplierPaymentMethod: "PAYPAL_PAYOUTS",
    busySeasons: ["Late November (Black Friday)", "December holidays", "Back to school (late August)"],
  };
}
