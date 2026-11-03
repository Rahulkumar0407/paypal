import { cache } from "react";
import type { Cents, IsoDate, StoreId } from "@/types";
import { buildDemoSeed, ensureStore, paypalFeeCents, type DemoSeed } from "@/lib/demo";
import { addDays } from "@/lib/shared/dates";
import { getDb, isDatabaseConfigured } from "@/lib/shared/db";
import { typicalOrderCents } from "@/lib/shared/risk";
import { forecastFrom, inputFromRows, type PendingOrder, type StoreRows } from "./engine";

/**
 * Reads one store's rows for the forecast. Seven small queries in parallel, memoised for the length of one
 * server request (React `cache`), so a page that asks for the forecast, the dues and the payees reads once.
 * With no database configured, the demo seed is used in memory (read-only), so the screens still show real maths.
 */
export async function readStoreRows(storeId: StoreId, today: IsoDate, retried = false): Promise<StoreRows> {
  if (!isDatabaseConfigured()) return rowsFromSeed(buildDemoSeed(storeId, today, "run_preview"));
  const db = getDb();
  const [store, ledger, payees, dues, setAsides, gapLoans, pending, paid, cleared] = await Promise.all([
    db.store.findUnique({
      where: { id: storeId },
      select: { id: true, minimumBalanceCents: true, tightMarginCents: true, openingBalanceCents: true, openingBalanceOn: true },
    }),
    db.ledgerEntry.findMany({
      where: { storeId },
      select: { id: true, occurredOn: true, direction: true, amountCents: true, category: true, description: true, payeeId: true },
    }),
    db.payee.findMany({ where: { storeId } }),
    db.due.findMany({ where: { storeId } }),
    db.setAside.findMany({ where: { storeId, active: true } }),
    db.gapLoan.findMany({ where: { storeId } }),
    db.order.findMany({
      where: { storeId, status: "PENDING" },
      select: {
        id: true,
        number: true,
        totalCents: true,
        riskHold: true,
        failedAttempts: true,
        placedOn: true,
        customer: { select: { firstSeenOn: true, _count: { select: { orders: { where: { status: "CAPTURED" } } } } } },
      },
    }),
    db.order.findMany({ where: { storeId, status: "CAPTURED" }, select: { totalCents: true } }),
    db.proposal.findMany({ where: { storeId, type: "HOLD_ORDER", status: "OWNER_REJECTED" }, select: { targetId: true } }),
  ]);
  if (!store) {
    // A new visitor's first page renders alongside the layout that creates their copy, so it may not exist yet.
    // Create it here too (creating is safe to race) and read again, once.
    if (retried) throw new Error(`Store ${storeId} has no data.`);
    await ensureStore(storeId);
    return readStoreRows(storeId, today, true);
  }
  const clearedIds = new Set(cleared.map((c) => c.targetId));
  return {
    store,
    ledger,
    payees,
    dues,
    setAsides,
    gapLoans,
    pendingOrders: pending.map((o) =>
      pendingOrder(o, { cleared: clearedIds.has(o.id), customerFirstSeenOn: o.customer.firstSeenOn, customerPaidOrders: o.customer._count.orders }),
    ),
    typicalOrderCents: typicalOrderCents(paid.map((o) => o.totalCents)),
  };
}

/** `readStoreRows`, read once per server request. */
export const loadStoreRows = cache((storeId: StoreId, today: IsoDate) => readStoreRows(storeId, today));

function pendingOrder(
  o: { id: string; number: number; totalCents: number; riskHold?: boolean; failedAttempts?: number; placedOn: string },
  extra: { cleared: boolean; customerFirstSeenOn: string; customerPaidOrders: number },
): PendingOrder {
  // Not captured yet, so PayPal's fee is the published estimate.
  return {
    id: o.id,
    number: o.number,
    totalCents: o.totalCents,
    netCents: o.totalCents - paypalFeeCents(o.totalCents),
    riskHold: o.riskHold ?? false,
    failedAttempts: o.failedAttempts ?? 0,
    placedOn: o.placedOn,
    ...extra,
  };
}

type RowOf<K extends keyof StoreRows> = StoreRows[K] extends readonly (infer R)[] ? R : never;
interface SeedRows extends StoreRows {
  ledger: RowOf<"ledger">[];
  setAsides: RowOf<"setAsides">[];
}

/** The demo seed's rows in the shape the forecast reads. */
export function rowsFromSeed(seed: DemoSeed): SeedRows {
  return {
    store: seed.store,
    ledger: [...seed.ledgerEntries],
    payees: seed.payees,
    dues: seed.dues,
    setAsides: [],
    gapLoans: [],
    pendingOrders: seed.orders
      .filter((o) => o.status === "PENDING")
      .map((o) => {
        const customer = seed.customers.find((c) => c.id === o.customerId);
        const paidBefore = seed.orders.filter((x) => x.customerId === o.customerId && x.status === "CAPTURED").length;
        return pendingOrder(o, { cleared: false, customerFirstSeenOn: customer?.firstSeenOn ?? o.placedOn, customerPaidOrders: paidBefore });
      }),
    typicalOrderCents: typicalOrderCents(seed.orders.filter((o) => o.status === "CAPTURED").map((o) => o.totalCents)),
  };
}

export interface DemoScenario {
  /** Story step 3: the abandoned $72 order is paid today; what arrives after PayPal's fee goes in the ledger. */
  recovered?: boolean;
  /** Story step 5: keep this much a day back from the owner's transfers, from today until the day before the gap. */
  setAsideDailyCents?: Cents;
}

/** The demo store at a point in the story, worked out in memory from the seed. No database. */
export function demoScenarioRows(storeId: StoreId, today: IsoDate, scenario: DemoScenario = {}): StoreRows {
  const seed = buildDemoSeed(storeId, today, "run_preview");
  const rows = rowsFromSeed(seed);
  if (scenario.recovered) {
    const consenting = new Set(seed.customers.filter((c) => c.contactConsent).map((c) => c.id));
    const order = seed.orders.find((o) => o.status === "ABANDONED" && consenting.has(o.customerId));
    if (order) {
      rows.ledger.push({
        id: `${order.id}_recovered`,
        occurredOn: today,
        direction: "IN",
        amountCents: order.totalCents - paypalFeeCents(order.totalCents),
        category: "SALE",
        description: `Order #${order.number}, after PayPal's fee`,
        payeeId: null,
      });
    }
  }
  if (scenario.setAsideDailyCents) {
    const gap = forecastFrom(inputFromRows(rows, storeId, today)).firstShortfall;
    if (gap) rows.setAsides.push({ dailyAmountCents: scenario.setAsideDailyCents, startOn: today, endOn: addDays(gap.date, -1), forDate: gap.date });
  }
  return rows;
}
