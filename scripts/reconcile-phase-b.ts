import "dotenv/config";
import { getDb } from "@/lib/shared/db";
import { createRealMerchantStore } from "@/lib/demo";
import { addLedgerEntry, addDue, updateOpeningBalance } from "@/lib/finance";
import { getForecast } from "@/lib/forecast";

async function main() {
  const storeId = `st_recon_${Date.now()}`;
  console.log("creating store", storeId);
  await createRealMerchantStore(storeId, {
    name: "Recon Merchant",
    whatYouSell: "Test goods",
    openingBalanceCents: 100000,
    minimumBalanceCents: 20000,
    tightMarginCents: 10000,
    timezone: "America/New_York",
  });
  // opening balance already set by create; ensure date
  await updateOpeningBalance(storeId, 100000, "2026-11-05", "USER", "recon");
  console.log("opening balance set");

  // historical sales: $50 on 2026-11-03 (IN)
  await addLedgerEntry(storeId, {
    occurredOn: "2026-11-03",
    direction: "IN",
    amountCents: 5000,
    category: "SALE",
    description: "Sale A",
  });
  // upcoming bill $30 on 2026-11-10
  await addDue(storeId, {
    payeeName: "Rent",
    kind: "BILL",
    dueOn: "2026-11-10",
    amountCents: 3000,
  });

  const f = await getForecast(storeId);
  console.log("STORE", storeId);
  console.log("OPENING", f.days[0].openingCents);
  console.log("DAY10 CLOSING", f.days.find((d) => d.date === "2026-11-10")?.closingCents);
  console.log("FIRST SHORTFALL", f.firstShortfall);
  console.log("CONFIDENCE", f.confidence, f.confidenceReason);

  // cleanup
  const db = getDb();
  await db.store.delete({ where: { id: storeId } });
  console.log("CLEANED UP");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});