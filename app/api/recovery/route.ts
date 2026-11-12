import { NextResponse } from "next/server";
import { getVisitorStoreId } from "@/lib/demo";
import { findRecoveryCandidates } from "@/lib/recovery";

/** Unpaid and abandoned checkouts the reminder helper would act on, from the visitor's own copy. */
export async function GET() {
  const storeId = await getVisitorStoreId();
  return NextResponse.json({ candidates: await findRecoveryCandidates(storeId) });
}
