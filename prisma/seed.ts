/**
 * `npm run db:reset` (also `npx prisma db seed`). Shared file; the logic lives in lib/demo (Person 3).
 *
 * Deletes EVERY demo copy in the database and recreates the local one ('st_local') from the seed.
 * Visitors' copies are recreated automatically the next time they open a page.
 * Run `npm run db:migrate` first on a new database.
 */
import "dotenv/config";
import { getDemoStoreStatus, resetAllStores } from "@/lib/demo";
import { getDb } from "@/lib/shared/db";
import { LOCAL_STORE_ID } from "@/lib/shared/visitor";
import { today } from "@/lib/shared/clock";

async function main() {
  const host = (() => {
    try {
      return new URL(process.env.DATABASE_URL ?? "").host;
    } catch {
      return "(DATABASE_URL not set)";
    }
  })();
  console.log(`Resetting demo data on ${host} for DEMO_TODAY=${today()} ...`);
  const { deleted, runId } = await resetAllStores();
  const status = await getDemoStoreStatus(LOCAL_STORE_ID);
  console.log(`Deleted ${deleted} store cop${deleted === 1 ? "y" : "ies"}. Created ${LOCAL_STORE_ID} (run ${runId}):`);
  console.log(`  ${status.counts.products} products, ${status.counts.orders} orders, ${status.counts.ledgerEntries} history entries, ${status.counts.dues} dues.`);
}

main()
  .then(() => getDb().$disconnect())
  .catch(async (error) => {
    console.error(error instanceof Error ? error.message : error);
    await getDb()
      .$disconnect()
      .catch(() => undefined);
    process.exit(1);
  });
