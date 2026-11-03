import { NextResponse } from "next/server";
import { getVisitorStoreId } from "@/lib/demo";
import { listInbox } from "@/lib/guard";

/** The visitor's approval inbox: escalations waiting for them, then every other decision. */
export async function GET() {
  const storeId = await getVisitorStoreId();
  return NextResponse.json({ inbox: await listInbox(storeId) });
}

/** Proposals are made on the server by NeverShort's own screens and agents (never from a browser), so there is no POST. */
export async function POST() {
  return NextResponse.json({ error: "Proposals come from NeverShort's own screens, not this API." }, { status: 405 });
}
