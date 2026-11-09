import { describe, expect, it } from "vitest";
import { parseCsv, buildCsvPreview } from "./csv";

describe("parseCsv", () => {
  it("parses simple CSV", () => {
    const rows = parseCsv("a,b,c\n1,2,3\n4,5,6");
    expect(rows).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
      ["4", "5", "6"],
    ]);
  });

  it("handles quoted fields with commas", () => {
    const rows = parseCsv('date,desc,amount\n2026-11-01,"Coffee, beans",12.50');
    expect(rows[1]).toEqual(["2026-11-01", "Coffee, beans", "12.50"]);
  });

  it("skips blank lines", () => {
    const rows = parseCsv("a,b\n1,2\n\n3,4\n");
    expect(rows.length).toBe(3);
  });
});

describe("buildCsvPreview", () => {
  it("validates dates and amounts, flags duplicates", () => {
    const text = "date,amount,description\n2026-11-01,100.00,Sale A\nbad-date,abc,Sale B\n2026-11-01,100.00,Sale A";
    const existing = new Set<string>();
    const preview = buildCsvPreview(text, { date: 0, amount: 1, description: 2 }, existing);
    expect(preview.headers).toEqual(["date", "amount", "description"]);
    expect(preview.rows.length).toBe(3);
    expect(preview.errorCount).toBe(1);
    expect(preview.duplicateCount).toBe(1);
    expect(preview.validCount).toBe(1);
  });

  it("infers direction from negative amounts", () => {
    const text = "date,amount\n2026-11-02,-50.00";
    const preview = buildCsvPreview(text, { date: 0, amount: 1 }, new Set());
    expect(preview.rows[0].direction).toBe("OUT");
    expect(preview.rows[0].amountCents).toBe(5000);
  });
});
