import { randomUUID } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import type { Cents, PayPalCapture, StoreId } from "@/types";
import { realNow, today } from "@/lib/shared/clock";
import { getDb } from "@/lib/shared/db";
import { afterApproved, afterCancelled, afterCaptured, afterDenied, afterRefunded, type PaymentState } from "./transitions";

/**
 * Payment records: each PayPal checkout attempt, what it did to the order, and the money in the ledger.
 * No PayPal calls here (lib/store may not import lib/paypal): the store routes, the webhook and the Guard's executor
 * call PayPal, then record what PayPal said through these functions. Every function is safe to run twice.
 */

type Tx = Prisma.TransactionClient;
const TX = { timeout: 15_000, maxWait: 8_000 } as const;

const isUnique = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";

/** The same as the PayPal webhook shape in lib/paypal (structurally): lib/store can't import lib/paypal. */
export type PaymentEvent =
  | { kind: "ORDER_APPROVED"; eventId: string; eventType: string; storeId: string | null; paypalOrderId: string }
  | { kind: "CAPTURE_COMPLETED"; eventId: string; eventType: string; storeId: string | null; paypalOrderId: string | null; capture: PayPalCapture }
  | { kind: "CAPTURE_DENIED"; eventId: string; eventType: string; storeId: string | null; paypalOrderId: string | null; captureId: string }
  | { kind: "CAPTURE_REFUNDED"; eventId: string; eventType: string; storeId: string | null; captureId: string | null; refundId: string; amountCents: number }
  | { kind: "OTHER"; eventId: string; eventType: string; storeId: null };

export interface AttemptView {
  id: string;
  storeId: StoreId;
  orderId: string;
  orderNumber: number;
  paypalOrderId: string;
  status: PaymentState["attempt"]["status"];
}

// ---------------------------------------------------------------------------
// Reading and writing one attempt's state
// ---------------------------------------------------------------------------

async function attemptRow(tx: Tx, where: Prisma.PaymentAttemptWhereInput) {
  return tx.paymentAttempt.findFirst({ where, include: { order: true } });
}
type AttemptRow = NonNullable<Awaited<ReturnType<typeof attemptRow>>>;

async function readState(tx: Tx, row: AttemptRow): Promise<PaymentState> {
  const ledger = await tx.ledgerEntry.findMany({ where: { storeId: row.storeId, orderId: row.orderId, category: { in: ["SALE", "REFUND"] } } });
  return {
    attempt: { status: row.status, paypalCaptureId: row.paypalCaptureId, grossCents: row.grossCents, feeCents: row.feeCents, netCents: row.netCents },
    order: {
      status: row.order.status,
      failedAttempts: row.order.failedAttempts,
      feeCents: row.order.feeCents,
      netCents: row.order.netCents,
      paypalOrderId: row.order.paypalOrderId,
      paypalCaptureId: row.order.paypalCaptureId,
    },
    ledger: {
      sales: ledger.filter((e) => e.category === "SALE" && e.paypalRef).map((e) => ({ captureId: e.paypalRef!, netCents: e.amountCents })),
      refunds: ledger.filter((e) => e.category === "REFUND" && e.paypalRef).map((e) => ({ refundId: e.paypalRef!, amountCents: e.amountCents })),
    },
  };
}

async function writeState(tx: Tx, row: AttemptRow, before: PaymentState, after: PaymentState): Promise<boolean> {
  if (after === before) return false;
  await tx.paymentAttempt.update({ where: { id: row.id }, data: after.attempt });
  await tx.order.update({ where: { id: row.orderId }, data: after.order });
  const day = today();
  for (const sale of after.ledger.sales.filter((x) => !before.ledger.sales.some((b) => b.captureId === x.captureId))) {
    await tx.ledgerEntry.create({
      data: { id: `${row.storeId}_led_cap_${sale.captureId}`, storeId: row.storeId, occurredOn: day, direction: "IN", amountCents: sale.netCents, category: "SALE", description: `Order #${row.order.number}, after PayPal's fee`, orderId: row.orderId, paypalRef: sale.captureId },
    });
  }
  for (const refund of after.ledger.refunds.filter((x) => !before.ledger.refunds.some((b) => b.refundId === x.refundId))) {
    await tx.ledgerEntry.create({
      data: { id: `${row.storeId}_led_ref_${refund.refundId}`, storeId: row.storeId, occurredOn: day, direction: "OUT", amountCents: refund.amountCents, category: "REFUND", description: `Refund for order #${row.order.number}`, orderId: row.orderId, paypalRef: refund.refundId },
    });
  }
  return true;
}

