import { NextResponse } from "next/server";
import { getVisitorStoreId } from "@/lib/demo";
import { findRecoveryCandidates } from "@/lib/recovery";

/** Owner: Person 3. Abandoned and failed checkouts (stub data until P3-2). */
export async function GET() {
  const storeId = await getVisitorStoreId();
  return NextResponse.json({ candidates: await findRecoveryCandidates(storeId) });
}
