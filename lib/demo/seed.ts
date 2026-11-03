import type { Prisma } from "@/generated/prisma/client";
import type { Cents, IsoDate, StoreId } from "@/types";
import { addDays, dayOfMonth, eachDay, weekdayIndex } from "@/lib/shared/dates";
import { STORE_TIME_ZONE, zonedInstant } from "@/lib/shared/clock";
import { DEMO_CATALOG, DEMO_CUSTOMER_NAMES } from "./catalog";
import { createRandom } from "./prng";

/**
 * Builds one complete copy of the Loop Audio demo store as plain rows. Pure and deterministic:
 * the same storeId and date always give exactly the same rows (only demoRunId differs).
 * Everything here is SIMULATED. The numbers are tuned so the real forecast (lib/forecast) tells the demo story;
 * DEMO.md has the hand calculation and lib/forecast/demo-story.test.ts checks it.
 */

export const DEMO_SEED_VERSION = 2;
const RANDOM_SEED = 20261105;

export const DEMO_STORE_SETTINGS = {
  name: "Loop Audio",
  minimumBalanceCents: 10_000, // $100
  tightMarginCents: 5_000, // tight = within $50 above the minimum
  /**
   * Balance at the start of DEMO_TODAY. The opening balance 90 days ago is worked back from this.
   * Tuned so Thu 12 Nov closes at exactly $10.00, which is $90 short of the $100 minimum (DEMO.md).
   */
  balanceAtStartOfTodayCents: 198_756, // $1,987.56
  historyDays: 90,
  futureDays: 35,
  whatYouSell: "Headphones, earbuds and spare parts, sold online across the US.",
  busySeasons: ["Late November (Black Friday)", "December holidays", "Back to school (late August)"],
} as const;

/** Orders per weekday (0 = Sunday). About one day in three has one more or one fewer. */
const ORDERS_PER_WEEKDAY = [3, 2, 2, 2, 3, 4, 4] as const;
const ORDER_COUNT_WOBBLE = 0.3;

/** PayPal standard checkout fee in the US: 3.49% + $0.49. Person 2 confirms against a real sandbox capture. */
export function paypalFeeCents(grossCents: Cents): Cents {
  return Math.round(grossCents * 0.0349) + 49;
}

export interface DemoSeed {
  store: Prisma.StoreCreateManyInput;
  products: Prisma.ProductCreateManyInput[];
  customers: Prisma.CustomerCreateManyInput[];
  payees: Prisma.PayeeCreateManyInput[];
  orders: Prisma.OrderCreateManyInput[];
  orderItems: Prisma.OrderItemCreateManyInput[];
  ledgerEntries: Prisma.LedgerEntryCreateManyInput[];
  dues: Prisma.DueCreateManyInput[];
}

interface PayeePlan {
  key: string;
  name: string;
  label: string;
  kind: "SUPPLIER" | "BILL" | "OWNER_TRANSFER" | "LOAN";
  status: "DETECTED" | "CONFIRMED";
  typicalAmountCents: Cents;
  cadence: "EVERY_N_DAYS" | "MONTHLY" | "EVERY_N_WEEKS";
  intervalDays?: number;
  intervalWeeks?: number;
  weekday?: number;
  dayOfMonth?: number;
  paypalEmail?: string;
  /** Past payments differ from the typical amount by these whole dollars, in turn. Their median is 0, so the
   *  typical amount detection finds is exactly the plan's. */
  pastJitterDollars: readonly number[];
  category: "SUPPLIER" | "BILL" | "OWNER_TRANSFER" | "LOAN_REPAYMENT";
}

const FIXED = [0] as const;

/**
 * Who the shop pays. CONFIRMED payees (the bills) have their future dues written here. DETECTED payees (Volta and
 * the owner's own transfers) only have history: lib/forecast finds their pattern and projects their next payments,
 * and writes their dues when the owner confirms them.
 */
