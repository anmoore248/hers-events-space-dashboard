/**
 * Neon Auth's admin API (Better Auth's admin plugin), called as a dedicated
 * service account whose email and password live only in the server's
 * environment. That account is the only one with Neon Auth's "admin" role, so
 * nobody can reach the admin API from a browser, staff included: staff work
 * goes through the app's server actions, which check permissions and write the
 * activity log first.
 *
 * Plain fetch with no Next.js imports, so scripts/staff-invite.ts can use it too.
 */

export class AuthAdminError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
    this.name = "AuthAdminError";
  }
}

type Options = {
  baseUrl: string;
  email: string;
  password: string;
  /** Sent as the Origin header. Must be one of the trusted domains in Neon Auth. */
  origin: () => string | Promise<string>;
};

type NeonUser = { id: string; email: string; name: string };

/** Signs the service account in again well before Neon Auth's session would expire. */
const REUSE_MS = 10 * 60 * 1000;

export function createAuthAdmin(options: Options) {
  let session: { cookie: string; until: number } | null = null;

  const url = (path: string) => new URL(path, options.baseUrl.endsWith("/") ? options.baseUrl : `${options.baseUrl}/`);

  async function send(path: string, body: unknown, cookie?: string) {
    const res = await fetch(url(path), {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: await options.origin(), ...(cookie ? { Cookie: cookie } : {}) },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (!res.ok) {
      const message = typeof data?.message === "string" ? data.message : res.statusText;
      throw new AuthAdminError(message, res.status, typeof data?.code === "string" ? data.code : undefined);
    }
    return { res, data };
  }

  async function signIn() {
    const { res } = await send("sign-in/email", { email: options.email, password: options.password });
    const cookie = res.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; ");
    if (!cookie) throw new AuthAdminError("Neon Auth did not return a session for the service account.", 500);
    session = { cookie, until: Date.now() + REUSE_MS };
    return cookie;
  }

  /** Calls an admin endpoint, signing in first (and once more if the session has expired). */
  async function call(path: string, body: unknown) {
    const cookie = session && session.until > Date.now() ? session.cookie : await signIn();
    try {
      return (await send(path, body, cookie)).data;
    } catch (err) {
      if (!(err instanceof AuthAdminError) || err.status !== 401) throw err;
      return (await send(path, body, await signIn())).data;
    }
  }

  return {
    /** Creates an email + password account. Neon Auth hashes the password. */
    async createUser(input: { email: string; password: string; name: string }): Promise<NeonUser> {
      const data = await call("admin/create-user", { ...input, role: "user", data: { emailVerified: true } });
      return (data as { user: NeonUser }).user;
    },
    setPassword: (userId: string, newPassword: string) => call("admin/set-user-password", { userId, newPassword }),
    updateUser: (userId: string, data: { name?: string; email?: string }) => call("admin/update-user", { userId, data }),
    /** Blocks sign-in and ends every session. */
    ban: (userId: string, banReason: string) => call("admin/ban-user", { userId, banReason }),
    unban: (userId: string) => call("admin/unban-user", { userId }),
    signOutEverywhere: (userId: string) => call("admin/revoke-user-sessions", { userId }),
    removeUser: (userId: string) => call("admin/remove-user", { userId }),
  };
}

export type AuthAdmin = ReturnType<typeof createAuthAdmin>;

/** A password nobody knows, for accounts whose password staff cleared. */
export function unusablePassword() {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(48))).toString("base64url");
}
