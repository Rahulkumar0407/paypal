"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { ColDef, GridApi, ValueFormatterParams } from "ag-grid-community";
import { AgGridReact, type CustomCellRendererProps } from "ag-grid-react";
import { RefereeCard } from "@/components/ui/RefereeCard";
import { formatCents } from "@/lib/shared/money";
import { gridTheme } from "./gridTheme";
import type { OrderRow, OrderStatusWord } from "./rows";

/**
 * The orders grid (AG Grid Community): every recent order with what PayPal took and what actually arrived, the risk
 * check and the Margin Guard's latest decision as referee cards. Search, status filters with counts, sortable and
 * filterable columns, and a totals row that follows the filter. Loaded only on a laptop (OrdersTable).
 */

const STATUSES: OrderStatusWord[] = ["Paid", "Waiting", "Abandoned", "Failed", "Refunded"];

/** Colour is never the only signal: every mark sits beside its word (AGENTS.md section 7). */
const STATUS_MARK: Record<OrderStatusWord, string> = {
  Paid: "bg-green",
  Waiting: "bg-amber",
  Abandoned: "border border-ink/50",
  Failed: "bg-red",
  Refunded: "border border-ink/50 bg-ink/15",
};

interface TotalsRow {
  pinned: true;
  /** The order count, under the Order column's field so AG Grid redraws it when the filter changes the count. */
  number: number;
  totalCents: number;
  feeCents: number;
  netCents: number;
}

type Row = OrderRow | TotalsRow;
const isTotals = (r: Row | undefined): r is TotalsRow => Boolean(r && "pinned" in r);

const money = (p: ValueFormatterParams<Row, number | null>) => (p.value === null || p.value === undefined ? "" : formatCents(p.value));

function StatusCell({ data }: CustomCellRendererProps<Row>) {
  if (!data || isTotals(data)) return null;
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden className={`inline-block size-2.5 shrink-0 rounded-[3px] ${STATUS_MARK[data.status]}`} />
      <span>{data.status}</span>
      {data.statusNote ? <span className="text-ink-muted">· {data.statusNote}</span> : null}
    </span>
  );
}

function OrderCell({ data }: CustomCellRendererProps<Row>) {
  if (!data) return null;
  if (isTotals(data)) return <span className="font-semibold">{data.number === 1 ? "1 order" : `${data.number} orders`}</span>;
  return (
    <span className="flex flex-col justify-center leading-tight">
      <span className="tabular font-semibold">#{data.number}</span>
      <span className="text-[12.5px] text-ink-muted">{data.placedLabel}</span>
    </span>
  );
}

/** What arrived after PayPal's fee, with the fee underneath. */
function ArrivedCell({ data }: CustomCellRendererProps<Row>) {
  if (!data || data.netCents === null) return null;
  return (
    <span className="flex flex-col items-end justify-center leading-tight">
      <span className="tabular font-semibold">{formatCents(data.netCents)}</span>
      <span className="text-[12.5px] text-ink-muted tabular">fee {formatCents(data.feeCents ?? 0)}</span>
    </span>
  );
}

function RiskCell({ data }: CustomCellRendererProps<Row>) {
  if (!data || isTotals(data) || !data.risk) return null;
  return (
    <span title={data.risk.detail}>
      {data.risk.held ? (
        <span className="inline-flex items-center gap-2"><span aria-hidden className="inline-block size-2.5 rounded-[3px] border border-ink/60" />Held</span>
      ) : (
        <RefereeCard decision="ESCALATE" size="sm" label="Looks risky" />
      )}
    </span>
  );
}

function GuardCell({ data }: CustomCellRendererProps<Row>) {
  if (!data || isTotals(data) || !data.guard) return null;
  return (
    <span title={`${data.guard.what}: ${data.guard.reason}`}>
      <RefereeCard decision={data.guard.decision} size="sm" />
    </span>
  );
}

function NoOrders() {
  return (
    <div className="px-6 text-center">
      <p className="text-[16px] font-semibold text-ink">No orders here.</p>
      <p className="mt-1 text-[14px] text-ink-muted">Orders appear here when someone checks out. If you searched, try another search.</p>
    </div>
  );
}

