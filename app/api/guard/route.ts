import { NextResponse } from "next/server";
import { getVisitorStoreId } from "@/lib/demo";
import { listInbox } from "@/lib/guard";

/** Owner: Person 2. The approval inbox (stub data until P2-3). */
export async function GET() {
  const storeId = await getVisitorStoreId();
  return NextResponse.json({ inbox: await listInbox(storeId) });
}

/** TODO(Person 2, P2-3): validate an ActionProposal with zod, then submitProposal(). */
export async function POST() {
  return NextResponse.json({ error: "Submitting proposals arrives with the Margin Guard (task P2-3)." }, { status: 501 });
}
