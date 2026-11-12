import { NextResponse } from "next/server";
import { getVisitorStoreId } from "@/lib/demo";
import { listRiskFlags } from "@/lib/risk";

/** Risk flags on the visitor's recent orders. */
export async function GET() {
  const storeId = await getVisitorStoreId();
  return NextResponse.json({ flags: await listRiskFlags(storeId) });
}
