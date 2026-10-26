/**
 * Creates a one-time staff sign-up link (doc §5.5, §7).
 *
 *   npm run staff:invite -- you@hersnetwork.org
 *
 * Use it once to create the first staff account. It is also the recovery path
 * if every staff member is ever locked out: for an existing staff account it
 * clears the password, signs them out, and prints a link to set a new one.
 */
import "dotenv/config";
import { randomBytes, randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import pg from "pg";
import { createAuthAdmin, unusablePassword } from "../lib/auth/admin-client";

type Query = (text: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;

function connect(url: string): { query: Query; close: () => Promise<void> } {
  const host = new URL(url).hostname;
  const pgDriver = process.env.DATABASE_DRIVER ? process.env.DATABASE_DRIVER === "pg" : host === "localhost" || host === "127.0.0.1";
  if (pgDriver) {
    const client = new pg.Client({ connectionString: url });
    const ready = client.connect();
    return {
      query: async (text, params) => (await ready, (await client.query(text, params)).rows),
      close: () => client.end(),
    };
  }
  const sql = neon(url);
  return { query: (text, params) => sql.query(text, params) as Promise<Record<string, unknown>[]>, close: async () => {} };
}

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    console.error("Usage: npm run staff:invite -- name@hersnetwork.org");
    process.exit(1);
  }
  const url = process.env.DATABASE_URL;
  const base = (process.env.APP_URL ?? "").replace(/\/$/, "");
  const { NEON_AUTH_BASE_URL, NEON_AUTH_SERVICE_EMAIL, NEON_AUTH_SERVICE_PASSWORD } = process.env;
  if (!url || !base || !NEON_AUTH_BASE_URL || !NEON_AUTH_SERVICE_EMAIL || !NEON_AUTH_SERVICE_PASSWORD) {
    console.error("Set DATABASE_URL, APP_URL, NEON_AUTH_BASE_URL, NEON_AUTH_SERVICE_EMAIL and NEON_AUTH_SERVICE_PASSWORD in .env first.");
    process.exit(1);
  }
  const authAdmin = createAuthAdmin({
    baseUrl: NEON_AUTH_BASE_URL, email: NEON_AUTH_SERVICE_EMAIL, password: NEON_AUTH_SERVICE_PASSWORD, origin: () => base,
  });

  const db = connect(url);
  try {
    const [existing] = await db.query(
      `select u.id, u.name, m.role from neon_auth."user" u left join members m on m.user_id = u.id where u.email = $1`,
      [email],
    );
    let userId: string | null = null;
    if (existing) {
      if (existing.role !== "staff") throw new Error(`${email} belongs to an attendee account (or isn't a platform account). Use a different address.`);
      userId = existing.id as string;
      // Neon Auth keeps the password: replace it with one nobody knows, end every session, and reactivate.
      await authAdmin.setPassword(userId, unusablePassword());
      await authAdmin.signOutEverywhere(userId);
      await authAdmin.unban(userId);
      await db.query(`update members set password_cleared = true where user_id = $1`, [userId]);
      console.log(`Cleared the password for ${existing.name} (${email}) and signed them out.`);
    }
    await db.query(
      `update staff_invites set cancelled_at = now() where email = $1 and used_at is null and cancelled_at is null`,
      [email],
    );
    const token = randomBytes(32).toString("base64url");
    await db.query(
      `insert into staff_invites (id, token, email, user_id, expires_at) values ($1, $2, $3, $4, now() + interval '30 days')`,
      [randomUUID(), token, email, userId],
    );
    console.log(`\nOne-time staff sign-up link for ${email} (valid 30 days):\n\n  ${base}/staff-signup/${token}\n`);
  } finally {
    await db.close();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
