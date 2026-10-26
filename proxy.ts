import { NextResponse, type NextRequest } from "next/server";
import { createNeonAuth } from "@neondatabase/auth/next/server";

/**
 * A quick first check before any page loads: no valid Neon Auth session on a
 * private page → /login. It also refreshes the session cookie when needed. The
 * real check (is the account active, is this person staff, can they see this
 * event) happens on the server for every page and action.
 */
let middleware: ((request: NextRequest) => Promise<NextResponse>) | undefined;

export function proxy(request: NextRequest) {
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const secret = process.env.NEON_AUTH_COOKIE_SECRET;
  if (!baseUrl || !secret) return NextResponse.redirect(new URL("/login", request.url));
  middleware ??= createNeonAuth({ baseUrl, cookies: { secret, sessionDataTtl: 60 } }).middleware({ loginUrl: "/login" });
  return middleware(request);
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/events/:path*", "/profile", "/account"],
};