const PAYEES: readonly PayeePlan[] = [
  { key: "volta", name: "Volta Audio Parts", label: "the supplier order", kind: "SUPPLIER", status: "DETECTED", typicalAmountCents: 30_000, cadence: "EVERY_N_DAYS", intervalDays: 10, paypalEmail: "orders@volta-audio-parts.example", pastJitterDollars: [4, -6, 12, 0, -9, 7, 0, -3, 5], category: "SUPPLIER" },
  { key: "rent", name: "Rent", label: "rent", kind: "BILL", status: "CONFIRMED", typicalAmountCents: 120_000, cadence: "MONTHLY", dayOfMonth: 12, pastJitterDollars: FIXED, category: "BILL" },
  // Store software went up: $89 for the last three months, $99 from Fri 13 Nov (the price-rise alert finds it).
  { key: "software", name: "Store software", label: "the store software bill", kind: "BILL", status: "CONFIRMED", typicalAmountCents: 9_900, cadence: "MONTHLY", dayOfMonth: 13, pastJitterDollars: [-10], category: "BILL" },
  { key: "internet", name: "Internet", label: "the internet bill", kind: "BILL", status: "CONFIRMED", typicalAmountCents: 6_000, cadence: "MONTHLY", dayOfMonth: 3, pastJitterDollars: FIXED, category: "BILL" },
  { key: "shipping", name: "Shipping supplies", label: "the shipping supplies bill", kind: "BILL", status: "CONFIRMED", typicalAmountCents: 24_000, cadence: "MONTHLY", dayOfMonth: 30, pastJitterDollars: FIXED, category: "BILL" },
  { key: "loan", name: "Equipment loan", label: "the loan repayment", kind: "LOAN", status: "CONFIRMED", typicalAmountCents: 15_000, cadence: "MONTHLY", dayOfMonth: 25, pastJitterDollars: FIXED, category: "LOAN_REPAYMENT" },
  { key: "owner", name: "Transfer to your bank", label: "your transfer to the bank", kind: "OWNER_TRANSFER", status: "DETECTED", typicalAmountCents: 250_000, cadence: "EVERY_N_WEEKS", intervalWeeks: 2, weekday: 1, pastJitterDollars: [30, -20, 0, 45, 0, -35], category: "OWNER_TRANSFER" },
];

/** Dates a payee is paid in [from, to], anchored so the story lines up (Volta and rent on Thu 12 Nov). */
function scheduleFor(plan: PayeePlan, today: IsoDate, from: IsoDate, to: IsoDate): IsoDate[] {
  const days = eachDay(from, Math.max(0, Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000) + 1));
  switch (plan.cadence) {
    case "MONTHLY":
      return days.filter((d) => dayOfMonth(d) === plan.dayOfMonth);
    case "EVERY_N_DAYS": {
      // Next Volta order is 7 days after today (Thu 12 Nov when today is Thu 5 Nov).
      const anchor = addDays(today, 7);
      const step = plan.intervalDays!;
      return days.filter((d) => (((Date.parse(d) - Date.parse(anchor)) / 86_400_000) % step + step) % step === 0);
    }
    case "EVERY_N_WEEKS": {
      // Next owner transfer is the Monday 4 days after today (Mon 9 Nov), then every other Monday.
      const anchor = addDays(today, 4);
      const step = plan.intervalWeeks! * 7;
      return days.filter((d) => (((Date.parse(d) - Date.parse(anchor)) / 86_400_000) % step + step) % step === 0);
    }
  }
}

