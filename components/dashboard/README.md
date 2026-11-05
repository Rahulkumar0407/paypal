# components/dashboard/

**Owner:** Person 2. Task P2-5 (built Thu 5 Nov).

The laptop dashboard's tables, in **AG Grid Community** only (never `ag-grid-enterprise`), styled in our design
(`gridTheme.ts`: banknote-paper sheet, ink text, brand green accent, ledger rules).

- `OrdersTable({ rows, orders })`: every recent order (`AgOrdersGrid`). Search, status filter chips with counts,
  sortable and filterable columns, custom cells (order and date, status word with its mark, what arrived after
  PayPal's fee, the risk check and the Margin Guard's latest decision as referee cards) and a totals row that follows
  the filter. `OrdersList({ orders })` is the phone version.
- `DuesTable({ rows })`: money out over the forecast's 14 days (`AgDuesGrid`) with a ready meter per payment.
  `DuesList({ rows })` is the phone version.
- `rows.ts` builds the rows on the server from module data (`orderRows`, `dueRows`). Money stays in cents.
- AG Grid is downloaded only on a wide screen (`useLaptop` + `next/dynamic`), so it never reaches a phone. While it
  loads: `GridLoading`. If it fails: `LoadBoundary` shows the plain list instead. Empty: the grid's own empty message.
