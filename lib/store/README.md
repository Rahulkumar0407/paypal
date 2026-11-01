# lib/store/

**Owner:** Person 2.

**What goes here:** reading the visitor's store data that several screens need: the catalogue (store page),
recent orders and payments (dashboard, Person 4), and the store's settings (settings page, Guard rule 6).

**Must export (from `index.ts`):** `listProducts(storeId)`, `listRecentOrders(storeId, limit)`, `getStoreSettings(storeId)`.

**Now:** stubs returning `mocks/store.ts`, marked `TODO(Person 2)`.
