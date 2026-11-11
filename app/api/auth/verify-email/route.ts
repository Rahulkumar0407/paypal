import { NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ ok: false, message: "Missing token." }, { status: 400 });
  }
  const result = await verifyEmailToken(token);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
