import { NextResponse, type NextRequest } from "next/server";
import { isStoreId, newStoreId, STORE_COOKIE, STORE_COOKIE_MAX_AGE } from "@/lib/shared/visitor";

/**
 * Gives every new visitor their own demo store id (a cookie). Owner: Person 1.
 * No database work here: lib/demo creates the copy the first time a page needs it.
 */
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Strict Server-Side Authentication Gate:
  // Protected routes require an active session cookie. Unauthenticated visitors
  // receive an immediate HTTP 307 redirect to /login before any page or component evaluates.
  if (pathname.startsWith("/onboarding")) {
    const sessionToken = request.cookies.get("ns_session")?.value;
    if (!sessionToken) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (isStoreId(request.cookies.get(STORE_COOKIE)?.value)) return NextResponse.next();

  const storeId = newStoreId();
  // Put the cookie on this request too, so the very first page render already sees it.
  request.cookies.set(STORE_COOKIE, storeId);
  const response = NextResponse.next({ request: { headers: request.headers } });
  response.cookies.set(STORE_COOKIE, storeId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: STORE_COOKIE_MAX_AGE,
  });
  return response;
}

export const config = {
  // Pages and API routes; not static files, images, webhooks, health checks or pings (no visitor there).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|api/paypal/webhook|api/health|api/ping|.*\\.(?:png|jpg|svg|ico|webmanifest)$).*)"],
};
