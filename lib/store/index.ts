/**
 * lib/store: the store's catalogue, orders, settings and payment records.
 * Payment records are written after a PayPal call made elsewhere (store routes, webhook, the Guard's executor):
 * lib/store itself never calls PayPal.
 */
import type { Order, Product, StoreId, StoreSettings } from "@/types";
import { DEMO_CATALOG, DEMO_STORE_SETTINGS } from "@/lib/demo";
import { getDb, isDatabaseConfigured } from "@/lib/shared/db";

export {
  applyPayPalEvent,
  findAttempt,
  getPaidOrder,
  recordApproval,
  recordAttempt,
  recordCancelled,
  recordCapture,
  recordDenied,
  startStoreCheckout,
  type AttemptView,
  type PaymentEvent,
} from "./payments";

/** The catalogue, dearest first. Without a database, the demo seed's catalogue. */
export async function listProducts(storeId: StoreId): Promise<Product[]> {
  if (!isDatabaseConfigured()) {
    return [...DEMO_CATALOG]
      .sort((a, b) => b.priceCents - a.priceCents || a.sku.localeCompare(b.sku))
      .map((c) => ({ id: `${storeId}_prod_${c.key}`, storeId, sku: c.sku, name: c.name, description: c.description, priceCents: c.priceCents, costCents: c.costCents }));
  }
  const rows = await getDb().product.findMany({ where: { storeId, active: true }, orderBy: [{ priceCents: "desc" }, { sku: "asc" }] });
  return rows.map((p) => ({ id: p.id, storeId: p.storeId, sku: p.sku, name: p.name, description: p.description, priceCents: p.priceCents, costCents: p.costCents }));
}

/** Newest orders first, with the customer's name. */
export async function listRecentOrders(storeId: StoreId, limit = 50): Promise<Order[]> {
  if (!isDatabaseConfigured()) return [];
  const rows = await getDb().order.findMany({ where: { storeId }, include: { customer: { select: { name: true } } }, orderBy: [{ placedAt: "desc" }, { number: "desc" }], take: limit });
  return rows.map((o) => ({
    id: o.id,
    storeId: o.storeId,
    number: o.number,
    customerId: o.customerId,
    customerName: o.customer.name,
    status: o.status,
    placedOn: o.placedOn,
    totalCents: o.totalCents,
    feeCents: o.feeCents,
    netCents: o.netCents,
    failedAttempts: o.failedAttempts,
    riskHold: o.riskHold,
    paypalOrderId: o.paypalOrderId,
    paypalCaptureId: o.paypalCaptureId,
    simulated: o.simulated,
  }));
}

/** The answers the owner can change on Settings. */
export type EditableSettings = Pick<StoreSettings, "minimumBalanceCents" | "tightMarginCents" | "whatYouSell" | "supplierPaymentMethod" | "busySeasons"> & {
  name?: string;
};

/**
 * Keeps the owner's Settings answers on their copy of the store. The forecast, the fixes and the Guard's minimum-balance
 * rule all read the minimum and the warning zone from here, so they follow at once. Reset on /demo restores the seed.
 * Without a database there is nothing to keep: returns false.
 */
export async function saveStoreSettings(storeId: StoreId, settings: EditableSettings): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;
  await getDb().store.update({
    where: { id: storeId },
    data: {
      ...(settings.name ? { name: settings.name } : {}),
      minimumBalanceCents: settings.minimumBalanceCents,
      tightMarginCents: settings.tightMarginCents,
      whatYouSell: settings.whatYouSell,
      supplierPaymentMethod: settings.supplierPaymentMethod,
      busySeasons: settings.busySeasons,
    },
  });
  return true;
}

export async function getStoreSettings(storeId: StoreId): Promise<StoreSettings> {
  const fallback: StoreSettings = {
    storeId,
    name: DEMO_STORE_SETTINGS.name,
    currency: "USD",
    timezone: "America/New_York",
    minimumBalanceCents: DEMO_STORE_SETTINGS.minimumBalanceCents,
    tightMarginCents: DEMO_STORE_SETTINGS.tightMarginCents,
    openingBalanceCents: 150000,
    openingBalanceOn: "2026-11-05",
    openingBalanceSource: "USER",
    whatYouSell: DEMO_STORE_SETTINGS.whatYouSell,
    supplierPaymentMethod: "PAYPAL_PAYOUTS",
    busySeasons: [...DEMO_STORE_SETTINGS.busySeasons],
  };
  if (!isDatabaseConfigured()) return fallback;
  const s = await getDb().store.findUnique({ where: { id: storeId } });
  if (!s) return fallback;
  return {
    storeId,
    name: s.name,
    currency: "USD",
    timezone: s.timezone,
    minimumBalanceCents: s.minimumBalanceCents,
    tightMarginCents: s.tightMarginCents,
    openingBalanceCents: s.openingBalanceCents,
    openingBalanceOn: s.openingBalanceOn,
    openingBalanceSource: s.openingBalanceSource,
    whatYouSell: s.whatYouSell,
    supplierPaymentMethod: s.supplierPaymentMethod,
    busySeasons: s.busySeasons,
    isDemo: s.isDemo,
  };
}