export function AgOrdersGrid({ rows }: { rows: OrderRow[] }) {
  const api = useRef<GridApi<Row> | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OrderStatusWord | "All">("All");
  const statusRef = useRef(status);
  const [totals, setTotals] = useState<TotalsRow | null>(null);

  const counts = useMemo(() => {
    const c = new Map<OrderStatusWord, number>();
    for (const r of rows) c.set(r.status, (c.get(r.status) ?? 0) + 1);
    return c;
  }, [rows]);

  const columns = useMemo<ColDef<Row>[]>(
    () => [
      {
        headerName: "Order",
        field: "number",
        width: 116,
        cellRenderer: OrderCell,
        filter: "agNumberColumnFilter",
        sort: "desc",
        getQuickFilterText: (p) => (p.data && !isTotals(p.data) ? `${p.data.number} ${p.data.placedLabel}` : ""),
      },
      { headerName: "Buyer", field: "buyer", flex: 1.2, minWidth: 120, filter: "agTextColumnFilter" },
      { headerName: "Status", field: "status", flex: 1, minWidth: 128, cellRenderer: StatusCell },
      { headerName: "Total", field: "totalCents", width: 108, type: "rightAligned", valueFormatter: money, filter: "agNumberColumnFilter", cellClass: "tabular" },
      { headerName: "Arrived", field: "netCents", width: 112, type: "rightAligned", cellRenderer: ArrivedCell, filter: "agNumberColumnFilter", headerTooltip: "What reached PayPal after its fee" },
      { headerName: "Risk check", colId: "risk", width: 108, sortable: false, cellRenderer: RiskCell },
      { headerName: "Margin Guard", colId: "guard", width: 128, sortable: false, cellRenderer: GuardCell },
    ],
    [],
  );

  // The totals row adds up exactly the rows the search and filters leave.
  const recount = useCallback(() => {
    const g = api.current;
    if (!g) return;
    const t: TotalsRow = { pinned: true, number: 0, totalCents: 0, feeCents: 0, netCents: 0 };
    g.forEachNodeAfterFilter((n) => {
      if (!n.data || isTotals(n.data)) return;
      t.number += 1;
      t.totalCents += n.data.totalCents;
      t.feeCents += n.data.feeCents ?? 0;
      t.netCents += n.data.netCents ?? 0;
    });
    setTotals(t);
  }, []);

  const pickStatus = (s: OrderStatusWord | "All") => {
    statusRef.current = s;
    setStatus(s);
    api.current?.onFilterChanged();
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="relative">
          <span className="sr-only">Search orders</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search a buyer or order"
            className="h-11 w-[260px] rounded-[10px] bg-white px-3.5 text-[15px] text-ink ring-1 ring-ink/15 outline-none placeholder:text-ink-muted focus:ring-2 focus:ring-brand"
          />
        </label>
        <div role="group" aria-label="Show orders" className="flex flex-wrap gap-2">
          {(["All", ...STATUSES] as const).map((s) => {
            const n = s === "All" ? rows.length : (counts.get(s) ?? 0);
            if (s !== "All" && n === 0) return null;
            const on = status === s;
            return (
              <button
                key={s}
                type="button"
                aria-pressed={on}
                onClick={() => pickStatus(s)}
                className={`inline-flex h-11 items-center gap-2 rounded-full px-4 text-[14px] font-medium ring-1 transition-colors ${on ? "bg-brand text-white ring-brand" : "bg-white text-ink ring-ink/15 hover:ring-ink/40"}`}
              >
                {s === "All" ? null : <span aria-hidden className={`inline-block size-2.5 rounded-[3px] ${STATUS_MARK[s]}`} />}
                {s}
                <span className={on ? "text-white/75" : "text-ink-muted"}>{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-[560px]">
        <AgGridReact<Row>
          theme={gridTheme}
          rowData={rows}
          columnDefs={columns}
          defaultColDef={{ sortable: true, resizable: true, suppressHeaderMenuButton: true, filterParams: { buttons: ["reset"] } }}
          getRowId={(p) => (isTotals(p.data) ? "totals" : p.data.id)}
          quickFilterText={search}
          isExternalFilterPresent={() => statusRef.current !== "All"}
          doesExternalFilterPass={(n) => Boolean(n.data && !isTotals(n.data) && n.data.status === statusRef.current)}
          pinnedBottomRowData={totals ? [totals] : []}
          getRowClass={(p) => (p.node.rowPinned ? "font-semibold" : undefined)}
          noRowsOverlayComponent={NoOrders}
          localeText={{ noMatchingRows: "No orders match. Try another search or status." }}
          onGridReady={(e) => {
            api.current = e.api;
            recount();
          }}
          onModelUpdated={recount}
          animateRows
          suppressCellFocus={false}
          ensureDomOrder
        />
      </div>
    </div>
  );
}
