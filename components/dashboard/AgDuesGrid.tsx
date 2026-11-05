"use client";

import { useMemo } from "react";
import type { ColDef, IRowNode } from "ag-grid-community";
import { AgGridReact, type CustomCellRendererProps } from "ag-grid-react";
import { formatCents, formatDollars, formatShortfall } from "@/lib/shared/money";
import { gridTheme } from "./gridTheme";
import type { DueRow } from "./rows";

/**
 * Money out over the next 14 days (AG Grid Community): each payment due with a ready meter, how much of it the
 * forecast says will be there on the day, like the till drawer's note stack. Loaded only on a laptop (DuesTable).
 */

function ReadyCell({ data }: CustomCellRendererProps<DueRow>) {
  if (!data) return null;
  const short = Math.max(0, data.amountCents - data.readyCents);
  const pct = data.amountCents > 0 ? Math.min(100, (100 * data.readyCents) / data.amountCents) : 100;
  return (
    <span className="flex h-full items-center gap-3">
      <span aria-hidden className="relative h-2.5 w-[120px] shrink-0 overflow-hidden rounded-full bg-red/80">
        <span className="absolute inset-y-0 left-0 rounded-full bg-green" style={{ width: `${pct}%` }} />
      </span>
      <span className="tabular">
        {short > 0 ? (
          <>
            <span className="font-semibold">{formatShortfall(short)} short</span>
            <span className="text-ink-muted"> · {formatDollars(data.readyCents)} ready</span>
          </>
        ) : (
          <span>Ready</span>
        )}
      </span>
    </span>
  );
}

function StatusCell({ data }: CustomCellRendererProps<DueRow>) {
  if (!data) return null;
  return (
    <span>
      {data.status}
      {data.movedFrom ? <span className="text-ink-muted"> from {data.movedFrom}</span> : null}
      {data.simulated && data.status === "Moved" ? <span className="text-ink-muted"> (simulated)</span> : null}
    </span>
  );
}

export function AgDuesGrid({ rows }: { rows: DueRow[] }) {
  const columns = useMemo<ColDef<DueRow>[]>(
    () => [
      {
        headerName: "Due",
        field: "dueLabel",
        width: 128,
        sort: "asc",
        comparator: (_a, _b, na: IRowNode<DueRow>, nb: IRowNode<DueRow>) => (na.data?.dueOn ?? "").localeCompare(nb.data?.dueOn ?? ""),
      },
      { headerName: "Pay to", field: "payee", flex: 1, minWidth: 180, filter: "agTextColumnFilter", tooltipField: "what" },
      { headerName: "Amount", field: "amountCents", width: 124, type: "rightAligned", valueFormatter: (p) => (p.value == null ? "" : formatCents(p.value)), cellClass: "tabular", filter: "agNumberColumnFilter" },
      {
        headerName: "Ready on the day",
        colId: "ready",
        minWidth: 270,
        flex: 1.4,
        cellRenderer: ReadyCell,
        valueGetter: (p) => (p.data ? p.data.readyCents - p.data.amountCents : 0),
      },
      { headerName: "Status", field: "status", width: 130, cellRenderer: StatusCell },
    ],
    [],
  );

  return (
    <AgGridReact<DueRow>
      theme={gridTheme}
      rowData={rows}
      columnDefs={columns}
      defaultColDef={{ sortable: true, resizable: true, suppressHeaderMenuButton: true }}
      getRowId={(p) => p.data.id}
      domLayout="autoHeight"
      overlayNoRowsTemplate='<span style="font-size:15px">Nothing to pay in the next 14 days.</span>'
      animateRows
    />
  );
}
