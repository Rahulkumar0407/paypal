import "dotenv/config";
import { getDb } from "@/lib/shared/db";
async function main() {
  console.log("start");
  const db = getDb();
  const r = await db.$queryRaw`SELECT 1`;
  console.log("ok", r);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
