import { describe, expect, it } from "vitest";
import { addDays, weekdayIndex } from "@/lib/shared/dates";
import { buildDemoSeed, DEMO_STORE_SETTINGS, paypalFeeCents } from "./seed";
import { DEMO_CATALOG } from "./catalog";
import { mockProducts } from "@/mocks/store";

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

  it("paid Volta Audio Parts about $300 every 10 days, last on Mon 2 Nov, so the next lands with rent on Thu 12 Nov", () => {
    const { ledgerEntries, dues } = build();
    const volta = ledgerEntries.filter((e) => e.payeeId?.endsWith("_payee_volta")).map((e) => e.occurredOn);
    expect(volta.length).toBeGreaterThanOrEqual(8);
    for (let i = 1; i < volta.length; i++) expect(Date.parse(volta[i]!) - Date.parse(volta[i - 1]!)).toBe(10 * 86_400_000);
    for (const e of ledgerEntries.filter((x) => x.payeeId?.endsWith("_payee_volta"))) {
      expect(Math.abs(e.amountCents - 30_000)).toBeLessThanOrEqual(1_200);
    }
    expect(volta.at(-1)).toBe("2026-11-02");
    // Volta isn't confirmed yet, so it has no dues of its own: lib/forecast projects its next payment.
    const on12th = dues.filter((d) => d.dueOn === "2026-11-12").map((d) => d.payeeId.split("_payee_")[1]);
    expect(on12th).toEqual(["rent"]);
  });

  it("includes the bills and the owner's transfers to their bank every other Monday", () => {
    const { payees, ledgerEntries, dues } = build();
    expect(payees.map((p) => p.name)).toEqual(
      expect.arrayContaining(["Rent", "Internet", "Store software", "Equipment loan", "Transfer to your bank"]),
    );
    const transfers = ledgerEntries.filter((e) => e.category === "OWNER_TRANSFER");
    expect(transfers.map((e) => e.occurredOn)).toEqual(["2026-08-17", "2026-08-31", "2026-09-14", "2026-09-28", "2026-10-12", "2026-10-26"]);
    expect(transfers.every((e) => weekdayIndex(e.occurredOn) === 1 && Math.abs(e.amountCents - 250_000) <= 5_000)).toBe(true);
    // Only confirmed payees (the bills) have dues written by the seed.
    const confirmed = new Set(payees.filter((p) => p.status === "CONFIRMED").map((p) => p.id));
    expect(dues.every((d) => confirmed.has(d.payeeId))).toBe(true);
  });

  it("has the abandoned $72 order from a customer who allowed contact", () => {
    const { orders, customers } = build();
    const abandoned = orders.filter((o) => o.status === "ABANDONED" && o.totalCents === 7_200);
    expect(abandoned).toHaveLength(1);
    const buyer = customers.find((c) => c.id === abandoned[0]!.customerId)!;
    expect(buyer.name).toBe("Maya Okafor");
    expect(buyer.contactConsent).toBe(true);
  });

  it("works the opening balance back so today's balance is $1,987.56, never below the $100 minimum before", () => {
    const { store, ledgerEntries } = build();
    let balance = store.openingBalanceCents;
    let lowest = balance;
    for (const e of ledgerEntries) {
      balance += e.direction === "IN" ? e.amountCents : -e.amountCents;
      lowest = Math.min(lowest, balance);
    }
    expect(balance).toBe(DEMO_STORE_SETTINGS.balanceAtStartOfTodayCents);
    expect(balance).toBe(198_756);
    expect(store.openingBalanceCents).toBe(313_350);
    expect(lowest).toBeGreaterThanOrEqual(DEMO_STORE_SETTINGS.minimumBalanceCents);
  });

  it("matches the products the mocks show", () => {
    expect(mockProducts.map((p) => [p.sku, p.priceCents])).toEqual(DEMO_CATALOG.map((c) => [c.sku, c.priceCents]));
  });
});
