"use client";

import { useState } from "react";
import { previewCsvAction, importCsvAction } from "@/app/(owner)/data/actions";

type Preview = Awaited<ReturnType<typeof previewCsvAction>>;

export function CsvImportForm() {
  const [csvText, setCsvText] = useState("");
  const [mapping, setMapping] = useState({ date: 0, amount: 1, direction: -1, description: 2, category: -1, payee: -1 });
  const [preview, setPreview] = useState<Extract<Preview, { ok: true }>["preview"] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handlePreview() {
    setLoading(true);
    setMessage(null);
    const m = {
      date: mapping.date,
      amount: mapping.amount,
      direction: mapping.direction >= 0 ? mapping.direction : undefined,
      description: mapping.description >= 0 ? mapping.description : undefined,
      category: mapping.category >= 0 ? mapping.category : undefined,
      payee: mapping.payee >= 0 ? mapping.payee : undefined,
    };
    const res = await previewCsvAction(csvText, m);
    setLoading(false);
    if (!res.ok) {
      setMessage(res.message);
      setPreview(null);
      return;
    }
    setPreview(res.preview);
  }

  async function handleImport() {
    if (!preview) return;
    setLoading(true);
    setMessage(null);
    const m = {
      date: mapping.date,
      amount: mapping.amount,
      direction: mapping.direction >= 0 ? mapping.direction : undefined,
      description: mapping.description >= 0 ? mapping.description : undefined,
      category: mapping.category >= 0 ? mapping.category : undefined,
      payee: mapping.payee >= 0 ? mapping.payee : undefined,
    };
    const res = await importCsvAction(csvText, m, "CSV import");
    setLoading(false);
    if (!res.ok) {
      setMessage(res.message);
      return;
    }
    setMessage(`Imported ${res.result.imported} rows. Skipped ${res.result.skippedDuplicates} duplicates. ${res.result.failed.length} failed.`);
    setPreview(null);
    setCsvText("");
  }

  return (
    <div className="space-y-4">
      <textarea
        value={csvText}
        onChange={(e) => setCsvText(e.target.value)}
        placeholder="Paste CSV here. First row should be headers."
        className="w-full h-32 rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono"
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
        <label className="flex flex-col gap-1">
          Date column (0-based)
          <input type="number" value={mapping.date} onChange={(e) => setMapping({ ...mapping, date: Number(e.target.value) })} className="rounded-lg border border-slate-200 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1">
          Amount column
          <input type="number" value={mapping.amount} onChange={(e) => setMapping({ ...mapping, amount: Number(e.target.value) })} className="rounded-lg border border-slate-200 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1">
          Direction column (-1 if none)
          <input type="number" value={mapping.direction} onChange={(e) => setMapping({ ...mapping, direction: Number(e.target.value) })} className="rounded-lg border border-slate-200 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1">
          Description column
          <input type="number" value={mapping.description} onChange={(e) => setMapping({ ...mapping, description: Number(e.target.value) })} className="rounded-lg border border-slate-200 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1">
          Category column
          <input type="number" value={mapping.category} onChange={(e) => setMapping({ ...mapping, category: Number(e.target.value) })} className="rounded-lg border border-slate-200 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1">
          Payee column
          <input type="number" value={mapping.payee} onChange={(e) => setMapping({ ...mapping, payee: Number(e.target.value) })} className="rounded-lg border border-slate-200 px-3 py-2" />
        </label>
      </div>
      <div className="flex gap-3">
        <button onClick={handlePreview} disabled={loading || !csvText.trim()} className="rounded-lg bg-slate-900 text-white text-sm font-semibold px-4 py-2 disabled:opacity-50">
          Preview import
        </button>
        {preview && (
          <button onClick={handleImport} disabled={loading} className="rounded-lg bg-emerald-600 text-white text-sm font-semibold px-4 py-2 disabled:opacity-50">
            Import {preview.validCount} valid rows
          </button>
        )}
      </div>
      {message && <p className="text-sm text-slate-700">{message}</p>}
      {preview && (
        <div className="text-sm space-y-2">
          <p className="text-slate-600">
            Headers: {preview.headers.join(", ")} • Valid: {preview.validCount} • Duplicates: {preview.duplicateCount} • Errors: {preview.errorCount}
          </p>
          <ul className="divide-y divide-slate-100 max-h-64 overflow-auto">
            {preview.rows.slice(0, 50).map((r) => (
              <li key={r.rowNumber} className="py-2 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500">Row {r.rowNumber}</span>
                <span className="flex-1 text-xs text-slate-700 truncate">
                  {r.occurredOn ?? "—"} • {r.direction ?? "—"} • {r.amountCents !== null ? (r.amountCents / 100).toFixed(2) : "—"} • {r.description}
                </span>
                <span className={`text-xs font-semibold ${r.errors.length > 0 ? "text-rose-600" : r.duplicate ? "text-amber-600" : "text-emerald-600"}`}>
                  {r.errors.length > 0 ? r.errors.join("; ") : r.duplicate ? "Duplicate" : "OK"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
