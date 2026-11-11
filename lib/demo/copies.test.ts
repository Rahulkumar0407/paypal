import { describe, expect, it } from "vitest";
import type { PrismaClient } from "@/generated/prisma/client";
import { cleanupIdleStoresWith, ensureStoreWith, getStoreStatusWith, resetStoreWith } from "./copies";

/**
 * Per-visitor copies and reset, against a small in-memory stand-in for the database (the few Prisma calls copies.ts
 * makes). Deleting a store deletes everything with its storeId, like the real schema's cascade.
 */

type Row = Record<string, unknown>;
type Where = Record<string, unknown>;
/** Fields a reset is meant to change: the run id and the copy's own timestamps. */
const VOLATILE = new Set(["demoRunId", "createdAt", "lastResetAt", "lastSeenAt"]);
const TABLES = ["store", "product", "customer", "payee", "order", "orderItem", "ledgerEntry", "due", "goal", "teamRequest"] as const;

function memoryDb() {
  const tables: Record<string, Row[]> = Object.fromEntries(TABLES.map((t) => [t, []]));
  const matches = (row: Row, where: Where = {}) =>
    Object.entries(where).every(([key, cond]) => {
      const value = row[key];
      if (cond !== null && typeof cond === "object" && !(cond instanceof Date)) {
        const c = cond as { not?: unknown; lt?: Date };
        if ("not" in c) return value !== c.not;
        if (c.lt) return (value as Date) < c.lt;
        return false;
      }
      return value === cond;
    });
  const count = (name: string, storeId: unknown) => tables[name]!.filter((r) => r.storeId === storeId).length;
  const model = (name: string) => ({
    async create({ data }: { data: Row }) {
      const now = new Date();
      tables[name]!.push(name === "store" ? { createdAt: now, lastResetAt: now, lastSeenAt: now, ...data } : { ...data });
      return data;
    },
    async createMany({ data }: { data: Row[] }) {
      tables[name]!.push(...data.map((d) => ({ ...d })));
      return { count: data.length };
    },
    async updateMany({ where, data }: { where: Where; data: Row }) {
      const hits = tables[name]!.filter((r) => matches(r, where));
      for (const r of hits) Object.assign(r, data);
      return { count: hits.length };
    },
    async count({ where }: { where: Where }) {
      return tables[name]!.filter((r) => matches(r, where)).length;
    },
    async deleteMany(args: { where?: Where } = {}) {
      const gone = tables[name]!.filter((r) => matches(r, args.where));
      tables[name] = tables[name]!.filter((r) => !gone.includes(r));
      if (name === "store") {
        const ids = new Set(gone.map((g) => g.id));
        for (const t of TABLES) if (t !== "store") tables[t] = tables[t]!.filter((r) => !ids.has(r.storeId));
      }
      return { count: gone.length };
    },
    async findUnique({ where }: { where: { id: string } }) {
      const r = tables[name]!.find((x) => x.id === where.id);
      return r ? { ...r, _count: { products: count("product", r.id), orders: count("order", r.id), ledgerEntries: count("ledgerEntry", r.id), dues: count("due", r.id) } } : null;
    },
  });
  const db: Record<string, unknown> = Object.fromEntries(TABLES.map((t) => [t, model(t)]));
  db.$transaction = async (work: (tx: unknown) => Promise<unknown>) => work(db);
  /** Every row of one store, without the fields a reset is meant to change. */
  const snapshot = (storeId: string) =>
    Object.fromEntries(
      TABLES.map((t) => [
        t,
        tables[t]!
          .filter((r) => (t === "store" ? r.id : r.storeId) === storeId)
          .map((r) => Object.fromEntries(Object.entries(r).filter(([k]) => !VOLATILE.has(k)))),
      ]),
    );
  return { db: db as unknown as PrismaClient, tables, snapshot };
}

describe("demo copies", () => {
  it("a reset restores a copy exactly; only the demo run id changes", async () => {
    const { db, tables, snapshot } = memoryDb();
    const run1 = await resetStoreWith(db, "st_aaaa");
    const first = snapshot("st_aaaa");
    // The visitor plays with their copy, then resets.
    await db.order.updateMany({ where: { storeId: "st_aaaa", status: "ABANDONED" }, data: { status: "CAPTURED" } });
    const run2 = await resetStoreWith(db, "st_aaaa");
    expect(snapshot("st_aaaa")).toEqual(first);
    expect(run1).not.toBe(run2);
    expect(tables.store!.find((s) => s.id === "st_aaaa")!.demoRunId).toBe(run2);
    expect((await getStoreStatusWith(db, "st_aaaa")).counts.orders).toBeGreaterThan(250);
  });

  it("resetting one visitor's copy leaves another visitor's copy alone", async () => {
    const { db, snapshot } = memoryDb();
    await ensureStoreWith(db, "st_aaaa");
    await ensureStoreWith(db, "st_bbbb");
    await db.order.updateMany({ where: { storeId: "st_bbbb", status: "ABANDONED" }, data: { status: "CAPTURED" } });
    const before = snapshot("st_bbbb");
    await resetStoreWith(db, "st_aaaa");
    expect(snapshot("st_bbbb")).toEqual(before);
  });

  it("creates a copy once, then only notes the visit", async () => {
    const { db } = memoryDb();
    expect(await ensureStoreWith(db, "st_cccc")).toBe("created");
    expect(await ensureStoreWith(db, "st_cccc")).toBe("existing");
  });

  it("cleanup removes only copies nobody opened for 7 days, and never the local one", async () => {
    const { db, tables } = memoryDb();
    for (const id of ["st_idle", "st_busy", "st_local"]) await ensureStoreWith(db, id);
    const longAgo = new Date(Date.now() - 10 * 86_400_000);
    await db.store.updateMany({ where: { id: "st_idle" }, data: { lastSeenAt: longAgo } });
    await db.store.updateMany({ where: { id: "st_local" }, data: { lastSeenAt: longAgo } });
    expect(await cleanupIdleStoresWith(db, 7)).toBe(1);
    expect(tables.store!.map((s) => s.id).sort()).toEqual(["st_busy", "st_local"]);
    expect(tables.order!.some((o) => o.storeId === "st_idle")).toBe(false);
  });
});
