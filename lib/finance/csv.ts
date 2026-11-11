import type { CsvColumnMapping, CsvImportPreview, CsvImportRow } from "./types";
import type { IsoDate } from "@/types";
import { isValidIsoDate } from "./validate";
import { dollarsToCents } from "@/lib/shared/money";

/** Split a CSV text into rows of fields, honoring quoted fields. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  let i = 0;
  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    if (row.length === 0 && field === "" && rows.length > 0) {
      // skip trailing empty line
    } else {
      // only push if row has content or not the very first empty
      if (row.length > 0 || field !== "") {
        if (row.length === 0) row.push(field);
        rows.push(row);
      }
    }
    row = [];
    field = "";
  };

  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ",") {
      pushField();
      i++;
      continue;
    }
    if (ch === "\n") {
      pushField();
      pushRow();
      i++;
      continue;
    }
    if (ch === "\r") {
      i++;
      continue;
    }
    field += ch;
    i++;
  }
  // last field/row
  if (field !== "" || row.length > 0) {
    pushField();
    rows.push(row);
  }
  return rows.filter((r) => r.some((f) => f.trim() !== ""));
}

function cell(row: string[], idx: number | undefined): string {
  if (idx === undefined || idx < 0 || idx >= row.length) return "";
  return row[idx].trim();
}

function inferDirection(amountRaw: string): "IN" | "OUT" | null {
  const cleaned = amountRaw.replace(/[$,\s]/g, "");
  if (cleaned.startsWith("-")) return "OUT";
  if (cleaned.startsWith("(") && cleaned.endsWith(")")) return "OUT";
  return "IN";
}

function cleanAmount(raw: string): string {
  let v = raw.trim().replace(/[$,\s]/g, "");
  if (v.startsWith("(") && v.endsWith(")")) v = "-" + v.slice(1, -1);
  return v;
}

export function buildCsvPreview(
  text: string,
  mapping: CsvColumnMapping,
  existingKeys: Set<string>
): CsvImportPreview {
  const parsed = parseCsv(text);
  if (parsed.length === 0) {
    return { headers: [], rows: [], validCount: 0, duplicateCount: 0, errorCount: 0 };
  }
  const headers = parsed[0];
  const dataRows = parsed.slice(1);
  const seen = new Set<string>();
  const rows: CsvImportRow[] = dataRows.map((raw, idx) => {
    const errors: string[] = [];
    const dateRaw = cell(raw, mapping.date);
    const amountRaw = cell(raw, mapping.amount);
    const dirRaw = mapping.direction !== undefined ? cell(raw, mapping.direction) : "";
    const descRaw = mapping.description !== undefined ? cell(raw, mapping.description) : "";
    const catRaw = mapping.category !== undefined ? cell(raw, mapping.category) : "";
    const payeeRaw = mapping.payee !== undefined ? cell(raw, mapping.payee) : "";

    let occurredOn: IsoDate | null = null;
    if (!isValidIsoDate(dateRaw)) {
      errors.push("Invalid or missing date (YYYY-MM-DD).");
    } else {
      occurredOn = dateRaw;
    }

    let amountCents: number | null = null;
    const cleaned = cleanAmount(amountRaw);
    if (!/^-?\d+(\.\d{1,2})?$/.test(cleaned)) {
      errors.push("Invalid or missing amount.");
    } else {
      try {
        amountCents = dollarsToCents(Math.abs(Number(cleaned)));
      } catch {
        errors.push("Invalid amount.");
      }
    }

    let direction: "IN" | "OUT" | null = null;
    if (dirRaw) {
      const up = dirRaw.toUpperCase();
      if (up === "IN" || up === "CREDIT" || up === "DEPOSIT") direction = "IN";
      else if (up === "OUT" || up === "DEBIT" || up === "WITHDRAWAL" || up === "PAYMENT") direction = "OUT";
      else errors.push("Unknown direction value.");
    } else {
      direction = inferDirection(amountRaw);
    }

    const description = descRaw || "Imported transaction";
    const category = catRaw || (direction === "IN" ? "SALE" : "BILL");
    const payeeName = payeeRaw || null;

    let duplicate = false;
    if (occurredOn && amountCents !== null && direction) {
      const key = `${occurredOn}|${direction}|${amountCents}|${description.toLowerCase()}`;
      if (existingKeys.has(key) || seen.has(key)) duplicate = true;
      seen.add(key);
    }

    return {
      rowNumber: idx + 2,
      raw,
      occurredOn,
      amountCents,
      direction,
      description,
      category,
      payeeName,
      errors,
      duplicate,
      selected: errors.length === 0 && !duplicate,
    };
  });

  const validCount = rows.filter((r) => r.errors.length === 0 && !r.duplicate).length;
  const duplicateCount = rows.filter((r) => r.duplicate).length;
  const errorCount = rows.filter((r) => r.errors.length > 0).length;

  return { headers, rows, validCount, duplicateCount, errorCount };
}
