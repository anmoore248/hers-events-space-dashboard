import { auth } from "@/lib/auth";

/**
 * Neon Auth's endpoints, proxied through the app. The app signs people in,
 * creates accounts and changes passwords through its own server actions
 * (lib/actions), which check the guest list, rate-limit and write the activity
 * log. So only the two endpoints the app may need are open here; everything
 * else (admin endpoints, sign-up, update-user, direct sign-in) returns 404.
 *
 * Neon Auth itself is also reachable at NEON_AUTH_BASE_URL, which is why public
 * sign-up must be switched off in the Neon Console (see README).
 */
const OPEN = new Set(["/api/auth/get-session", "/api/auth/sign-out"]);
const notFound = () => new Response("Not found", { status: 404 });

type Context = { params: Promise<{ path: string[] }> };

export async function GET(request: Request, context: Context) {
  return OPEN.has(new URL(request.url).pathname) ? auth.handler().GET(request, context) : notFound();
}

export async function POST(request: Request, context: Context) {
  return OPEN.has(new URL(request.url).pathname) ? auth.handler().POST(request, context) : notFound();
}
