import type { StoreId } from "@/types";

/**
 * Each visitor gets their own copy of Loop Audio. The proxy (proxy.ts) gives every new
 * browser this cookie; lib/demo creates the copy in the database on first use.
 * No database access here: this file is imported by the proxy.
 */

export const STORE_COOKIE = "ns_store";
/** One year: judges can come back to the same copy. */
export const STORE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
/** Used by scripts and local tools that have no browser cookie. */
export const LOCAL_STORE_ID: StoreId = "st_local";

const STORE_ID = /^st_[a-z0-9]{4,32}$/;

export function isStoreId(value: string | undefined | null): value is StoreId {
  return typeof value === "string" && STORE_ID.test(value);
}

export function newStoreId(): StoreId {
  return `st_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}
