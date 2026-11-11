import { z } from "zod";
import { dollarsToCents } from "@/lib/shared/money";

// Re-export a small helper for date validation.
export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export const ledgerEntrySchema = z.object({
  occurredOn: z.string().refine(isValidIsoDate, "Date must be YYYY-MM-DD."),
  direction: z.enum(["IN", "OUT"]),
  amountDollars: z
    .string()
    .trim()
    .transform((v) => v.replace(/[$,\s]/g, ""))
    .pipe(z.string().regex(/^\d+(\.\d{1,2})?$/, "Amount must be a number with up to 2 decimals."))
    .transform((v) => dollarsToCents(v)),
  category: z.string().min(1).max(40),
  description: z.string().trim().min(1, "Description is required.").max(200),
  payeeId: z.string().nullable().optional(),
  source: z.enum(["USER", "IMPORT", "PROVIDER", "FORECAST", "SIMULATED"]).optional(),
  sourceDetail: z.string().max(200).nullable().optional(),
});

export const dueSchema = z.object({
  payeeName: z.string().trim().min(1, "Payee name is required.").max(80),
  kind: z.enum(["SUPPLIER", "BILL", "OWNER_TRANSFER", "LOAN"]),
  dueOn: z.string().refine(isValidIsoDate, "Date must be YYYY-MM-DD."),
  amountDollars: z
    .string()
    .trim()
    .transform((v) => v.replace(/[$,\s]/g, ""))
    .pipe(z.string().regex(/^\d+(\.\d{1,2})?$/, "Amount must be a number with up to 2 decimals."))
    .transform((v) => dollarsToCents(v)),
  label: z.string().max(120).optional(),
  source: z.enum(["USER", "IMPORT", "PROVIDER", "FORECAST", "SIMULATED"]).optional(),
  sourceDetail: z.string().max(200).nullable().optional(),
});

export const openingBalanceSchema = z.object({
  openingBalanceDollars: z
    .string()
    .trim()
    .transform((v) => v.replace(/[$,\s]/g, ""))
    .pipe(z.string().regex(/^\d+(\.\d{1,2})?$/, "Amount must be a number with up to 2 decimals."))
    .transform((v) => dollarsToCents(v)),
  openingBalanceOn: z.string().refine(isValidIsoDate, "Date must be YYYY-MM-DD."),
});
