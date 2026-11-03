# app/store/

**Owner:** Person 1. Task P1-9. The buyer's side: Loop Audio's shop. Server code here may import `@/lib/paypal`.

| Path | What it does |
|------|--------------|
| `page.tsx` | The product grid. "Buy with PayPal" posts to `checkout`. Without PayPal set up, it says so and the buttons are off. |
| `checkout/route.ts` | Creates the order and a PayPal order (custom_id = the visitor's storeId), records the attempt, sends the buyer to PayPal. |
| `return/route.ts` | The buyer is back: capture now, record gross, fee and net, then `paid`. The webhook confirms it later. |
| `cancel/route.ts` | The buyer cancelled: nothing paid, the order stays unfinished. |
| `paid/page.tsx` | What was paid, PayPal's fee, what arrives. |
| `fake-paypal/` | Fake mode only: a page that stands in for PayPal's approval (and says so). 404 otherwise. |
