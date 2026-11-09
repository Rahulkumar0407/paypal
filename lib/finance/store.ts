import type { IsoDate, StoreId } from "@/types";
import { getDb, isDatabaseConfigured } from "@/lib/shared/db";
import type { FinancialSource, LedgerEntryInput, DueInput, ImportResult, CsvImportRow } from "./types";

const TX = { timeout: 20_000, maxWait: 10_000 } as const;

function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

async function audit(storeId: StoreId, entityType: string, entityId: string, action: string, before: unknown, after: unknown) {
  try {
    await getDb().financialAuditEvent.create({
      data: { storeId, entityType, entityId, action, actor: "OWNER", before: before as never, after: after as never },
    });
  } catch {
    // audit failures must not block financial mutations
  }
}

/** List ledger entries for a store, newest first. */
export async function listLedgerEntries(storeId: StoreId) {
  if (!isDatabaseConfigured()) return [];
  const rows = await getDb().ledgerEntry.findMany({
    where: { storeId },
    orderBy: [{ occurredOn: "desc" }, { createdAt: "desc" }],
    include: { payee: { select: { name: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    storeId: r.storeId,
    occurredOn: r.occurredOn,
    direction: r.direction,
    amountCents: r.amountCents,
    category: r.category,
    description: r.description,
    payeeId: r.payeeId,
    payeeName: r.payee?.name ?? null,
    source: r.source,
    sourceDetail: r.sourceDetail,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

/** Add one ledger entry. Enforces store ownership by storeId scoping. */
export async function addLedgerEntry(storeId: StoreId, input: LedgerEntryInput): Promise<string> {
  if (!isDatabaseConfigured()) throw new Error("Database not configured.");
  const id = newId(`${storeId}_led`);
  await getDb().ledgerEntry.create({
    data: {
      id,
      storeId,
      occurredOn: input.occurredOn,
      direction: input.direction,
      amountCents: input.amountCents,
      category: input.category as never,
      description: input.description,
      payeeId: input.payeeId ?? null,
      source: input.source ?? "USER",
      sourceDetail: input.sourceDetail ?? null,
    },
  });
  await audit(storeId, "LedgerEntry", id, "CREATE", null, input);
  return id;
}

export async function updateLedgerEntry(storeId: StoreId, id: string, input: Partial<LedgerEntryInput>): Promise<void> {
  if (!isDatabaseConfigured()) throw new Error("Database not configured.");
  const existing = await getDb().ledgerEntry.findFirst({ where: { id, storeId } });
  if (!existing) throw new Error("Ledger entry not found or access denied.");
  await getDb().ledgerEntry.update({
    where: { id },
    data: {
      ...(input.occurredOn !== undefined ? { occurredOn: input.occurredOn } : {}),
      ...(input.direction !== undefined ? { direction: input.direction } : {}),
      ...(input.amountCents !== undefined ? { amountCents: input.amountCents } : {}),
      ...(input.category !== undefined ? { category: input.category as never } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.payeeId !== undefined ? { payeeId: input.payeeId } : {}),
      ...(input.source !== undefined ? { source: input.source } : {}),
      ...(input.sourceDetail !== undefined ? { sourceDetail: input.sourceDetail } : {}),
    },
  });
  await audit(storeId, "LedgerEntry", id, "UPDATE", existing, input);
}

export async function deleteLedgerEntry(storeId: StoreId, id: string): Promise<void> {
  if (!isDatabaseConfigured()) throw new Error("Database not configured.");
  const existing = await getDb().ledgerEntry.findFirst({ where: { id, storeId } });
  const res = await getDb().ledgerEntry.deleteMany({ where: { id, storeId } });
  if (res.count === 0) throw new Error("Ledger entry not found or access denied.");
  await audit(storeId, "LedgerEntry", id, "DELETE", existing, null);
}

/** List dues for a store. */
export async function listDues(storeId: StoreId) {
  if (!isDatabaseConfigured()) return [];
  const rows = await getDb().due.findMany({
    where: { storeId },
    orderBy: [{ dueOn: "asc" }],
    include: { payee: { select: { name: true, kind: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    storeId: r.storeId,
    payeeId: r.payeeId,
    payeeName: r.payee.name,
    kind: r.payee.kind,
    dueOn: r.dueOn,
    amountCents: r.amountCents,
    status: r.status,
    movedFromOn: r.movedFromOn,
    simulated: r.simulated,
    source: r.source,
    sourceDetail: r.sourceDetail,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

/** Add a bill/upcoming payment: creates or reuses a Payee, then a Due. */
export async function addDue(storeId: StoreId, input: DueInput): Promise<string> {
  if (!isDatabaseConfigured()) throw new Error("Database not configured.");
  const db = getDb();
  const dueId = await db.$transaction(async (tx) => {
    // Find existing payee with same name/kind in this store
    let payee = await tx.payee.findFirst({ where: { storeId, name: input.payeeName, kind: input.kind as never } });
    if (!payee) {
      payee = await tx.payee.create({
        data: {
          id: newId(`${storeId}_payee`),
          storeId,
          name: input.payeeName,
          label: input.label ?? input.payeeName,
          kind: input.kind as never,
          status: "CONFIRMED",
          typicalAmountCents: input.amountCents,
          cadence: "MONTHLY",
          source: input.source ?? "USER",
          sourceDetail: input.sourceDetail ?? null,
        },
      });
    }
    const newDueId = newId(`${storeId}_due`);
    await tx.due.create({
      data: {
        id: newDueId,
        storeId,
        payeeId: payee.id,
        dueOn: input.dueOn,
        amountCents: input.amountCents,
        status: "SCHEDULED",
        simulated: false,
        source: input.source ?? "USER",
        sourceDetail: input.sourceDetail ?? null,
      },
    });
    return newDueId;
  }, TX);
  await audit(storeId, "Due", dueId, "CREATE", null, input);
  return dueId;
}

export async function updateDue(storeId: StoreId, id: string, input: Partial<DueInput & { status?: string }>): Promise<void> {
  if (!isDatabaseConfigured()) throw new Error("Database not configured.");
  const existing = await getDb().due.findFirst({ where: { id, storeId } });
  if (!existing) throw new Error("Due not found or access denied.");
  await getDb().due.update({
    where: { id },
    data: {
      ...(input.dueOn !== undefined ? { dueOn: input.dueOn } : {}),
      ...(input.amountCents !== undefined ? { amountCents: input.amountCents } : {}),
      ...(input.status !== undefined ? { status: input.status as never } : {}),
      ...(input.source !== undefined ? { source: input.source } : {}),
      ...(input.sourceDetail !== undefined ? { sourceDetail: input.sourceDetail } : {}),
    },
  });
  await audit(storeId, "Due", id, "UPDATE", existing, input);
  // update payee typical amount if provided
  if (input.amountCents !== undefined) {
    await getDb().payee.updateMany({ where: { id: existing.payeeId, storeId }, data: { typicalAmountCents: input.amountCents } });
  }
}

export async function deleteDue(storeId: StoreId, id: string): Promise<void> {
  if (!isDatabaseConfigured()) throw new Error("Database not configured.");
  const existing = await getDb().due.findFirst({ where: { id, storeId } });
  const res = await getDb().due.deleteMany({ where: { id, storeId } });
  if (res.count === 0) throw new Error("Due not found or access denied.");
  await audit(storeId, "Due", id, "DELETE", existing, null);
}

/** Update opening balance with provenance. */
export async function updateOpeningBalance(storeId: StoreId, cents: number, on: IsoDate, source: FinancialSource = "USER", detail?: string | null): Promise<void> {
  if (!isDatabaseConfigured()) throw new Error("Database not configured.");
  const existing = await getDb().store.findUnique({ where: { id: storeId }, select: { openingBalanceCents: true, openingBalanceOn: true, openingBalanceSource: true } });
  await getDb().store.update({
    where: { id: storeId },
    data: {
      openingBalanceCents: cents,
      openingBalanceOn: on,
      openingBalanceSource: source,
      openingBalanceUpdatedAt: new Date(),
    },
  });
  await audit(storeId, "Store", storeId, "UPDATE_OPENING_BALANCE", existing, { cents, on, source });
  // store sourceDetail? Store has no sourceDetail column for opening balance; encode in name? skip.
  void detail;
}

/** Existing keys for duplicate detection (ledger). */
export async function existingLedgerKeys(storeId: StoreId): Promise<Set<string>> {
  if (!isDatabaseConfigured()) return new Set();
  const rows = await getDb().ledgerEntry.findMany({ where: { storeId }, select: { occurredOn: true, direction: true, amountCents: true, description: true } });
  return new Set(rows.map((r) => `${r.occurredOn}|${r.direction}|${r.amountCents}|${r.description.toLowerCase()}`));
}

/** Persist a validated CSV import. Returns summary. */
export async function importLedgerCsv(storeId: StoreId, rows: CsvImportRow[], sourceDetail: string): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, skippedDuplicates: 0, failed: [] };
  if (!isDatabaseConfigured()) throw new Error("Database not configured.");
  const db = getDb();

  // Row limit to protect the database.
  if (rows.length > 5000) {
    throw new Error("CSV exceeds the 5,000 row limit. Split the file and import in batches.");
  }

  // Pre-compute existing keys for idempotent persistence (handles concurrent imports).
  const existing = await existingLedgerKeys(storeId);

  try {
    await db.$transaction(async (tx) => {
      for (const row of rows) {
        if (!row.selected) {
          if (row.duplicate) result.skippedDuplicates++;
          else if (row.errors.length > 0) result.failed.push({ rowNumber: row.rowNumber, reason: row.errors.join("; ") });
          continue;
        }
        if (row.occurredOn === null || row.amountCents === null || row.direction === null) {
          result.failed.push({ rowNumber: row.rowNumber, reason: "Missing required fields." });
          continue;
        }
        const key = `${row.occurredOn}|${row.direction}|${row.amountCents}|${row.description.toLowerCase()}`;
        if (existing.has(key)) {
          result.skippedDuplicates++;
          continue;
        }
        // Re-check within the transaction for concurrent imports.
        const dup = await tx.ledgerEntry.findFirst({
          where: { storeId, occurredOn: row.occurredOn, direction: row.direction, amountCents: row.amountCents, description: row.description },
        });
        if (dup) {
          result.skippedDuplicates++;
          existing.add(key);
          continue;
        }
        await tx.ledgerEntry.create({
          data: {
            id: newId(`${storeId}_led`),
            storeId,
            occurredOn: row.occurredOn,
            direction: row.direction,
            amountCents: row.amountCents,
            category: (row.category || (row.direction === "IN" ? "SALE" : "BILL")) as never,
            description: row.description,
            source: "IMPORT",
            sourceDetail,
          },
        });
        existing.add(key);
        result.imported++;
      }
    }, { timeout: 60_000, maxWait: 10_000 });
  } catch (e) {
    // Rollback already happened; report failure
    throw e;
  }

  await audit(storeId, "LedgerEntry", "bulk", "CSV_IMPORT", null, { imported: result.imported, skipped: result.skippedDuplicates, failed: result.failed.length, sourceDetail });
  return result;
}

/** List payees for a store. */
export async function listPayees(storeId: StoreId) {
  if (!isDatabaseConfigured()) return [];
  const rows = await getDb().payee.findMany({ where: { storeId }, orderBy: { name: "asc" } });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    kind: r.kind,
    status: r.status,
    typicalAmountCents: r.typicalAmountCents,
    source: r.source,
    sourceDetail: r.sourceDetail,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}
