import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import type { DemoStoreStatus, StoreId } from "@/types";
import { today } from "@/lib/shared/clock";
import { LOCAL_STORE_ID } from "@/lib/shared/visitor";
import { buildDemoSeed, type DemoSeed } from "./seed";

/** Database operations for per-visitor demo copies. Every function takes the Prisma client. */

type Tx = Prisma.TransactionClient;

export function newDemoRunId(): string {
  return `run_${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

async function writeSeed(tx: Tx, seed: DemoSeed): Promise<void> {
  await tx.store.create({ data: seed.store });
  await tx.product.createMany({ data: seed.products });
  await tx.customer.createMany({ data: seed.customers });
  await tx.payee.createMany({ data: seed.payees });
  await tx.order.createMany({ data: seed.orders });
  await tx.orderItem.createMany({ data: seed.orderItems });
  await tx.ledgerEntry.createMany({ data: seed.ledgerEntries });
  await tx.due.createMany({ data: seed.dues });
}

const TX_OPTIONS = { timeout: 30_000, maxWait: 10_000 } as const;

/** Delete this store's copy (everything cascades) and write a fresh one with a new demo run id. */
export async function resetStoreWith(db: PrismaClient, storeId: StoreId): Promise<string> {
  const runId = newDemoRunId();
  const seed = buildDemoSeed(storeId, today(), runId);
  await db.$transaction(async (tx) => {
    await tx.store.deleteMany({ where: { id: storeId } });
    await writeSeed(tx, seed);
  }, TX_OPTIONS);
  return runId;
}

/** Initialize a clean real merchant store with real parameters and 0 sample data */
export async function createRealMerchantStoreWith(
  db: PrismaClient,
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
  const runId = newDemoRunId();
  await db.$transaction(async (tx) => {
    await tx.store.deleteMany({ where: { id: storeId } });
    await tx.store.create({
      data: {
        id: storeId,
        name: config.name,
        currency: "USD",
        timezone: config.timezone ?? "America/New_York",
        minimumBalanceCents: config.minimumBalanceCents,
        tightMarginCents: config.tightMarginCents ?? Math.round(config.minimumBalanceCents * 0.5),
        openingBalanceCents: config.openingBalanceCents,
        openingBalanceOn: today(),
        whatYouSell: config.whatYouSell,
        supplierPaymentMethod: "PAYPAL_PAYOUTS",
        busySeasons: [],
        demoRunId: runId,
        isDemo: false,
      },
    });
  }, TX_OPTIONS);
  return runId;
}

/** Create the visitor's copy if it does not exist yet; otherwise just note the visit. */
export async function ensureStoreWith(db: PrismaClient, storeId: StoreId): Promise<"created" | "existing"> {
  const touched = await db.store.updateMany({ where: { id: storeId }, data: { lastSeenAt: new Date() } });
  if (touched.count > 0) return "existing";
  try {
    const seed = buildDemoSeed(storeId, today(), newDemoRunId());
    await db.$transaction((tx) => writeSeed(tx, seed), TX_OPTIONS);
    return "created";
  } catch (error) {
    // Two requests from the same new visitor can race; the loser finds the copy already there.
    const exists = await db.store.count({ where: { id: storeId } });
    if (exists > 0) return "existing";
    throw error;
  }
}

/** Wipe every copy and recreate the local one. Used by `npm run db:reset`. */
export async function resetAllStoresWith(db: PrismaClient): Promise<{ deleted: number; runId: string }> {
  const { count } = await db.store.deleteMany({});
  const runId = await resetStoreWith(db, LOCAL_STORE_ID);
  return { deleted: count, runId };
}

/** Delete copies nobody has opened for `idleDays` days (keeps Supabase's free storage small). */
export async function cleanupIdleStoresWith(db: PrismaClient, idleDays = 7): Promise<number> {
  const cutoff = new Date(Date.now() - idleDays * 86_400_000);
  const { count } = await db.store.deleteMany({ where: { lastSeenAt: { lt: cutoff }, id: { not: LOCAL_STORE_ID } } });
  return count;
}

export async function getStoreStatusWith(db: PrismaClient, storeId: StoreId): Promise<DemoStoreStatus> {
  const store = await db.store.findUnique({
    where: { id: storeId },
    select: {
      demoRunId: true,
      createdAt: true,
      lastResetAt: true,
      _count: { select: { products: true, orders: true, ledgerEntries: true, dues: true } },
    },
  });
  if (!store) {
    return { storeId, exists: false, demoRunId: null, createdAt: null, lastResetAt: null, counts: { products: 0, orders: 0, ledgerEntries: 0, dues: 0 } };
  }
  return {
    storeId,
    exists: true,
    demoRunId: store.demoRunId,
    createdAt: store.createdAt.toISOString(),
    lastResetAt: store.lastResetAt.toISOString(),
    counts: store._count,
  };
}
