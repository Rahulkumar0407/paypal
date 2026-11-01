import { NextResponse } from "next/server";
import { getVisitorStoreId } from "@/lib/demo";
import { listRiskFlags } from "@/lib/risk";

/** Owner: Person 4. Risk flags on recent orders (stub data until P4-3). */
export async function GET() {
  const storeId = await getVisitorStoreId();
  return NextResponse.json({ flags: await listRiskFlags(storeId) });
}
