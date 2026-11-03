import { describe, expect, it } from "vitest";
import type { ActionProposal, GuardDecision, Receipt, ReceiptEvent } from "@/types";
import { previewDemoForecast } from "@/lib/forecast";
import { createGuard, ExecutionError, GuardError, inboxStatus, type GuardRepo, type ProposalStatus } from "./flow";
import type { GuardContext, OrderFacts } from "./rules";

/** The whole propose / decide / execute flow, against an in-memory store instead of the database. */

const TODAY = "2026-11-05";

function memoryRepo() {
  const proposals = new Map<string, { proposal: ActionProposal; status: ProposalStatus }>();
  const receipts: Receipt[] = [];
  const copy = <T,>(x: T): T => structuredClone(x);
  let failNextSave = false;
  const repo: GuardRepo = {
    async findByKey(storeId, key) {
      const hit = [...proposals.values()].find((p) => p.proposal.storeId === storeId && p.proposal.idempotencyKey === key);
      return hit ? copy(hit.proposal) : null;
    },
    async saveNew(proposal, decision, status, event) {
      if (failNextSave) {
        // Another request saved the same key a moment earlier.
        failNextSave = false;
        proposals.set("racer", { proposal: { ...proposal, id: "racer" }, status: "APPROVED" });
        return null;
      }
      proposals.set(proposal.id, { proposal: copy(proposal), status });
      return this.saveRepeat(proposal, decision, event);
    },
    async saveRepeat(existing, decision, event) {
      const r: Receipt = { id: `r${receipts.length + 1}`, storeId: existing.storeId, number: receipts.length + 1, proposal: copy(existing), decision: copy(decision), events: [copy(event)], paypalIds: { checked: decision.paypalIdsChecked, created: [] } };
      receipts.push(r);
      return copy(r);
    },
    async getReceipt(storeId, id) {
      const r = receipts.find((x) => x.id === id && x.storeId === storeId);
      return r ? copy(r) : null;
    },
    async listReceipts(storeId) {
      return receipts.filter((r) => r.storeId === storeId).reverse().map(copy);
    },
    async append(receipt, event, status) {
      const r = receipts.find((x) => x.id === receipt.id)!;
      r.events.push(copy(event));
      if (event.kind === "EXECUTED") r.paypalIds.created.push(...event.paypalIds);
      if (status) proposals.get(r.proposal.id)!.status = status;
      return copy(r);
    },
    async claim(proposalId, status) {
      const p = proposals.get(proposalId);
      if (!p || p.status !== "ESCALATED") return false;
      p.status = status;
      return true;
    },
  };
  return { repo, proposals, receipts, raceNextSave: () => (failNextSave = true) };
}

const MAYA: OrderFacts = { id: "ord_1258", number: 1258, status: "ABANDONED", riskHold: false, totalCents: 7_200, paypalOrderId: null, customerName: "Maya Okafor", contactConsent: true };

function setup() {
  const store = memoryRepo();
  const world: Omit<GuardContext, "duplicate"> = {
    order: { ...MAYA },
    orderMissing: false,
    paypal: { kind: "NO_PAYPAL_ORDER" },
    remindersLast48h: 0,
    forecast: { kind: "READY", before: previewDemoForecast({ recovered: true }), after: previewDemoForecast({ recovered: true, setAsideDailyCents: 1_100 }) },
  };
  const ran: string[] = [];
  let failWith: Error | null = null;
  let minute = 0;
  const guard = createGuard({
    repo: store.repo,
    facts: async () => structuredClone(world),
    execute: async (p) => {
      if (failWith) throw failWith;
      ran.push(p.id);
      return { detail: `Did ${p.type}.`, paypalIds: p.type === "SEND_REMINDER" ? ["PP_NEW"] : [] };
    },
    clock: () => ({ at: `2026-11-05T10:${String(minute++).padStart(2, "0")}:00-05:00`, demoDate: TODAY }),
  });
  return { guard, store, world, ran, failNext: (e: Error) => (failWith = e) };
}

let n = 0;
const proposal = (type: "SEND_REMINDER" | "GAP_LOAN" | "SET_ASIDE", over: Partial<{ amountCents: number; key: string; sequence: number }> = {}): ActionProposal => {
  const id = `prop_${++n}`;
  const shared = { id, storeId: "st_test", proposedBy: { kind: "OWNER" as const }, sequence: over.sequence ?? 1, draftText: null, createdAt: "2026-11-05T10:00:00-05:00", demoDate: TODAY };
  switch (type) {
    case "SEND_REMINDER":
      return { ...shared, type, target: { kind: "ORDER", id: "ord_1258", label: "Order #1258" }, amountCents: over.amountCents ?? 7_200, idempotencyKey: over.key ?? "run_a:SEND_REMINDER:ord_1258:1", params: { orderId: "ord_1258", customerId: "c1", channel: "SIMULATED_OUTBOX" } };
    case "GAP_LOAN":
      return { ...shared, type, target: { kind: "STORE", id: "st_test", label: "Gap loan" }, amountCents: 15_000, idempotencyKey: over.key ?? "run_a:GAP_LOAN:st_test:1", params: { amountCents: 15_000, feeCents: 300, repayOn: "2026-11-14" } };
    case "SET_ASIDE":
      return { ...shared, type, target: { kind: "STORE", id: "st_test", label: "Set aside" }, amountCents: over.amountCents ?? 7_700, idempotencyKey: over.key ?? "run_a:SET_ASIDE:st_test:1", params: { dailyAmountCents: (over.amountCents ?? 7_700) / 7, startOn: TODAY, endOn: "2026-11-11", forDate: "2026-11-12" } };
  }
};
const kinds = (r: Receipt) => r.events.map((e) => e.kind);

