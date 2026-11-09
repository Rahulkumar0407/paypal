import type { Cents, IsoDate } from "@/types";

export type FinancialSource = "USER" | "IMPORT" | "PROVIDER" | "FORECAST" | "SIMULATED";

export interface LedgerEntryInput {
  occurredOn: IsoDate;
  direction: "IN" | "OUT";
  amountCents: Cents;
  category: string;
  description: string;
  payeeId?: string | null;
  source?: FinancialSource;
  sourceDetail?: string | null;
}

export interface DueInput {
  payeeName: string;
  kind: "SUPPLIER" | "BILL" | "OWNER_TRANSFER" | "LOAN";
  dueOn: IsoDate;
  amountCents: Cents;
  label?: string;
  source?: FinancialSource;
  sourceDetail?: string | null;
}

export interface CsvColumnMapping {
  date: number;
  amount: number;
  direction?: number;
  description?: number;
  category?: number;
  payee?: number;
}

export interface CsvImportRow {
  rowNumber: number;
  raw: string[];
  occurredOn: IsoDate | null;
  amountCents: Cents | null;
  direction: "IN" | "OUT" | null;
  description: string;
  category: string;
  payeeName: string | null;
  errors: string[];
  duplicate: boolean;
  selected: boolean;
}

export interface CsvImportPreview {
  headers: string[];
  rows: CsvImportRow[];
  validCount: number;
  duplicateCount: number;
  errorCount: number;
}

export interface ImportResult {
  imported: number;
  skippedDuplicates: number;
  failed: { rowNumber: number; reason: string }[];
}
