import { describe, expect, it } from "vitest";
import { addDays } from "@/lib/shared/dates";
import { buildDemoSeed, DEMO_STORE_SETTINGS, paypalFeeCents } from "./seed";

const TODAY = "2026-11-05";
const build = (storeId = "st_test01", runId = "run_a") => buildDemoSeed(storeId, TODAY, runId);

describe("buildDemoSeed", () => {
  it("is deterministic: two builds differ only in the demo run id", () => {
    const a = build("st_same", "run_a");
    const b = build("st_same", "run_b");
    expect({ ...a, store: { ...a.store, demoRunId: "x" } }).toEqual({ ...b, store: { ...b.store, demoRunId: "x" } });
  });

  it("gives every row the store id, and different stores never share row ids", () => {
    const a = build("st_aaaa");
    const b = build("st_bbbb");
    const rows = (s: ReturnType<typeof build>) => [
      ...s.products, ...s.customers, ...s.payees, ...s.orders, ...s.orderItems, ...s.ledgerEntries, ...s.dues,
    ];
    expect(rows(a).every((r) => r.storeId === "st_aaaa")).toBe(true);
    const idsA = new Set(rows(a).map((r) => r.id));
    expect(rows(b).some((r) => idsA.has(r.id))).toBe(false);
    expect(idsA.size).toBe(rows(a).length);
  });

  it("has 8 products with price and cost in whole cents", () => {
    const { products } = build();
    expect(products).toHaveLength(8);
    for (const p of products) {
      expect(Number.isInteger(p.priceCents) && Number.isInteger(p.costCents)).toBe(true);
      expect(p.costCents).toBeLessThan(p.priceCents);
    }
  });

  it("has 90 days of simulated sales history ending yesterday, net of PayPal's fee", () => {
    const { ledgerEntries, orders } = build();
    const sales = ledgerEntries.filter((e) => e.category === "SALE");
    expect(sales[0]!.occurredOn).toBe(addDays(TODAY, -90));
    expect(sales.at(-1)!.occurredOn).toBe(addDays(TODAY, -1));
    expect(ledgerEntries.every((e) => e.simulated && Number.isInteger(e.amountCents) && e.amountCents > 0)).toBe(true);
    const captured = orders.filter((o) => o.status === "CAPTURED");
    expect(captured).toHaveLength(sales.length);
    for (const o of captured) expect(o.netCents).toBe(o.totalCents - paypalFeeCents(o.totalCents));
  });

  it("paid Bean There about $400 every 10 days, last on Mon 2 Nov, so the next lands with rent on Thu 12 Nov", () => {
    const { ledgerEntries, dues } = build();
    const beans = ledgerEntries.filter((e) => e.payeeId?.endsWith("_payee_beans")).map((e) => e.occurredOn);
    expect(beans.length).toBeGreaterThanOrEqual(8);
    for (let i = 1; i < beans.length; i++) expect(Date.parse(beans[i]!) - Date.parse(beans[i - 1]!)).toBe(10 * 86_400_000);
    for (const e of ledgerEntries.filter((x) => x.payeeId?.endsWith("_payee_beans"))) {
      expect(Math.abs(e.amountCents - 40_000)).toBeLessThanOrEqual(1_200);
    }
    expect(beans.at(-1)).toBe("2026-11-02");
    // Bean There isn't confirmed yet, so it has no dues of its own: lib/forecast projects its next payment.
    const on12th = dues.filter((d) => d.dueOn === "2026-11-12").map((d) => d.payeeId.split("_payee_")[1]);
    expect(on12th).toEqual(["rent"]);
  });

  it("includes the bills and suppliers; the card machine's auto-debit is only in history, for Spot to find", () => {
    const { payees, dues } = build();
    expect(payees.map((p) => p.name)).toEqual(["Bean There", "Rent", "Card machine", "Oat of Office", "Internet", "Oven loan", "Staff pay"]);
    expect(payees.filter((p) => p.status === "DETECTED").map((p) => p.name)).toEqual(["Bean There", "Card machine"]);
    // Only confirmed payees have dues written by the seed.
    const confirmed = new Set(payees.filter((p) => p.status === "CONFIRMED").map((p) => p.id));
    expect(dues.every((d) => confirmed.has(d.payeeId))).toBe(true);
  });

  it("has Ivory & Vow's unpaid $240 tiered cake, from a customer who allowed contact", () => {
    const { orders, customers } = build();
    const unpaid = orders.filter((o) => o.status === "ABANDONED" && o.totalCents === 24_000);
    expect(unpaid).toHaveLength(1);
    const buyer = customers.find((c) => c.id === unpaid[0]!.customerId)!;
    expect(buyer.name).toBe("Ivory & Vow");
    expect(buyer.contactConsent).toBe(true);
  });

  it("works the opening balance back so today's balance is $266.08, and no past day ends below $0", () => {
    const { store, ledgerEntries } = build();
    let balance = store.openingBalanceCents;
    const dayEnds = new Map<string, number>();
    for (const e of ledgerEntries) {
      balance += e.direction === "IN" ? e.amountCents : -e.amountCents;
      dayEnds.set(e.occurredOn, balance);
    }
    expect(balance).toBe(DEMO_STORE_SETTINGS.balanceAtStartOfTodayCents);
    expect(balance).toBe(26_608);
    expect(store.openingBalanceCents).toBe(205_791);
    expect(Math.min(...dayEnds.values())).toBeGreaterThan(0);
  });
});
