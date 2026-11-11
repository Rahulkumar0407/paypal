import type { Prisma } from "@/generated/prisma/client";
import type { Cents, IsoDate, StoreId } from "@/types";
import { addDays, dayOfMonth, eachDay, weekdayIndex } from "@/lib/shared/dates";
import { STORE_TIME_ZONE, zonedInstant } from "@/lib/shared/clock";
import { DEMO_CATALOG, DEMO_CUSTOMER_NAMES } from "./catalog";
import { createRandom } from "./prng";

/**
 * Builds one complete copy of the Dunder Mifflin & Co. demo café-bakery as plain rows. Pure and deterministic:
 * the same storeId and date always give exactly the same rows (only demoRunId differs).
 * Everything here is SIMULATED. The numbers are tuned so the real forecast (lib/forecast) tells the demo story;
 * DEMO.md has the hand calculation and lib/forecast/demo-story.test.ts checks it.
 */

export const DEMO_SEED_VERSION = 4;
const RANDOM_SEED = 20261105;

export const DEMO_STORE_SETTINGS = {
  name: "Dunder Mifflin & Co.",
  minimumBalanceCents: 20_000, // $200
  tightMarginCents: 10_000, // tight = within $100 above the minimum
  /**
   * Balance at the start of DEMO_TODAY. The opening balance 90 days ago is worked back from this.
   * Tuned so Thu 12 Nov closes at exactly $80.00, which is $120 short of the $200 minimum: rent and beans ($1,900)
   * land the same day with $1,780 free above the minimum.
   */
  balanceAtStartOfTodayCents: 26_608, // $266.08
  historyDays: 90,
  futureDays: 35,
  whatYouSell: "Bread, pastries, cakes and coffee from a small café-bakery, ordered through PayPal.",
  busySeasons: ["Late November (Black Friday)", "December holidays", "Wedding season (May to September)"],
  focusLine: "Second oven before Christmas",
} as const;

/** Orders per weekday (0 = Sunday). About one day in three has one more or one fewer. */
const ORDERS_PER_WEEKDAY = [12, 7, 7, 7, 7, 7, 12] as const;
const ORDER_COUNT_WOBBLE = 0.3;

/** PayPal standard checkout fee in the US: 3.49% + $0.49. Confirm against a real sandbox capture. */
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
  goals: Prisma.GoalCreateManyInput[];
  requests: Prisma.TeamRequestCreateManyInput[];
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
  /** Taken automatically (a mandate): shown with ⚡. */
  autoDebit?: boolean;
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
  { key: "beans", name: "Bean There", label: "the bean order", kind: "SUPPLIER", status: "DETECTED", typicalAmountCents: 40_000, cadence: "EVERY_N_DAYS", intervalDays: 10, paypalEmail: "orders@bean-there.example", pastJitterDollars: [5, -8, 12, 0, -10, 6, 0, -4, 0], category: "SUPPLIER" },
  { key: "rent", name: "Rent", label: "rent", kind: "BILL", status: "CONFIRMED", typicalAmountCents: 150_000, cadence: "MONTHLY", dayOfMonth: 12, pastJitterDollars: FIXED, category: "BILL" },
  // The card machine's auto-debit nobody wrote down: only in history, so Spot finds it.
  { key: "card", name: "Card machine", label: "the card machine fee", kind: "BILL", status: "DETECTED", typicalAmountCents: 4_900, cadence: "MONTHLY", dayOfMonth: 13, autoDebit: true, pastJitterDollars: FIXED, category: "BILL" },
  // Oat milk went up: $165 for the last three months, $180 from Sun 15 Nov (the price-rise alert finds it).
  { key: "oat", name: "Oat of Office", label: "the oat milk order", kind: "SUPPLIER", status: "CONFIRMED", typicalAmountCents: 18_000, cadence: "MONTHLY", dayOfMonth: 15, paypalEmail: "billing@oat-of-office.example", autoDebit: true, pastJitterDollars: [-15], category: "SUPPLIER" },
  { key: "internet", name: "Internet", label: "the internet bill", kind: "BILL", status: "CONFIRMED", typicalAmountCents: 6_000, cadence: "MONTHLY", dayOfMonth: 3, autoDebit: true, pastJitterDollars: FIXED, category: "BILL" },
  { key: "loan", name: "Oven loan", label: "the oven loan repayment", kind: "LOAN", status: "CONFIRMED", typicalAmountCents: 25_000, cadence: "MONTHLY", dayOfMonth: 25, autoDebit: true, pastJitterDollars: FIXED, category: "LOAN_REPAYMENT" },
  { key: "staff", name: "Staff pay", label: "staff pay", kind: "BILL", status: "CONFIRMED", typicalAmountCents: 160_000, cadence: "MONTHLY", dayOfMonth: 28, pastJitterDollars: FIXED, category: "BILL" },
];

