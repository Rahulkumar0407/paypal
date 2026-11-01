/**
 * lib/demo: the demo store, one private copy per visitor, and reset. Owner: Person 3.
 * Foundation version by Person 1: copies and reset work; Person 3 tunes the seed numbers (P3-0).
 */
import { cookies } from "next/headers";
import type { DemoStoreStatus, StoreId } from "@/types";
import { getDb, isDatabaseConfigured } from "@/lib/shared/db";
import { isStoreId, LOCAL_STORE_ID, STORE_COOKIE } from "@/lib/shared/visitor";
import {
  cleanupIdleStoresWith,
  ensureStoreWith,
  getStoreStatusWith,
  resetAllStoresWith,
  resetStoreWith,
} from "./copies";

export { buildDemoSeed, paypalFeeCents, DEMO_STORE_SETTINGS, DEMO_SEED_VERSION, type DemoSeed } from "./seed";
export { DEMO_CATALOG, DEMO_CUSTOMER_NAMES, type CatalogItem } from "./catalog";
export { newDemoRunId, resetStoreWith, ensureStoreWith, resetAllStoresWith, cleanupIdleStoresWith, getStoreStatusWith } from "./copies";

/** The storeId of the visitor making this request (set by proxy.ts). Server components and route handlers only. */
export async function getVisitorStoreId(): Promise<StoreId> {
  const jar = await cookies();
  const value = jar.get(STORE_COOKIE)?.value;
  return isStoreId(value) ? value : LOCAL_STORE_ID;
}

/** Make sure the visitor's copy exists in the database. Returns null when no database is configured. */
export async function ensureStore(storeId: StoreId): Promise<"created" | "existing" | null> {
  if (!isDatabaseConfigured()) return null;
  return ensureStoreWith(getDb(), storeId);
}

/** Restore this visitor's copy exactly, with a new demo run id. */
export async function resetStore(storeId: StoreId): Promise<string> {
  return resetStoreWith(getDb(), storeId);
}

export async function resetAllStores(): Promise<{ deleted: number; runId: string }> {
  return resetAllStoresWith(getDb());
}

export async function cleanupIdleStores(idleDays = 7): Promise<number> {
  return cleanupIdleStoresWith(getDb(), idleDays);
}

export async function getDemoStoreStatus(storeId: StoreId): Promise<DemoStoreStatus> {
  return getStoreStatusWith(getDb(), storeId);
}
