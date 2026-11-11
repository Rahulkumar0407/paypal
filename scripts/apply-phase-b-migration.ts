import "dotenv/config";
import { Pool } from "pg";

async function main() {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("No database URL");
  const pool = new Pool({ connectionString: url });
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE "Due" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'USER',
      ADD COLUMN IF NOT EXISTS "sourceDetail" TEXT,
      ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    `);
    await client.query(`
      ALTER TABLE "LedgerEntry" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'USER',
      ADD COLUMN IF NOT EXISTS "sourceDetail" TEXT,
      ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    `);
    await client.query(`
      ALTER TABLE "Payee" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'USER',
      ADD COLUMN IF NOT EXISTS "sourceDetail" TEXT,
      ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    `);
    await client.query(`
      ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "openingBalanceSource" TEXT NOT NULL DEFAULT 'USER',
      ADD COLUMN IF NOT EXISTS "openingBalanceUpdatedAt" TIMESTAMP(3);
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS "Due_storeId_source_idx" ON "Due"("storeId", "source");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "LedgerEntry_storeId_source_idx" ON "LedgerEntry"("storeId", "source");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "Payee_storeId_source_idx" ON "Payee"("storeId", "source");`);
    console.log("Migration applied.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
