import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getVisitorStoreId } from "@/lib/demo";
import { answerQuestion } from "@/lib/ai";

/** Owner: Person 4. Ask chat. TODO(Person 4, P4-1): streaming, tool calling, per-visitor rate limit. */
const body = z.object({ question: z.string().trim().min(1).max(300) });

export async function POST(request: NextRequest) {
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Send a question of up to 300 characters." }, { status: 400 });
  }
  const storeId = await getVisitorStoreId();
  return NextResponse.json({ answer: await answerQuestion(storeId, parsed.data.question) });
}
