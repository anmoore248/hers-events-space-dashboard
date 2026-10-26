import "server-only";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { relations } from "./relations";
import * as schema from "./schema";

/**
 * One database connection for the whole app.
 *
 * Neon (production, deploy previews, your Neon dev branch) uses Neon's
 * serverless HTTP driver, which suits Netlify's short-lived functions.
 * For an ordinary Postgres server (offline work, Docker), set
 * DATABASE_DRIVER=pg; a localhost DATABASE_URL picks it automatically.
 */
export function usesPg(url = process.env.DATABASE_URL ?? "") {
  if (process.env.DATABASE_DRIVER) return process.env.DATABASE_DRIVER === "pg";
  try {
    const host = new URL(url).hostname;
    return host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
}

const neonDb = (url: string) => drizzleNeon({ connection: url, relations });

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
  if (usesPg(url)) return drizzlePg({ connection: url, relations }) as unknown as ReturnType<typeof neonDb>;
  return neonDb(url);
}

type Database = ReturnType<typeof createDb>;
const globalForDb = globalThis as unknown as { hersDb?: Database };

/** Connects on first use, so `next build` works without database settings. */
function instance(): Database {
  globalForDb.hersDb ??= createDb();
  return globalForDb.hersDb;
}

export const db = new Proxy({} as Database, {
  get(_target, prop) {
    const real = instance();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export type Db = Database;
export { schema };

/**
 * Runs several writes all-or-nothing on Neon: db.batch sends them as one
 * HTTP transaction. On a plain Postgres server (DATABASE_DRIVER=pg, local
 * development only) they run one after another without a transaction.
 */
export async function atomic(queries: { execute: () => Promise<unknown> }[]) {
  if (!queries.length) return;
  if (!usesPg()) {
    await (db as unknown as { batch: (q: unknown) => Promise<unknown> }).batch(queries);
    return;
  }
  for (const q of queries) await q.execute();
}
