import { NextResponse } from "next/server";

/**
 * Lightweight ping endpoint for external uptime monitors (e.g. UptimeRobot, cron-job.org).
 * - Zero database queries (avoids Supabase pool exhaustion).
 * - Zero authentication requirements.
 * - Zero external API or PayPal dependencies.
 * - Zero sensitive data exposure.
 * Keeps Render free-tier containers warm every 10 minutes to minimize cold starts.
 */
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET() {
  return NextResponse.json({ ok: true, pong: true }, { headers: NO_STORE });
}

export async function HEAD() {
  return new NextResponse(null, { status: 200, headers: NO_STORE });
}
