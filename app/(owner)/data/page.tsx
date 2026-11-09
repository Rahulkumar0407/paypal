import type { Metadata } from "next";
import { getVisitorStoreId } from "@/lib/demo";
import { getStoreSettings } from "@/lib/store";
import { listLedgerEntries, listDues } from "@/lib/finance";
import { formatDollars } from "@/lib/shared/money";
import { formatDay } from "@/lib/shared/dates";
import { CsvImportForm } from "@/components/app/CsvImportForm";

export const metadata: Metadata = { title: "Financial Data • NeverShort" };

export default async function DataPage() {
  const storeId = await getVisitorStoreId();
  const [settings, entries, dues] = await Promise.all([
    getStoreSettings(storeId),
    listLedgerEntries(storeId),
    listDues(storeId),
  ]);

  return (
    <div className="space-y-8 max-w-[960px] mx-auto">
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight">
          Financial Data
        </h1>
        <p className="text-sm text-slate-500">
          Enter, import, review and correct the numbers NeverShort uses for your forecast. Every record keeps its source.
        </p>
      </div>

      {/* Opening balance */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <h2 className="text-base font-semibold text-slate-900">Opening cash balance</h2>
        <p className="text-xs text-slate-500">
          Current opening balance: {formatDollars(settings.openingBalanceCents)} on {settings.openingBalanceOn} (source: {settings.openingBalanceSource}).
        </p>
        <form action={async (fd) => {
          "use server";
          const { updateOpeningBalanceAction } = await import("./actions");
          await updateOpeningBalanceAction(fd);
        }} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input name="openingBalanceDollars" placeholder="Starting cash (dollars)" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <input name="openingBalanceOn" type="date" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" defaultValue={new Date().toISOString().slice(0, 10)} />
          <button type="submit" className="rounded-lg bg-slate-900 text-white text-sm font-semibold px-4 py-2">Save opening balance</button>
        </form>
      </section>

      {/* Add transaction */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <h2 className="text-base font-semibold text-slate-900">Add a transaction</h2>
        <form action={async (fd) => {
          "use server";
          const { createLedgerEntryAction } = await import("./actions");
          await createLedgerEntryAction(fd);
        }} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input name="occurredOn" type="date" required className="rounded-lg border border-slate-200 px-3 py-2 text-sm" defaultValue={new Date().toISOString().slice(0, 10)} />
          <select name="direction" className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="IN">Money in</option>
            <option value="OUT">Money out</option>
          </select>
          <input name="amountDollars" placeholder="Amount (dollars)" required className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <select name="category" className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="SALE">Sale</option>
            <option value="SUPPLIER">Supplier</option>
            <option value="BILL">Bill</option>
            <option value="OWNER_TRANSFER">Owner transfer</option>
            <option value="LOAN_REPAYMENT">Loan repayment</option>
            <option value="REFUND">Refund</option>
          </select>
          <input name="description" placeholder="Description" required className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2" />
          <button type="submit" className="rounded-lg bg-slate-900 text-white text-sm font-semibold px-4 py-2 sm:col-span-2">Save transaction</button>
        </form>
      </section>

      {/* Transaction list */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-3">
        <h2 className="text-base font-semibold text-slate-900">Recorded transactions ({entries.length})</h2>
        {entries.length === 0 ? (
          <p className="text-sm text-slate-500">No transactions yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {entries.map((e) => (
              <li key={e.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                <div>
                  <span className="font-medium text-slate-900 block">{e.description}</span>
                  <span className="text-xs text-slate-400">{formatDay(e.occurredOn)} • {e.category} • {e.source}</span>
                </div>
                <div className="text-right">
                  <span className={`font-mono font-bold ${e.direction === "IN" ? "text-emerald-700" : "text-rose-700"}`}>
                    {e.direction === "IN" ? "+" : "−"}{formatDollars(e.amountCents)}
                  </span>
                  <details className="mt-1">
                    <summary className="text-xs text-blue-600 cursor-pointer">Edit</summary>
                    <form action={async (fd) => {
                      "use server";
                      const { updateLedgerEntryAction } = await import("./actions");
                      await updateLedgerEntryAction(e.id, fd);
                    }} className="mt-2 grid grid-cols-1 gap-2 text-left">
                      <input name="occurredOn" type="date" defaultValue={e.occurredOn} className="rounded border border-slate-200 px-2 py-1 text-xs" />
                      <select name="direction" defaultValue={e.direction} className="rounded border border-slate-200 px-2 py-1 text-xs">
                        <option value="IN">Money in</option>
                        <option value="OUT">Money out</option>
                      </select>
                      <input name="amountDollars" defaultValue={(e.amountCents / 100).toFixed(2)} className="rounded border border-slate-200 px-2 py-1 text-xs" />
                      <input name="category" defaultValue={e.category} className="rounded border border-slate-200 px-2 py-1 text-xs" />
                      <input name="description" defaultValue={e.description} className="rounded border border-slate-200 px-2 py-1 text-xs" />
                      <button type="submit" className="rounded bg-slate-900 text-white text-xs px-2 py-1">Save</button>
                    </form>
                  </details>
                  <form action={async () => {
                    "use server";
                    const { deleteLedgerEntryAction } = await import("./actions");
                    await deleteLedgerEntryAction(e.id);
                  }} className="mt-1">
                    <button type="submit" className="text-xs text-rose-600 hover:underline">Delete</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Add bill */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <h2 className="text-base font-semibold text-slate-900">Add an upcoming payment / bill</h2>
        <form action={async (fd) => {
          "use server";
          const { createDueAction } = await import("./actions");
          await createDueAction(fd);
        }} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input name="payeeName" placeholder="Payee name" required className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <select name="kind" className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="BILL">Bill</option>
            <option value="SUPPLIER">Supplier</option>
            <option value="OWNER_TRANSFER">Owner transfer</option>
            <option value="LOAN">Loan</option>
          </select>
          <input name="dueOn" type="date" required className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <input name="amountDollars" placeholder="Amount (dollars)" required className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <input name="label" placeholder="Label (optional)" className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2" />
          <button type="submit" className="rounded-lg bg-slate-900 text-white text-sm font-semibold px-4 py-2 sm:col-span-2">Save payment</button>
        </form>
      </section>

      {/* Bills list */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-3">
        <h2 className="text-base font-semibold text-slate-900">Upcoming payments ({dues.length})</h2>
        {dues.length === 0 ? (
          <p className="text-sm text-slate-500">No upcoming payments yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {dues.map((d) => (
              <li key={d.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                <div>
                  <span className="font-medium text-slate-900 block">{d.payeeName}</span>
                  <span className="text-xs text-slate-400">{formatDay(d.dueOn)} • {d.kind} • {d.source}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900">{formatDollars(d.amountCents)}</span>
                  <details className="mt-1">
                    <summary className="text-xs text-blue-600 cursor-pointer">Edit</summary>
                    <form action={async (fd) => {
                      "use server";
                      const { updateDueAction } = await import("./actions");
                      await updateDueAction(d.id, fd);
                    }} className="mt-2 grid grid-cols-1 gap-2 text-left">
                      <input name="payeeName" defaultValue={d.payeeName} className="rounded border border-slate-200 px-2 py-1 text-xs" />
                      <select name="kind" defaultValue={d.kind} className="rounded border border-slate-200 px-2 py-1 text-xs">
                        <option value="BILL">Bill</option>
                        <option value="SUPPLIER">Supplier</option>
                        <option value="OWNER_TRANSFER">Owner transfer</option>
                        <option value="LOAN">Loan</option>
                      </select>
                      <input name="dueOn" type="date" defaultValue={d.dueOn} className="rounded border border-slate-200 px-2 py-1 text-xs" />
                      <input name="amountDollars" defaultValue={(d.amountCents / 100).toFixed(2)} className="rounded border border-slate-200 px-2 py-1 text-xs" />
                      <button type="submit" className="rounded bg-slate-900 text-white text-xs px-2 py-1">Save</button>
                    </form>
                  </details>
                  <form action={async () => {
                    "use server";
                    const { deleteDueAction } = await import("./actions");
                    await deleteDueAction(d.id);
                  }} className="mt-1">
                    <button type="submit" className="text-xs text-rose-600 hover:underline">Delete</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Provider connections */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-3">
        <h2 className="text-base font-semibold text-slate-900">Provider connections</h2>
        <p className="text-sm text-slate-500">
          PayPal sandbox: {process.env.PAYPAL_CLIENT_ID ? "configured" : "not configured"}. PayPal Orders v2 supplies order and capture details for checkouts created in NeverShort; it does not provide full account history or balances. Export PayPal history to CSV to import past sales.
        </p>
      </section>

      {/* CSV import */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <h2 className="text-base font-semibold text-slate-900">Import transactions from CSV</h2>
        <CsvImportForm />
      </section>
    </div>
  );
}
