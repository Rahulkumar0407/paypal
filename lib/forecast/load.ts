import { cache } from "react";
import type { Cents, IsoDate, StoreId } from "@/types";
import { buildDemoSeed, ensureStore, paypalFeeCents, type DemoSeed } from "@/lib/demo";
import { addDays } from "@/lib/shared/dates";
import { getDb, isDatabaseConfigured } from "@/lib/shared/db";
import { forecastFrom, inputFromRows, type StoreRows } from "./engine";

/**
 * Reads one store's rows for the forecast. Seven small queries in parallel, memoised for the length of one
 * server request (React `cache`), so a page that asks for the forecast, the dues and the payees reads once.
 * With no database configured, the demo seed is used in memory (read-only), so the screens still show real maths.
 */
export async function readStoreRows(storeId: StoreId, today: IsoDate, retried = false): Promise<StoreRows> {
  if (!isDatabaseConfigured()) return rowsFromSeed(buildDemoSeed(storeId, today, "run_preview"));
  const db = getDb();
  const [store, ledger, payees, dues, setAsides, gapLoans, held] = await Promise.all([
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
    db.order.findMany({ where: { storeId, status: "PENDING", riskHold: true }, select: { id: true, number: true, totalCents: true } }),
  ]);
  if (!store) {
    // A new visitor's first page renders alongside the layout that creates their copy, so it may not exist yet.
    // Create it here too (creating is safe to race) and read again, once.
    if (retried) throw new Error(`Store ${storeId} has no data.`);
    await ensureStore(storeId);
    return readStoreRows(storeId, today, true);
  }
  return { store, ledger, payees, dues, setAsides, gapLoans, heldOrders: held.map(heldOrder) };
}

/** `readStoreRows`, read once per server request. */
export const loadStoreRows = cache((storeId: StoreId, today: IsoDate) => readStoreRows(storeId, today));

function heldOrder(o: { id: string; number: number; totalCents: number }) {
  // Not captured yet, so PayPal's fee is the published estimate.
  return { id: o.id, number: o.number, netCents: o.totalCents - paypalFeeCents(o.totalCents) };
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
    heldOrders: seed.orders.filter((o) => o.status === "PENDING" && o.riskHold).map(heldOrder),
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