describe("submitting a proposal", () => {
  it("saves a receipt for every decision, and runs an approved action once", async () => {
    const { guard, ran, store } = setup();
    const r = await guard.submit(proposal("SEND_REMINDER"));
    expect(r.decision.decision).toBe("APPROVE");
    expect(kinds(r)).toEqual(["DECIDED", "EXECUTED"]);
    expect(r.paypalIds.created).toEqual(["PP_NEW"]);
    expect(ran).toHaveLength(1);
    expect([...store.proposals.values()][0]!.status).toBe("EXECUTED");
  });

  it("blocks the same action twice, files the repeat against the first, and never runs it twice", async () => {
    const { guard, ran, store } = setup();
    const first = await guard.submit(proposal("SEND_REMINDER"));
    const again = await guard.submit(proposal("SEND_REMINDER"));
    expect(again.decision).toMatchObject({ decision: "BLOCK", headlineRule: "DUPLICATE" });
    expect(again.proposal.id).toBe(first.proposal.id);
    expect(kinds(again)).toEqual(["DECIDED"]);
    expect(ran).toHaveLength(1);
    expect(store.receipts).toHaveLength(2);
  });

  it("blocks a double submit that raced the first one", async () => {
    const { guard, ran, store } = setup();
    store.raceNextSave();
    const r = await guard.submit(proposal("SEND_REMINDER"));
    expect(r.decision).toMatchObject({ decision: "BLOCK", headlineRule: "DUPLICATE" });
    expect(r.proposal.id).toBe("racer");
    expect(ran).toHaveLength(0);
  });

  it("lets a genuinely new attempt (the next sequence) be judged on its own", async () => {
    const { guard, world } = setup();
    await guard.submit(proposal("SEND_REMINDER"));
    world.order = { ...MAYA, status: "CAPTURED", paypalOrderId: "PP_NEW" };
    world.paypal = { kind: "CHECKED", paypalOrderId: "PP_NEW", status: "COMPLETED" };
    world.remindersLast48h = 1;
    const second = await guard.submit(proposal("SEND_REMINDER", { key: "run_a:SEND_REMINDER:ord_1258:2", sequence: 2 }));
    expect(second.decision.decision).toBe("BLOCK");
    expect(second.decision.rules.filter((x) => x.outcome === "FAIL").map((x) => x.id)).toEqual(["ALREADY_PAID"]);
  });

  it("puts a gap loan in the owner's inbox and runs nothing", async () => {
    const { guard, ran } = setup();
    const r = await guard.submit(proposal("GAP_LOAN"));
    expect(r.decision).toMatchObject({ decision: "ESCALATE", headlineReason: "Loans always need your OK." });
    expect(kinds(r)).toEqual(["DECIDED"]);
    expect(ran).toHaveLength(0);
    expect((await guard.inbox("st_test")).map((i) => i.status)).toEqual(["WAITING"]);
  });

  it("saves a blocked decision and runs nothing", async () => {
    const { guard, ran, world } = setup();
    world.order = { ...MAYA, contactConsent: false };
    const r = await guard.submit(proposal("SEND_REMINDER"));
    expect(r.decision.decision).toBe("BLOCK");
    expect(ran).toHaveLength(0);
    expect(inboxStatus(r)).toBe("DONE");
  });

  it("says so on the receipt when the action can't be carried out", async () => {
    const { guard, failNext } = setup();
    failNext(new ExecutionError("PayPal didn't return a checkout link, so no reminder was sent."));
    const r = await guard.submit(proposal("SEND_REMINDER"));
    expect(r.events.at(-1)).toMatchObject({ kind: "EXECUTION_FAILED", detail: "PayPal didn't return a checkout link, so no reminder was sent." });
    const other = setup();
    other.failNext(new Error("connection reset"));
    const r2 = await other.guard.submit(proposal("SEND_REMINDER"));
    expect(r2.events.at(-1)!.detail).toBe("Something went wrong while doing it, so it stopped. Nothing else was changed.");
  });
});

