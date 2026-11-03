import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { ensureStore, getVisitorStoreId } from "@/lib/demo";
import { answerQuestion } from "@/lib/ai";

/** Ask chat: one question, answered from the visitor's own numbers. Rate-limited per visitor inside lib/ai. */
const body = z.object({ question: z.string().trim().min(1).max(300) });

export async function POST(request: NextRequest) {
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Send a question of up to 300 characters." }, { status: 400 });
  const storeId = await getVisitorStoreId();
  try {
    await ensureStore(storeId);
    return NextResponse.json({ answer: await answerQuestion(storeId, parsed.data.question) });
  } catch (error) {
    console.error("[ask] could not answer:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Couldn't read your numbers just now." }, { status: 503 });
  }
}
