import "dotenv/config";
import { getDb } from "@/lib/shared/db";
import { createRealMerchantStore } from "@/lib/demo";

import { existingLedgerKeys, importLedgerCsv, buildCsvPreview } from "@/lib/finance";

async function main() {
  const storeId = `st_csvrecon_${Date.now()}`;
  await createRealMerchantStore(storeId, {
    name: "CSV Recon",
    whatYouSell: "Test",
    openingBalanceCents: 0,
    minimumBalanceCents: 0,
    tightMarginCents: 0,
    timezone: "America/New_York",
  });
  const csv = "date,amount,description\n2026-11-01,10.00,Sale X\n2026-11-02,20.00,Sale Y";
  const keys1 = await existingLedgerKeys(storeId);
  const preview1 = buildCsvPreview(csv, { date: 0, amount: 1, description: 2 }, keys1);
  const r1 = await importLedgerCsv(storeId, preview1.rows, "test.csv");
  console.log("FIRST IMPORT", r1);
  const keys2 = await existingLedgerKeys(storeId);
  const preview2 = buildCsvPreview(csv, { date: 0, amount: 1, description: 2 }, keys2);
  const r2 = await importLedgerCsv(storeId, preview2.rows, "test.csv");
  console.log("SECOND IMPORT", r2);
  const db = getDb();
  const count = await db.ledgerEntry.count({ where: { storeId } });
  console.log("TOTAL ROWS", count);
  await db.store.delete({ where: { id: storeId } });
  console.log("CLEANED");
}
main().catch((e) => { console.error(e); process.exit(1); });