export function buildDemoSeed(storeId: StoreId, today: IsoDate, demoRunId: string): DemoSeed {
  const random = createRandom(RANDOM_SEED);
  const id = (kind: string, n: number | string) => `${storeId}_${kind}_${typeof n === "number" ? String(n).padStart(4, "0") : n}`;
  const historyStart = addDays(today, -DEMO_STORE_SETTINGS.historyDays);
  const yesterday = addDays(today, -1);
  const lastFutureDay = addDays(today, DEMO_STORE_SETTINGS.futureDays - 1);
  const at = (date: IsoDate, time: string) => zonedInstant(date, time, STORE_TIME_ZONE);

  // --- Products -------------------------------------------------------------
  const products: Prisma.ProductCreateManyInput[] = DEMO_CATALOG.map((item) => ({
    id: id("prod", item.key),
    storeId,
    sku: item.sku,
    name: item.name,
    description: item.description,
    priceCents: item.priceCents,
    costCents: item.costCents,
  }));
  const productId = (key: string) => id("prod", key);
  const catalogItem = (key: string) => DEMO_CATALOG.find((c) => c.key === key)!;

  // --- Customers ------------------------------------------------------------
  const customers: Prisma.CustomerCreateManyInput[] = [];
  const firstSeen = new Map<number, IsoDate>();
  const customerId = (n: number) => id("cust", n + 1);
  const addCustomer = (index: number, name: string, consent: boolean, seenOn: IsoDate) => {
    const [first, last] = name.toLowerCase().split(" ");
    customers.push({
      id: customerId(index),
      storeId,
      name,
      email: `${first}.${last}@example.com`,
      contactConsent: consent,
      firstSeenOn: seenOn,
    });
  };

  // --- Orders, items and sales history -------------------------------------
  const orders: Prisma.OrderCreateManyInput[] = [];
  const orderItems: Prisma.OrderItemCreateManyInput[] = [];
  const ledgerEntries: Prisma.LedgerEntryCreateManyInput[] = [];
  let orderNumber = 1001;
  let itemCount = 0;

  const addOrder = (input: {
    customerIndex: number;
    date: IsoDate;
    time: string;
    lines: { key: string; quantity: number }[];
    status: "ABANDONED" | "FAILED" | "PENDING" | "CAPTURED";
    failedAttempts?: number;
  }) => {
    const number = orderNumber++;
    const orderId = id("ord", number);
    const total = input.lines.reduce((sum, l) => sum + catalogItem(l.key).priceCents * l.quantity, 0);
    const captured = input.status === "CAPTURED";
    const fee = captured ? paypalFeeCents(total) : null;
    const net = fee === null ? null : total - fee;
    orders.push({
      id: orderId,
      storeId,
      number,
      customerId: customerId(input.customerIndex),
      status: input.status,
      placedOn: input.date,
      placedAt: at(input.date, input.time),
      totalCents: total,
      feeCents: fee,
      netCents: net,
      failedAttempts: input.failedAttempts ?? 0,
      paypalOrderId: captured ? `SIM-${number}-ORDER` : null,
      paypalCaptureId: captured ? `SIM-${number}-CAPTURE` : null,
      simulated: true,
    });
    for (const line of input.lines) {
      orderItems.push({
        id: id("item", ++itemCount),
        storeId,
        orderId,
        productId: productId(line.key),
        quantity: line.quantity,
        unitPriceCents: catalogItem(line.key).priceCents,
      });
    }
    if (captured && net !== null) {
      ledgerEntries.push({
        id: id("led", `sale_${number}`),
        storeId,
        occurredOn: input.date,
        direction: "IN",
        amountCents: net,
        category: "SALE",
        description: `Order #${number}, after PayPal's fee`,
        orderId,
        paypalRef: `SIM-${number}-CAPTURE`,
        simulated: true,
      });
    }
    return number;
  };

  for (const date of eachDay(historyStart, DEMO_STORE_SETTINGS.historyDays)) {
    const wobble = random.next() < ORDER_COUNT_WOBBLE ? (random.next() < 0.5 ? -1 : 1) : 0;
    const count = Math.max(0, ORDERS_PER_WEEKDAY[weekdayIndex(date)]! + wobble);
    for (let i = 0; i < count; i++) {
      const customerIndex = random.int(0, DEMO_CUSTOMER_NAMES.length - 1);
      if (!firstSeen.has(customerIndex)) firstSeen.set(customerIndex, date);
      const first = random.weighted(DEMO_CATALOG);
      const lines = [{ key: first.key, quantity: 1 }];
      if (random.next() < 0.28) {
        const extra = random.weighted(DEMO_CATALOG);
        if (extra.key !== first.key) lines.push({ key: extra.key, quantity: 1 });
      }
      const time = `${String(random.int(8, 22)).padStart(2, "0")}:${String(random.int(0, 59)).padStart(2, "0")}`;
      addOrder({ customerIndex, date, time, lines, status: "CAPTURED" });
    }
  }

  // History customers, in name order; anyone who never ordered still gets a first-seen date.
  DEMO_CUSTOMER_NAMES.forEach((name, index) => {
    const consent = index % 9 !== 4; // a few customers never allowed contact
    addCustomer(index, name, consent, firstSeen.get(index) ?? historyStart);
  });

  // --- The story's open orders (after the history) ---------------------------
  const maya = DEMO_CUSTOMER_NAMES.indexOf("Maya Okafor");
  const hana = DEMO_CUSTOMER_NAMES.indexOf("Hana Sato");
  // The abandoned $72 order the Recovery agent finds (consent given).
  addOrder({ customerIndex: maya, date: addDays(today, -2), time: "19:42", lines: [{ key: "kids", quantity: 1 }, { key: "cushions", quantity: 1 }], status: "ABANDONED" });
  // An abandoned order from a customer who did not allow contact (Guard rule 2 blocks a reminder).
  customers[hana]!.contactConsent = false;
  addOrder({ customerIndex: hana, date: yesterday, time: "08:15", lines: [{ key: "kids", quantity: 1 }], status: "ABANDONED" });
  // Brand-new buyers for the risk check.
  const jordan = DEMO_CUSTOMER_NAMES.length;
  addCustomer(jordan, "Jordan Reyes", true, yesterday);
  addOrder({ customerIndex: jordan, date: yesterday, time: "23:58", lines: [{ key: "studio", quantity: 3 }], status: "PENDING" });
  const sam = DEMO_CUSTOMER_NAMES.length + 1;
  addCustomer(sam, "Sam Whitfield", true, yesterday);
  addOrder({ customerIndex: sam, date: yesterday, time: "21:10", lines: [{ key: "buds-pro", quantity: 1 }], status: "FAILED", failedAttempts: 3 });
  // A regular customer suddenly ordering six over-ear headphones: an unusual amount for the risk check.
  const isla = DEMO_CUSTOMER_NAMES.indexOf("Isla Moreno");
  addOrder({ customerIndex: isla, date: yesterday, time: "22:41", lines: [{ key: "one", quantity: 6 }], status: "PENDING" });

  // --- Payees, past payments, future dues ------------------------------------
  const payees: Prisma.PayeeCreateManyInput[] = PAYEES.map((p) => ({
    id: id("payee", p.key),
    storeId,
    name: p.name,
    label: p.label,
    kind: p.kind,
    status: p.status,
    typicalAmountCents: p.typicalAmountCents,
    cadence: p.cadence,
    intervalDays: p.intervalDays ?? null,
    intervalWeeks: p.intervalWeeks ?? null,
    weekday: p.weekday ?? null,
    dayOfMonth: p.dayOfMonth ?? null,
    paypalEmail: p.paypalEmail ?? null,
  }));

  const dues: Prisma.DueCreateManyInput[] = [];
  for (const plan of PAYEES) {
    scheduleFor(plan, today, historyStart, yesterday).forEach((date, i) => {
      const owner = plan.kind === "OWNER_TRANSFER";
      ledgerEntries.push({
        id: id("led", `${plan.key}_${date}`),
        storeId,
        occurredOn: date,
        direction: "OUT",
        amountCents: plan.typicalAmountCents + plan.pastJitterDollars[i % plan.pastJitterDollars.length]! * 100,
        category: plan.category,
        description: owner ? "Transfer from PayPal to your bank" : plan.name,
        payeeId: id("payee", plan.key),
        simulated: true,
      });
    });
    if (plan.status !== "CONFIRMED") continue;
    for (const date of scheduleFor(plan, today, today, lastFutureDay)) {
      dues.push({
        id: id("due", `${plan.key}_${date}`),
        storeId,
        payeeId: id("payee", plan.key),
        dueOn: date,
        amountCents: plan.typicalAmountCents,
        status: "SCHEDULED",
        simulated: false,
      });
    }
  }

  // --- The opening balance ---------------------------------------------------------
  // Worked back from the balance wanted at the start of today, so the story's numbers hold exactly.
  const historyNet = ledgerEntries.reduce((sum, e) => sum + (e.direction === "IN" ? e.amountCents : -e.amountCents), 0);
  const openingBalanceCents = DEMO_STORE_SETTINGS.balanceAtStartOfTodayCents - historyNet;

  ledgerEntries.sort((a, b) => (a.occurredOn < b.occurredOn ? -1 : a.occurredOn > b.occurredOn ? 1 : a.id.localeCompare(b.id)));

  const store: Prisma.StoreCreateManyInput = {
    id: storeId,
    name: DEMO_STORE_SETTINGS.name,
    currency: "USD",
    timezone: STORE_TIME_ZONE,
    minimumBalanceCents: DEMO_STORE_SETTINGS.minimumBalanceCents,
    tightMarginCents: DEMO_STORE_SETTINGS.tightMarginCents,
    openingBalanceCents,
    openingBalanceOn: historyStart,
    whatYouSell: DEMO_STORE_SETTINGS.whatYouSell,
    supplierPaymentMethod: "PAYPAL_PAYOUTS",
    busySeasons: [...DEMO_STORE_SETTINGS.busySeasons],
    demoRunId,
  };

  return { store, products, customers, payees, orders, orderItems, ledgerEntries, dues };
}
