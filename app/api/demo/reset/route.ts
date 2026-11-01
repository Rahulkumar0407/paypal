import { NextResponse, type NextRequest } from "next/server";
import { getVisitorStoreId, resetStore } from "@/lib/demo";

/** Owner: Person 3. Resets only the calling visitor's copy, then returns to the demo page. */
export async function POST(request: NextRequest) {
  const storeId = await getVisitorStoreId();
  const back = new URL("/demo", request.url);
  try {
    await resetStore(storeId);
    back.searchParams.set("reset", "done");
  } catch (error) {
    console.error(`[demo] reset failed for ${storeId}:`, error instanceof Error ? error.message : error);
    back.searchParams.set("reset", "failed");
  }
  return NextResponse.redirect(back, 303);
}