describe("the owner's approval", () => {
  it("runs the action once the BLOCK rules pass again", async () => {
    const { guard, ran } = setup();
    const r = await guard.submit(proposal("GAP_LOAN"));
    const done = await guard.approve("st_test", r.id);
    expect(kinds(done)).toEqual(["DECIDED", "OWNER_APPROVED", "EXECUTED"]);
    expect(ran).toEqual([r.proposal.id]);
    expect(inboxStatus(done)).toBe("DONE");
  });

  it("clears only ESCALATE rules: a held order's reminder can go ahead once the owner says so", async () => {
    const { guard, world, ran } = setup();
    world.order = { ...MAYA, riskHold: true };
    const r = await guard.submit(proposal("SEND_REMINDER"));
    expect(r.decision).toMatchObject({ decision: "ESCALATE", headlineRule: "RISK_HOLD" });
    await guard.approve("st_test", r.id);
    expect(ran).toHaveLength(1);
  });

  it("still blocks an approved escalation when a blocking rule fails at run time", async () => {
    const { guard, world, ran } = setup();
    const r = await guard.submit(proposal("SEND_REMINDER", { amountCents: 15_000 }));
    expect(r.decision).toMatchObject({ decision: "ESCALATE", headlineRule: "OWNER_APPROVAL" });
    // While it waited, the customer paid.
    world.order = { ...MAYA, status: "CAPTURED", paypalOrderId: "PP9" };
    world.paypal = { kind: "CHECKED", paypalOrderId: "PP9", status: "COMPLETED" };
    const after = await guard.approve("st_test", r.id);
    expect(kinds(after)).toEqual(["DECIDED", "OWNER_APPROVED", "RECHECK_BLOCKED"]);
    expect(after.events.at(-1)).toMatchObject({ detail: "Rule 1, Already paid: PayPal shows order #1258 already paid (PayPal order PP9).", paypalIds: ["PP9"] });
    expect(ran).toHaveLength(0);
    expect(inboxStatus(after)).toBe("APPROVED");
  });

  it("blocks at run time when the forecast can't be checked any more (fails closed)", async () => {
    const { guard, world, ran } = setup();
    const r = await guard.submit(proposal("SET_ASIDE", { amountCents: 14_000 }));
    expect(r.decision.decision).toBe("ESCALATE");
    world.forecast = { kind: "FAILED" };
    const after = await guard.approve("st_test", r.id);
    expect(after.events.at(-1)!.kind).toBe("RECHECK_BLOCKED");
    expect(ran).toHaveLength(0);
  });

  it("records a decline and runs nothing; a decided item can't be decided again", async () => {
    const { guard, ran } = setup();
    const r = await guard.submit(proposal("GAP_LOAN"));
    const declined = await guard.reject("st_test", r.id);
    expect(declined.events.at(-1)).toMatchObject({ kind: "OWNER_REJECTED", detail: "You declined it, so nothing was done." });
    expect(inboxStatus(declined)).toBe("REJECTED");
    await expect(guard.approve("st_test", r.id)).rejects.toThrow(GuardError);
    expect(ran).toHaveLength(0);
  });

  it("can't approve twice with a double click", async () => {
    const { guard, ran } = setup();
    const r = await guard.submit(proposal("GAP_LOAN"));
    const results = await Promise.allSettled([guard.approve("st_test", r.id), guard.approve("st_test", r.id)]);
    expect(results.filter((x) => x.status === "fulfilled")).toHaveLength(1);
    expect(ran).toHaveLength(1);
  });

  it("only escalations can be approved", async () => {
    const { guard } = setup();
    const r = await guard.submit(proposal("SEND_REMINDER"));
    await expect(guard.approve("st_test", r.id)).rejects.toThrow("This one has already been decided.");
    await expect(guard.approve("st_test", "nope")).rejects.toThrow("That receipt isn't in your demo.");
  });
});

describe("receipts", () => {
  it("only ever gain events: earlier lines never change", async () => {
    const { guard } = setup();
    const r = await guard.submit(proposal("GAP_LOAN"));
    const before: ReceiptEvent = structuredClone(r.events[0]!);
    const decision: GuardDecision = structuredClone(r.decision);
    const done = await guard.approve("st_test", r.id);
    expect(done.events[0]).toEqual(before);
    expect(done.decision).toEqual(decision);
    expect(done.events.map((e) => e.at)).toEqual([...done.events.map((e) => e.at)].sort());
  });

  it("lists waiting items first, then the rest, newest first", async () => {
    const { guard } = setup();
    await guard.submit(proposal("SEND_REMINDER"));
    await guard.submit(proposal("GAP_LOAN"));
    await guard.submit(proposal("SEND_REMINDER"));
    expect((await guard.inbox("st_test")).map((i) => [i.receipt.number, i.status])).toEqual([
      [2, "WAITING"],
      [3, "DONE"],
      [1, "DONE"],
    ]);
  });
});
