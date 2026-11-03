import { NextResponse, type NextRequest } from "next/server";
import { recordCancelled } from "@/lib/store";

/** The buyer cancelled at PayPal. Nothing was paid; the order stays unfinished. */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (token) await recordCancelled(token).catch(() => null);
  return NextResponse.redirect(new URL("/store?cancelled=1", request.url), 303);
}
