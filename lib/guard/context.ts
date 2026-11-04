import type { PrismaClient } from "@/generated/prisma/client";
import type { ActionProposal, ActionType, PayPalOrderRef } from "@/types";
import { getOrder } from "@/lib/paypal";
import { getForecast, simulateAction } from "@/lib/forecast";
import { realNow } from "@/lib/shared/clock";
import { SPENDING_WINDOW_DAYS, type ForecastFacts, type GuardContext, type OrderFacts, type PayPalFacts } from "./rules";

/**
 * The context loader: gathers every fact the rules need before they run. It never throws for a fact it can't get;
 * that fact comes back as unknown, and the rule that needs it FAILS (the Guard fails closed).
 * Reads only: the one PayPal call here is a status check.
 */

const ORDER_ACTIONS: readonly ActionType[] = ["SEND_REMINDER", "REFUND", "HOLD_ORDER"];
const FORECAST_ACTIONS: readonly ActionType[] = ["PAY_SUPPLIER", "REFUND", "MOVE_PAYMENT", "GAP_LOAN", "SET_ASIDE"];
const CONTACT_WINDOW_MS = 48 * 60 * 60 * 1000;
const SPENDING_ACTIONS = ["PAY_SUPPLIER", "REFUND", "GAP_LOAN"] as const;

function orderIdOf(proposal: ActionProposal): string | null {
  switch (proposal.type) {
    case "SEND_REMINDER":
    case "REFUND":
    case "HOLD_ORDER":
      return proposal.params.orderId;
    default:
      return null;
  }
}

/** Asks PayPal whether the order was paid. An order PayPal has never seen needs no call; an unreachable PayPal is unknown. */
export async function checkPayPal(paypalOrderId: string | null, fetchOrder: (id: string) => Promise<PayPalOrderRef>): Promise<PayPalFacts> {
  if (!paypalOrderId) return { kind: "NO_PAYPAL_ORDER" };
  try {
    const order = await fetchOrder(paypalOrderId);
    return { kind: "CHECKED", paypalOrderId, status: order.status };
  } catch (error) {
    console.error("[guard] PayPal status check failed:", error instanceof Error ? error.message : error);
    return { kind: "UNREACHABLE", paypalOrderId };
  }
}

/** The forecast now and as it would be after the action. Any failure is unknown. */
export async function forecastFacts(proposal: ActionProposal): Promise<ForecastFacts> {
  try {
    const [before, after] = await Promise.all([getForecast(proposal.storeId), simulateAction(proposal.storeId, proposal)]);
    return { kind: "READY", before, after };
  } catch (error) {
    console.error("[guard] forecast for rule 6 failed:", error instanceof Error ? error.message : error);
    return { kind: "FAILED" };
  }
}

export function contextLoader(db: PrismaClient) {
  async function order(storeId: string, orderId: string): Promise<OrderFacts | null> {
    try {
      const row = await db.order.findFirst({ where: { id: orderId, storeId }, include: { customer: { select: { name: true, contactConsent: true } } } });
      if (!row) return null;
      return {
        id: row.id,
        number: row.number,
        status: row.status,
        riskHold: row.riskHold,
        totalCents: row.totalCents,
        paypalOrderId: row.paypalOrderId,
        customerName: row.customer.name,
        contactConsent: row.customer.contactConsent,
      };
    } catch (error) {
      console.error("[guard] order lookup failed:", error instanceof Error ? error.message : error);
      return null;
    }
  }

  async function remindersLast48h(storeId: string, orderId: string): Promise<number | null> {
    try {
      // Real time, not the demo clock: this protects real people from being contacted too often.
      return await db.outboxMessage.count({ where: { storeId, orderId, sentAt: { gte: new Date(realNow().getTime() - CONTACT_WINDOW_MS) } } });
    } catch (error) {
      console.error("[guard] reminder count failed:", error instanceof Error ? error.message : error);
      return null;
    }
  }

  /** Rule 9: what spending actions moved or asked for in the last 7 days (approved, done, or waiting), not this one. */
  async function spentLast7Days(proposal: ActionProposal): Promise<number | null> {
    try {
      const since = new Date(realNow().getTime() - SPENDING_WINDOW_DAYS * 24 * 60 * 60 * 1000);
      const { _sum } = await db.proposal.aggregate({
        where: {
          storeId: proposal.storeId,
          id: { not: proposal.id },
          type: { in: [...SPENDING_ACTIONS] },
          status: { in: ["APPROVED", "ESCALATED", "OWNER_APPROVED", "EXECUTED"] },
          createdAt: { gte: since },
        },
        _sum: { amountCents: true },
      });
      return _sum.amountCents ?? 0;
    } catch (error) {
      console.error("[guard] spending total failed:", error instanceof Error ? error.message : error);
      return null;
    }
  }

  return async function facts(proposal: ActionProposal): Promise<Omit<GuardContext, "duplicate">> {
    const orderId = orderIdOf(proposal);
    const reminder = proposal.type === "SEND_REMINDER";
    const spending = (SPENDING_ACTIONS as readonly string[]).includes(proposal.type);
    const [found, reminders, forecast, spent] = await Promise.all([
      orderId && ORDER_ACTIONS.includes(proposal.type) ? order(proposal.storeId, orderId) : Promise.resolve(null),
      reminder && orderId ? remindersLast48h(proposal.storeId, orderId) : Promise.resolve(0),
      FORECAST_ACTIONS.includes(proposal.type) ? forecastFacts(proposal) : Promise.resolve<ForecastFacts>({ kind: "NOT_NEEDED" }),
      spending ? spentLast7Days(proposal) : Promise.resolve(0),
    ]);
    const paypal: PayPalFacts = reminder && found ? await checkPayPal(found.paypalOrderId, getOrder) : { kind: "NOT_NEEDED" };
    return { order: found, orderMissing: orderId !== null && found === null, paypal, remindersLast48h: reminders, forecast, spentLast7DaysCents: spent };
  };
}