/** Dates a payee is paid in [from, to], anchored so the story lines up (beans and rent on Thu 12 Nov). */
function scheduleFor(plan: PayeePlan, today: IsoDate, from: IsoDate, to: IsoDate): IsoDate[] {
  const days = eachDay(from, Math.max(0, Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000) + 1));
  switch (plan.cadence) {
    case "MONTHLY":
      return days.filter((d) => dayOfMonth(d) === plan.dayOfMonth);
    case "EVERY_N_DAYS": {
      // Next bean order is 7 days after today (Thu 12 Nov when today is Thu 5 Nov).
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
    customers.push({
      id: customerId(index),
      storeId,
      name,
      email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@example.com`,
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
    dueOn?: IsoDate;
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
      dueOn: input.dueOn ?? null,
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
  const tiers = DEMO_CUSTOMER_NAMES.indexOf("Ivory & Vow");
  const hana = DEMO_CUSTOMER_NAMES.indexOf("Hana Sato");
  // Ivory & Vow's $240 tiered cake: delivered, not paid yet (due 18 Nov). Consent given, so tmrw may remind them.
  addOrder({ customerIndex: tiers, date: addDays(today, -2), time: "16:20", lines: [{ key: "tiered", quantity: 1 }], status: "ABANDONED", dueOn: addDays(today, 13) });
  // An unpaid order from a customer who did not allow contact (Guard rule 2 blocks a reminder).
  customers[hana]!.contactConsent = false;
  addOrder({ customerIndex: hana, date: yesterday, time: "08:15", lines: [{ key: "croissants", quantity: 1 }], status: "ABANDONED" });
  // Brand-new buyers for the risk check.
  const jordan = DEMO_CUSTOMER_NAMES.length;
  addCustomer(jordan, "Jordan Reyes", true, yesterday);
  addOrder({ customerIndex: jordan, date: yesterday, time: "23:58", lines: [{ key: "cake", quantity: 8 }], status: "PENDING" });
  const sam = DEMO_CUSTOMER_NAMES.length + 1;
  addCustomer(sam, "Sam Whitfield", true, yesterday);
  addOrder({ customerIndex: sam, date: yesterday, time: "21:10", lines: [{ key: "brownies", quantity: 2 }], status: "FAILED", failedAttempts: 3 });
  // A regular customer suddenly ordering ten brownie trays: an unusual amount for the risk check.
  const isla = DEMO_CUSTOMER_NAMES.indexOf("Isla Moreno");
  addOrder({ customerIndex: isla, date: yesterday, time: "22:41", lines: [{ key: "brownies", quantity: 10 }], status: "PENDING" });

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
    autoDebit: p.autoDebit ?? false,
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

  // --- Penny's occasional moves to her savings ------------------------------------
  // The café makes about $2,000 a month more than it spends; now and then Penny moves some to her bank. Irregular
  // dates and amounts, with no payee, so the forecast never projects them as a regular payment.
  const SAVINGS: readonly [daysAgo: number, cents: Cents][] = [[77, 200_000], [57, 110_000], [22, 240_000], [2, 170_000]];
  for (const [daysAgo, cents] of SAVINGS) {
    const date = addDays(today, -daysAgo);
    ledgerEntries.push({
      id: id("led", `savings_${date}`),
      storeId,
      occurredOn: date,
      direction: "OUT",
      amountCents: cents,
      category: "OWNER_TRANSFER",
      description: "Transfer from PayPal to your bank",
      simulated: true,
    });
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
    focusLine: DEMO_STORE_SETTINGS.focusLine,
    demoRunId,
    isDemo: true,
  };

  // --- Want to do, and the team's requests -----------------------------------------------
  // The oven fund already has $320 put aside (inside the PayPal balance). Penny would like it on Sat 21 Nov.
  const goals: Prisma.GoalCreateManyInput[] = [
    { id: id("goal", "oven"), storeId, title: "Second oven", amountCents: 120_000, savedCents: 32_000, wantedOn: addDays(today, 16) },
    { id: id("goal", "market"), storeId, title: "Stall at the Winter Makers' Market", amountCents: 30_000, savedCents: 0, wantedOn: addDays(today, 31) },
    { id: id("goal", "cookies"), storeId, title: "Launch Christmas cookie boxes", amountCents: 45_000, savedCents: 0, wantedOn: addDays(today, 37) },
  ];
  // Requests that would otherwise be WhatsApp messages. Three are about the mixer.
  const requests: Prisma.TeamRequestCreateManyInput[] = [
    { id: id("req", 1), storeId, fromName: "Flo", fromRole: "Baker", text: "The mixer keeps breaking, we need a new one.", topic: "mixer", receivedOn: addDays(today, -6) },
    { id: id("req", 2), storeId, fromName: "Bean There", fromRole: "Coffee supplier", text: "Beans roasted, send $400 by Thursday.", topic: null, receivedOn: addDays(today, -2) },
    { id: id("req", 3), storeId, fromName: "Flo", fromRole: "Baker", text: "Mixer stopped halfway through the dough again this morning.", topic: "mixer", receivedOn: addDays(today, -3) },
    { id: id("req", 4), storeId, fromName: "Flo", fromRole: "Baker", text: "Can I get my pay on the 28th?", topic: null, receivedOn: addDays(today, -1) },
    { id: id("req", 5), storeId, fromName: "Marco", fromRole: "Barista", text: "Can we get a stand mixer before the holiday orders? The old one is too slow.", topic: "mixer", receivedOn: addDays(today, -1) },
  ];

  return { store, products, customers, payees, orders, orderItems, ledgerEntries, dues, goals, requests };
}