function view(row: AttemptRow): AttemptView {
  return { id: row.id, storeId: row.storeId, orderId: row.orderId, orderNumber: row.order.number, paypalOrderId: row.paypalOrderId, status: row.status };
}

/** Applies one transition to the attempt found by `where`, inside a transaction. A race that lost simply re-reads. */
async function transition(where: Prisma.PaymentAttemptWhereInput, step: (s: PaymentState, row: AttemptRow) => PaymentState, tx?: Tx): Promise<AttemptView | null> {
  const run = async (t: Tx) => {
    const row = await attemptRow(t, where);
    if (!row) return null;
    const before = await readState(t, row);
    await writeState(t, row, before, step(before, row));
    return view((await attemptRow(t, { id: row.id }))!);
  };
  if (tx) return run(tx);
  try {
    return await getDb().$transaction(run, TX);
  } catch (error) {
    if (!isUnique(error)) throw error;
    const row = await attemptRow(getDb(), where);
    return row ? view(row) : null;
  }
}

// ---------------------------------------------------------------------------
// The public functions
// ---------------------------------------------------------------------------

/** The buyer's own checkout on /store: a new order for one product, waiting for payment. */
export async function startStoreCheckout(storeId: StoreId, sku: string): Promise<{ orderId: string; orderNumber: number; amountCents: Cents; description: string; idempotencyKey: string }> {
  const db = getDb();
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await db.$transaction(async (tx) => {
        const [store, product] = await Promise.all([
          tx.store.findUnique({ where: { id: storeId }, select: { demoRunId: true } }),
          tx.product.findFirst({ where: { storeId, sku, active: true } }),
        ]);
        if (!store) throw new Error(`Store ${storeId} has no data yet.`);
        if (!product) throw new Error(`No product ${sku} in store ${storeId}.`);
        const day = today();
        const customer = await tx.customer.upsert({
          where: { id: `${storeId}_cust_guest` },
          update: {},
          create: { id: `${storeId}_cust_guest`, storeId, name: "Test Buyer", email: "test.buyer@example.com", contactConsent: false, firstSeenOn: day },
        });
        const last = await tx.order.findFirst({ where: { storeId }, orderBy: { number: "desc" }, select: { number: true } });
        const number = (last?.number ?? 1000) + 1;
        const orderId = `${storeId}_ord_${number}`;
        await tx.order.create({ data: { id: orderId, storeId, number, customerId: customer.id, status: "ABANDONED", placedOn: day, placedAt: realNow(), totalCents: product.priceCents } });
        await tx.orderItem.create({ data: { id: `${orderId}_item_1`, storeId, orderId, productId: product.id, quantity: 1, unitPriceCents: product.priceCents } });
        return { orderId, orderNumber: number, amountCents: product.priceCents, description: `Dunder Mifflin & Co. order #${number}: ${product.name}`, idempotencyKey: `${store.demoRunId}:CHECKOUT:${orderId}:1` };
      }, TX);
    } catch (error) {
      if (!isUnique(error)) throw error; // two checkouts took the same order number: try the next
    }
  }
  throw new Error("Couldn't number the new order after several tries.");
}

/** A PayPal checkout was created for an order (the store's own, or a link in a reminder). Safe to call twice. */
export async function recordAttempt(input: { storeId: StoreId; orderId: string; paypalOrderId: string; source: "STORE" | "REMINDER" }, tx?: Tx): Promise<void> {
  const write = async (t: Tx) => {
    await t.paymentAttempt.upsert({
      where: { paypalOrderId: input.paypalOrderId },
      update: {},
      create: { id: `${input.storeId}_pay_${randomUUID().replace(/-/g, "").slice(0, 10)}`, storeId: input.storeId, orderId: input.orderId, paypalOrderId: input.paypalOrderId, source: input.source },
    });
    await t.order.updateMany({ where: { id: input.orderId, storeId: input.storeId, status: { notIn: ["CAPTURED", "REFUNDED"] } }, data: { paypalOrderId: input.paypalOrderId } });
  };
  if (tx) await write(tx);
  else await getDb().$transaction(write, TX);
}

