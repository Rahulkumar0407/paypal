/**
 * lib/demo: the demo store, one private copy per visitor, and reset. Owner: Person 1.
 * Copies and reset work since the foundation; the seed numbers were tuned for the real forecast in P1-6 (DEMO.md).
 */
import { cookies } from "next/headers";
import type { DemoStoreStatus, StoreId } from "@/types";
import { getDb, isDatabaseConfigured } from "@/lib/shared/db";
import { isStoreId, LOCAL_STORE_ID, STORE_COOKIE } from "@/lib/shared/visitor";
import {
  cleanupIdleStoresWith,
  createRealMerchantStoreWith,
  ensureStoreWith,
  getStoreStatusWith,
  resetAllStoresWith,
  resetStoreWith,
} from "./copies";

export { buildDemoSeed, paypalFeeCents, DEMO_STORE_SETTINGS, DEMO_SEED_VERSION, type DemoSeed } from "./seed";
export { DEMO_CATALOG, DEMO_CUSTOMER_NAMES, type CatalogItem } from "./catalog";
export { newDemoRunId, resetStoreWith, createRealMerchantStoreWith, ensureStoreWith, resetAllStoresWith, cleanupIdleStoresWith, getStoreStatusWith } from "./copies";

export async function createRealMerchantStore(
  storeId: StoreId,
  config: {
    name: string;
    whatYouSell: string;
    openingBalanceCents: number;
    minimumBalanceCents: number;
    tightMarginCents?: number;
    timezone?: string;
  }
): Promise<string> {
  if (!isDatabaseConfigured()) return "";
  return createRealMerchantStoreWith(getDb(), storeId, config);
}

/**
 * The storeId of the visitor making this request (set by proxy.ts), once their copy of Loop Audio exists. Server
 * components and route handlers only.
 *
 * Next renders the owner layout (which creates the copy) and the page at the same time, so on a visitor's very first
 * request a page could read an empty shop. Waiting here closes that gap: every caller shares the one creation.
 * A failure is left to the layout to report; the page then renders from what's there.
 */
export async function getVisitorStoreId(): Promise<StoreId> {
  const jar = await cookies();
  const value = jar.get(STORE_COOKIE)?.value;
  const storeId = isStoreId(value) ? value : LOCAL_STORE_ID;
  await ensureStore(storeId).catch(() => null);
  return storeId;
}

/** Copies known to exist in this server process, and when that was checked (re-checked after a while). */
const known = new Map<StoreId, number>();
const KNOWN_FOR_MS = 10 * 60 * 1000;
/** Copies being created right now: callers during the same request share one creation. */
const creating = new Map<StoreId, Promise<"created" | "existing">>();

/** Make sure the visitor's copy exists in the database. Returns null when no database is configured. */
export async function ensureStore(storeId: StoreId): Promise<"created" | "existing" | null> {
  if (!isDatabaseConfigured()) return null;
  const checked = known.get(storeId);
  if (checked !== undefined && Date.now() - checked < KNOWN_FOR_MS) return "existing";
  let pending = creating.get(storeId);
  if (!pending) {
    pending = ensureStoreWith(getDb(), storeId);
    creating.set(storeId, pending);
    pending.then(
      () => known.set(storeId, Date.now()),
      () => undefined,
    ).finally(() => creating.delete(storeId));
  }
  return pending;
}

/** Restore this visitor's copy exactly, with a new demo run id. */
export async function resetStore(storeId: StoreId): Promise<string> {
  return resetStoreWith(getDb(), storeId);
}

export async function resetAllStores(): Promise<{ deleted: number; runId: string }> {
  known.clear();
  return resetAllStoresWith(getDb());
}

export async function cleanupIdleStores(idleDays = 7): Promise<number> {
  known.clear();
  return cleanupIdleStoresWith(getDb(), idleDays);
}

export async function getDemoStoreStatus(storeId: StoreId): Promise<DemoStoreStatus> {
  return getStoreStatusWith(getDb(), storeId);
}
