import "server-only";
import { createNeonAuth } from "@neondatabase/auth/next/server";

/**
 * Neon Auth (doc §5): managed Better Auth. Neon runs the auth server and keeps
 * users, sessions and hashed passwords in this database's neon_auth schema, so
 * every Neon branch has its own accounts.
 *
 * This instance acts as the person making the request: it forwards their
 * cookies to Neon Auth and writes the login cookies Neon sends back (sign-in,
 * sign-out, change password). Work done on someone else's account (creating
 * accounts, setting passwords, deactivating) goes through lib/auth/admin.ts.
 *
 * Configured in the Neon Console, not here: email + password on, public
 * sign-up OFF (accounts are only created by the platform's access-key sign-up
 * and staff invites in lib/actions/auth.ts), and the app's addresses as trusted domains.
 */
let instance: ReturnType<typeof createNeonAuth> | undefined;

function create() {
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const secret = process.env.NEON_AUTH_COOKIE_SECRET;
  if (!baseUrl || !secret) throw new Error("NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET are not set. Copy .env.example to .env and fill it in.");
  return createNeonAuth({
    baseUrl,
    // The signed session cache cookie. Kept short: the app also checks the
    // account on every request (lib/auth/session.ts), so deactivation is immediate.
    cookies: { secret, sessionDataTtl: 60 },
  });
}

/** Created on first use, so `next build` works without auth settings. */
export const auth = new Proxy({} as ReturnType<typeof createNeonAuth>, {
  get(_target, prop) {
    instance ??= create();
    return Reflect.get(instance, prop, instance);
  },
});