export async function findAttempt(paypalOrderId: string): Promise<(AttemptView & { amountCents: Cents }) | null> {
  const row = await attemptRow(getDb(), { paypalOrderId });
  return row ? { ...view(row), amountCents: row.order.totalCents } : null;
}

export const recordApproval = (paypalOrderId: string) => transition({ paypalOrderId }, afterApproved);
export const recordCapture = (paypalOrderId: string, capture: PayPalCapture) => transition({ paypalOrderId }, (s) => afterCaptured(s, paypalOrderId, capture));
export const recordDenied = (paypalOrderId: string) => transition({ paypalOrderId }, afterDenied);
export const recordCancelled = (paypalOrderId: string) => transition({ paypalOrderId }, afterCancelled);

/** An order paid through the store: what PayPal took and what arrived. For the buyer's "paid" page. */
export async function getPaidOrder(orderId: string): Promise<{ orderNumber: number; grossCents: Cents; feeCents: Cents; netCents: Cents; paypalOrderId: string; paypalCaptureId: string } | null> {
  const row = await getDb().paymentAttempt.findFirst({ where: { orderId, status: { in: ["CAPTURED", "REFUNDED"] } }, include: { order: { select: { number: true } } }, orderBy: { updatedAt: "desc" } });
  if (!row || row.grossCents === null || row.feeCents === null || row.netCents === null || !row.paypalCaptureId) return null;
  return { orderNumber: row.order.number, grossCents: row.grossCents, feeCents: row.feeCents, netCents: row.netCents, paypalOrderId: row.paypalOrderId, paypalCaptureId: row.paypalCaptureId };
}

/**
 * A verified PayPal webhook event. In one transaction: store the event id (a repeat is ignored), then apply it to the
 * visitor's copy found through the PayPal order or capture id (custom_id says which copy). An approved order that
 * hasn't been captured yet is handed back so the route can capture it (the buyer may have closed the tab).
 */
export async function applyPayPalEvent(event: PaymentEvent, payload: unknown): Promise<{ result: "applied" | "duplicate" | "ignored"; captureNeeded?: { paypalOrderId: string; idempotencyKey: string } }> {
  if (event.kind === "OTHER") return { result: "ignored" };
  const db = getDb();
  const where: Prisma.PaymentAttemptWhereInput | null =
    event.kind === "CAPTURE_REFUNDED"
      ? event.captureId
        ? { paypalCaptureId: event.captureId }
        : null
      : event.kind === "CAPTURE_DENIED" && !event.paypalOrderId
        ? { paypalCaptureId: event.captureId }
        : event.paypalOrderId
          ? { paypalOrderId: event.paypalOrderId }
          : null;
  const found = where ? await attemptRow(db, where) : null;
  const storeId = event.storeId ?? found?.storeId ?? null;
  if (!storeId || !(await db.store.count({ where: { id: storeId } }))) return { result: "ignored" };
  const resourceId = event.kind === "ORDER_APPROVED" ? event.paypalOrderId : event.kind === "CAPTURE_COMPLETED" ? event.capture.captureId : event.kind === "CAPTURE_DENIED" ? event.captureId : event.refundId;

  try {
    return await db.$transaction(async (tx) => {
      await tx.webhookEvent.create({ data: { id: event.eventId, storeId, eventType: event.eventType, resourceId, payload: JSON.parse(JSON.stringify(payload)) as Prisma.InputJsonValue } });
      if (!where || !found || found.storeId !== storeId) return { result: "applied" as const };
      const after = await transition(
        where,
        (s) => {
          switch (event.kind) {
            case "ORDER_APPROVED":
              return afterApproved(s);
            case "CAPTURE_COMPLETED":
              return afterCaptured(s, found.paypalOrderId, event.capture);
            case "CAPTURE_DENIED":
              return afterDenied(s);
            case "CAPTURE_REFUNDED":
              return afterRefunded(s, event.refundId, event.amountCents);
          }
        },
        tx,
      );
      const captureNeeded = event.kind === "ORDER_APPROVED" && after?.status === "APPROVED" ? { paypalOrderId: found.paypalOrderId, idempotencyKey: `${found.id}:capture` } : undefined;
      return { result: "applied" as const, captureNeeded };
    }, TX);
  } catch (error) {
    if (isUnique(error)) return { result: "duplicate" };
    throw error;
  }
}
