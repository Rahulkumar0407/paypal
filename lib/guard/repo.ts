import { z } from "zod";
import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import type { ActionProposal, GuardDecision, Proposer, Receipt, ReceiptEvent, StoreId } from "@/types";
import { atDemoDate } from "@/lib/shared/clock";
import type { GuardRepo } from "./flow";

/**
 * Receipts in the database. Proposal, Receipt and ReceiptEvent rows; a receipt is never updated, only given new
 * events. JSON read back from the database is checked with zod before it's trusted.
 */

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const cents = z.number().int();
const PARAMS = {
  SEND_REMINDER: z.object({ orderId: z.string(), customerId: z.string(), channel: z.literal("SIMULATED_OUTBOX") }),
  SET_ASIDE: z.object({ dailyAmountCents: cents, startOn: isoDate, endOn: isoDate, forDate: isoDate }),
  MOVE_PAYMENT: z.object({ dueId: z.string(), fromOn: isoDate, toOn: isoDate }),
  GAP_LOAN: z.object({ amountCents: cents, feeCents: cents, repayOn: isoDate }),
  PAY_SUPPLIER: z.object({ payeeId: z.string(), dueId: z.string().nullable() }),
  REFUND: z.object({ orderId: z.string(), captureId: z.string().nullable() }),
  HOLD_ORDER: z.object({ orderId: z.string(), riskFlagIds: z.array(z.string()) }),
} as const;

const RULES = z.array(
  z.object({
    number: z.number().int(),
    id: z.enum(["ALREADY_PAID", "CONSENT", "CONTACT_FREQUENCY", "RISK_HOLD", "DUPLICATE", "MINIMUM_BALANCE", "SET_ASIDE_CAP", "OWNER_APPROVAL"]),
    name: z.string(),
    outcome: z.enum(["PASS", "FAIL", "N/A"]),
    onFail: z.enum(["BLOCK", "ESCALATE"]),
    reason: z.string(),
  }),
);
const EVENT_KIND = z.enum(["DECIDED", "OWNER_APPROVED", "OWNER_REJECTED", "RECHECK_BLOCKED", "EXECUTED", "EXECUTION_FAILED"]);
const TARGET_KIND = z.enum(["ORDER", "DUE", "PAYEE", "STORE"]);
const RULE_ID = RULES.element.shape.id;

const include = { proposal: true, events: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] } } as const satisfies Prisma.ReceiptInclude;
type ReceiptRow = Prisma.ReceiptGetPayload<{ include: typeof include }>;
type ProposalRow = ReceiptRow["proposal"];

function proposerFrom(text: string): Proposer {
  if (text === "OWNER") return { kind: "OWNER" };
  const agent = z.enum(["RECOVERY", "RISK", "ASK"]).parse(text.replace(/^AGENT:/, ""));
  return { kind: "AGENT", agent };
}

function proposerText(p: Proposer): string {
  return p.kind === "OWNER" ? "OWNER" : `AGENT:${p.agent}`;
}

export function proposalFromRow(row: ProposalRow): ActionProposal {
  const base = {
    id: row.id,
    storeId: row.storeId,
    target: { kind: TARGET_KIND.parse(row.targetKind), id: row.targetId, label: row.targetLabel },
    amountCents: row.amountCents,
    proposedBy: proposerFrom(row.proposedBy),
    idempotencyKey: row.idempotencyKey,
    sequence: row.sequence,
    draftText: row.draftText,
    createdAt: atDemoDate(row.createdAt, row.demoDate),
    demoDate: row.demoDate,
  };
  switch (row.type) {
    case "SEND_REMINDER":
      return { ...base, type: row.type, params: PARAMS.SEND_REMINDER.parse(row.params) };
    case "SET_ASIDE":
      return { ...base, type: row.type, params: PARAMS.SET_ASIDE.parse(row.params) };
    case "MOVE_PAYMENT":
      return { ...base, type: row.type, params: PARAMS.MOVE_PAYMENT.parse(row.params) };
    case "GAP_LOAN":
      return { ...base, type: row.type, params: PARAMS.GAP_LOAN.parse(row.params) };
    case "PAY_SUPPLIER":
      return { ...base, type: row.type, params: PARAMS.PAY_SUPPLIER.parse(row.params) };
    case "REFUND":
      return { ...base, type: row.type, params: PARAMS.REFUND.parse(row.params) };
    case "HOLD_ORDER":
      return { ...base, type: row.type, params: PARAMS.HOLD_ORDER.parse(row.params) };
  }
}

