import { NextResponse } from "next/server";
import { getDb, isDatabaseConfigured } from "@/lib/shared/db";
import { today } from "@/lib/shared/clock";
import { getBuildCommitSha } from "@/lib/shared/version";

/**
 * Health check. Owner: Person 1.
 * A free uptime pinger opens this every 10 minutes: that keeps the Render service awake and stops Supabase
 * pausing the project. Keep it fast: exactly one light query (SELECT 1), no other work, never cached.
 * 200 = app and database fine. 503 = database missing or unreachable.
 */
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

async function check() {
  const base = { demoToday: today(), buildCommit: getBuildCommitSha() };
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, ...base, database: "not configured" }, { status: 503, headers: NO_STORE });
  }
  const started = Date.now();
  try {
    await getDb().$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, ...base, database: "ok", latencyMs: Date.now() - started }, { headers: NO_STORE });
  } catch (error) {
    return NextResponse.json(
      { ok: false, ...base, database: "unreachable", error: error instanceof Error ? error.message.split("\n")[0] : "unknown" },
      { status: 503, headers: NO_STORE },
    );
  }
}

export async function GET() {
  return check();
}

/** Some uptime pingers send HEAD instead of GET: same check, no body. */
export async function HEAD() {
  const res = await check();
  return new NextResponse(null, { status: res.status, headers: NO_STORE });
}
