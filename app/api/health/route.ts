import { NextResponse } from "next/server";
import { getDb, isDatabaseConfigured } from "@/lib/shared/db";
import { today } from "@/lib/shared/clock";

/**
 * Health check for Render and the daily Supabase keep-alive. Owner: Person 1.
 * Runs one real query, so calling it also keeps the Supabase project from pausing.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const base = { demoToday: today() };
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, ...base, database: "not configured" }, { status: 503 });
  }
  const started = Date.now();
  try {
    await getDb().$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, ...base, database: "ok", latencyMs: Date.now() - started });
  } catch (error) {
    return NextResponse.json(
      { ok: false, ...base, database: "unreachable", error: error instanceof Error ? error.message : "unknown" },
      { status: 503 },
    );
  }
}
