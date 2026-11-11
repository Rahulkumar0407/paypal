"use server";

import { revalidatePath } from "next/cache";
import { getVisitorStoreId } from "@/lib/demo";
import {
  addLedgerEntry,
  updateLedgerEntry,
  deleteLedgerEntry,
  addDue,
  updateDue,
  deleteDue,
  updateOpeningBalance,
  existingLedgerKeys,
  importLedgerCsv,
  ledgerEntrySchema,
  dueSchema,
  openingBalanceSchema,
  buildCsvPreview,
} from "@/lib/finance";


export type ActionResult = { ok: true; message?: string } | { ok: false; message: string };

export async function createLedgerEntryAction(formData: FormData): Promise<ActionResult> {
  const storeId = await getVisitorStoreId();
  const raw = {
    occurredOn: formData.get("occurredOn")?.toString() ?? "",
    direction: formData.get("direction")?.toString() ?? "IN",
    amountDollars: formData.get("amountDollars")?.toString() ?? "",
    category: formData.get("category")?.toString() ?? "SALE",
    description: formData.get("description")?.toString() ?? "",
    payeeId: formData.get("payeeId")?.toString() || null,
    source: "USER",
    sourceDetail: formData.get("sourceDetail")?.toString() || null,
  };
  const parsed = ledgerEntrySchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues.map((i) => i.message).join(" ") };
  }
  const d = parsed.data;
  try {
    await addLedgerEntry(storeId, {
      occurredOn: d.occurredOn,
      direction: d.direction,
      amountCents: d.amountDollars,
      category: d.category,
      description: d.description,
      payeeId: d.payeeId ?? null,
      source: d.source,
      sourceDetail: d.sourceDetail ?? null,
    });
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Could not save entry." };
  }
  revalidatePath("/data");
  revalidatePath("/today");
  revalidatePath("/dues");
  return { ok: true, message: "Transaction saved." };
}

export async function updateLedgerEntryAction(id: string, formData: FormData): Promise<ActionResult> {
  const storeId = await getVisitorStoreId();
  const raw = {
    occurredOn: formData.get("occurredOn")?.toString() ?? "",
    direction: formData.get("direction")?.toString() ?? "IN",
    amountDollars: formData.get("amountDollars")?.toString() ?? "",
    category: formData.get("category")?.toString() ?? "SALE",
    description: formData.get("description")?.toString() ?? "",
  };
  const parsed = ledgerEntrySchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues.map((i) => i.message).join(" ") };
  }
  const d = parsed.data;
  try {
    await updateLedgerEntry(storeId, id, {
      occurredOn: d.occurredOn,
      direction: d.direction,
      amountCents: d.amountDollars,
      category: d.category,
      description: d.description,
      sourceDetail: "Corrected by owner",
    });
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Could not update entry." };
  }
  revalidatePath("/data");
  revalidatePath("/today");
  return { ok: true, message: "Transaction updated." };
}

export async function deleteLedgerEntryAction(id: string): Promise<ActionResult> {
  const storeId = await getVisitorStoreId();
  try {
    await deleteLedgerEntry(storeId, id);
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Could not delete entry." };
  }
  revalidatePath("/data");
  revalidatePath("/today");
  return { ok: true, message: "Transaction deleted." };
}

export async function createDueAction(formData: FormData): Promise<ActionResult> {
  const storeId = await getVisitorStoreId();
  const raw = {
    payeeName: formData.get("payeeName")?.toString() ?? "",
    kind: formData.get("kind")?.toString() ?? "BILL",
    dueOn: formData.get("dueOn")?.toString() ?? "",
    amountDollars: formData.get("amountDollars")?.toString() ?? "",
    label: formData.get("label")?.toString() || undefined,
    source: "USER",
    sourceDetail: formData.get("sourceDetail")?.toString() || null,
  };
  const parsed = dueSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues.map((i) => i.message).join(" ") };
  }
  const d = parsed.data;
  try {
    await addDue(storeId, {
      payeeName: d.payeeName,
      kind: d.kind,
      dueOn: d.dueOn,
      amountCents: d.amountDollars,
      label: d.label,
      source: d.source,
      sourceDetail: d.sourceDetail ?? null,
    });
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Could not save payment." };
  }
  revalidatePath("/data");
  revalidatePath("/today");
  revalidatePath("/dues");
  return { ok: true, message: "Payment saved." };
}

export async function updateDueAction(id: string, formData: FormData): Promise<ActionResult> {
  const storeId = await getVisitorStoreId();
  const raw = {
    payeeName: formData.get("payeeName")?.toString() ?? "",
    kind: formData.get("kind")?.toString() ?? "BILL",
    dueOn: formData.get("dueOn")?.toString() ?? "",
    amountDollars: formData.get("amountDollars")?.toString() ?? "",
    label: formData.get("label")?.toString() || undefined,
  };
  const parsed = dueSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues.map((i) => i.message).join(" ") };
  }
  const d = parsed.data;
  try {
    await updateDue(storeId, id, {
      dueOn: d.dueOn,
      amountCents: d.amountDollars,
      sourceDetail: "Corrected by owner",
    });
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Could not update payment." };
  }
  revalidatePath("/data");
  revalidatePath("/today");
  revalidatePath("/dues");
  return { ok: true, message: "Payment updated." };
}

export async function deleteDueAction(id: string): Promise<ActionResult> {
  const storeId = await getVisitorStoreId();
  try {
    await deleteDue(storeId, id);
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Could not delete payment." };
  }
  revalidatePath("/data");
  revalidatePath("/today");
  revalidatePath("/dues");
  return { ok: true, message: "Payment deleted." };
}

export async function updateOpeningBalanceAction(formData: FormData): Promise<ActionResult> {
  const storeId = await getVisitorStoreId();
  const raw = {
    openingBalanceDollars: formData.get("openingBalanceDollars")?.toString() ?? "",
    openingBalanceOn: formData.get("openingBalanceOn")?.toString() ?? "",
  };
  const parsed = openingBalanceSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues.map((i) => i.message).join(" ") };
  }
  const d = parsed.data;
  try {
    await updateOpeningBalance(storeId, d.openingBalanceDollars, d.openingBalanceOn, "USER", "Updated by owner");
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Could not update opening balance." };
  }
  revalidatePath("/data");
  revalidatePath("/today");
  return { ok: true, message: "Opening balance updated." };
}

export async function previewCsvAction(csvText: string, mapping: { date: number; amount: number; direction?: number; description?: number; category?: number; payee?: number }): Promise<{ ok: true; preview: ReturnType<typeof buildCsvPreview> } | { ok: false; message: string }> {
  const storeId = await getVisitorStoreId();
  try {
    const keys = await existingLedgerKeys(storeId);
    const preview = buildCsvPreview(csvText, mapping, keys);
    return { ok: true, preview };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Could not preview CSV." };
  }
}

export async function importCsvAction(csvText: string, mapping: { date: number; amount: number; direction?: number; description?: number; category?: number; payee?: number }, sourceDetail: string): Promise<{ ok: true; result: Awaited<ReturnType<typeof importLedgerCsv>> } | { ok: false; message: string }> {
  const storeId = await getVisitorStoreId();
  try {
    const keys = await existingLedgerKeys(storeId);
    const preview = buildCsvPreview(csvText, mapping, keys);
    const result = await importLedgerCsv(storeId, preview.rows, sourceDetail || "CSV import");
    revalidatePath("/data");
    revalidatePath("/today");
    return { ok: true, result };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Could not import CSV." };
  }
}