export function receiptFromRow(row: ReceiptRow): Receipt {
  const events: ReceiptEvent[] = row.events.map((e) => ({
    kind: EVENT_KIND.parse(e.kind),
    at: atDemoDate(e.createdAt, e.demoDate),
    demoDate: e.demoDate,
    detail: e.detail,
    paypalIds: e.paypalIds,
  }));
  const decision: GuardDecision = {
    proposalId: row.proposalId,
    decision: row.decision,
    headlineRule: row.headlineRule === null ? null : RULE_ID.parse(row.headlineRule),
    headlineReason: row.headlineReason,
    rules: RULES.parse(row.rules),
    paypalIdsChecked: row.paypalIdsChecked,
    decidedAt: atDemoDate(row.createdAt, row.demoDate),
    demoDate: row.demoDate,
  };
  const created = [...new Set(events.filter((e) => e.kind === "EXECUTED").flatMap((e) => e.paypalIds))];
  return { id: row.id, storeId: row.storeId, number: row.number, proposal: proposalFromRow(row.proposal), decision, events, paypalIds: { checked: row.paypalIdsChecked, created } };
}

const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

type Tx = Prisma.TransactionClient;

async function nextReceiptNumber(tx: Tx, storeId: StoreId): Promise<number> {
  const last = await tx.receipt.findFirst({ where: { storeId }, orderBy: { number: "desc" }, select: { number: true } });
  return (last?.number ?? 0) + 1;
}

async function createReceipt(tx: Tx, storeId: StoreId, proposalId: string, decision: GuardDecision, event: ReceiptEvent): Promise<string> {
  const receipt = await tx.receipt.create({
    data: {
      storeId,
      number: await nextReceiptNumber(tx, storeId),
      proposalId,
      decision: decision.decision,
      headlineRule: decision.headlineRule,
      headlineReason: decision.headlineReason,
      rules: json(decision.rules),
      paypalIdsChecked: decision.paypalIdsChecked,
      demoDate: decision.demoDate,
    },
    select: { id: true },
  });
  await tx.receiptEvent.create({ data: { storeId, receiptId: receipt.id, kind: event.kind, detail: event.detail, paypalIds: event.paypalIds, demoDate: event.demoDate } });
  return receipt.id;
}

const TX = { timeout: 15_000, maxWait: 8_000 } as const;

export function prismaGuardRepo(db: PrismaClient): GuardRepo {
  const read = async (storeId: StoreId, receiptId: string) => {
    const row = await db.receipt.findFirst({ where: { id: receiptId, storeId }, include });
    return row ? receiptFromRow(row) : null;
  };
  /** Two decisions at once can pick the same receipt number; the loser simply tries again. */
  const withRetry = async <T>(work: () => Promise<T>, keyTaken: () => Promise<boolean>): Promise<T | null> => {
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        return await work();
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;
        if (await keyTaken()) return null;
      }
    }
    throw new Error("Couldn't number the receipt after several tries.");
  };

  return {
    async findByKey(storeId, key) {
      const row = await db.proposal.findFirst({ where: { storeId, idempotencyKey: key } });
      return row ? proposalFromRow(row) : null;
    },

    async saveNew(proposal, decision, status, event) {
      const id = await withRetry(
        () =>
          db.$transaction(async (tx) => {
            await tx.proposal.create({
              data: {
                id: proposal.id,
                storeId: proposal.storeId,
                type: proposal.type,
                targetKind: proposal.target.kind,
                targetId: proposal.target.id,
                targetLabel: proposal.target.label,
                amountCents: proposal.amountCents,
                params: json(proposal.params),
                proposedBy: proposerText(proposal.proposedBy),
                idempotencyKey: proposal.idempotencyKey,
                sequence: proposal.sequence,
                draftText: proposal.draftText,
                status,
                demoDate: proposal.demoDate,
              },
            });
            return createReceipt(tx, proposal.storeId, proposal.id, decision, event);
          }, TX),
        async () => (await db.proposal.count({ where: { idempotencyKey: proposal.idempotencyKey } })) > 0,
      );
      return id ? read(proposal.storeId, id) : null;
    },

    async saveRepeat(existing, decision, event) {
      const id = await withRetry(
        () => db.$transaction((tx) => createReceipt(tx, existing.storeId, existing.id, decision, event), TX),
        async () => false,
      );
      const receipt = id ? await read(existing.storeId, id) : null;
      if (!receipt) throw new Error("Couldn't read back the receipt just saved.");
      return receipt;
    },

    getReceipt: read,

    async listReceipts(storeId) {
      const rows = await db.receipt.findMany({ where: { storeId }, include, orderBy: { number: "desc" } });
      return rows.map(receiptFromRow);
    },

    async append(receipt, event, status) {
      await db.$transaction(async (tx) => {
        await tx.receiptEvent.create({
          data: { storeId: receipt.storeId, receiptId: receipt.id, kind: event.kind, detail: event.detail, paypalIds: event.paypalIds, demoDate: event.demoDate },
        });
        if (status) await tx.proposal.updateMany({ where: { id: receipt.proposal.id, storeId: receipt.storeId }, data: { status } });
      }, TX);
      const fresh = await read(receipt.storeId, receipt.id);
      if (!fresh) throw new Error("Couldn't read back the receipt just updated.");
      return fresh;
    },

    async claim(proposalId, status) {
      const { count } = await db.proposal.updateMany({ where: { id: proposalId, status: "ESCALATED" }, data: { status } });
      return count === 1;
    },
  };
}
