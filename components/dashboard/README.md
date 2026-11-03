# components/dashboard/

**Owner:** Person 2. Task P2-5.

**What goes here:** the laptop dashboard's data grid: AG Grid Community only (never `ag-grid-enterprise`), with
sorting, filtering and custom cell renderers for money, status words and referee cards, styled with our tokens.
Load it with dynamic import on `/dashboard` only.

**Must export:** `OrdersTable({ orders })` (laptop) and `OrdersList({ orders })` (phone).

**Now:** a plain HTML table placeholder, marked `TODO(Person 4)`.
