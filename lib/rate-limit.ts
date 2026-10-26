import "server-only";
import { headers } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/db/schema";

/** The visitor's IP address (Netlify sets x-nf-client-connection-ip). */
export async function clientIp() {
  const h = await headers();
  return h.get("x-nf-client-connection-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/**
 * Fixed-window counters in the rate_limit table, for the platform's
 * own server actions. Each hit is one atomic upsert, so parallel requests
 * can't slip past the limit.
 */
async function hit(key: string, windowSeconds: number) {
  const id = `hers:${key}`;
  const now = Date.now();
  const cutoff = now - windowSeconds * 1000;
  const [row] = await db
    .insert(rateLimit)
    .values({ id, key: id, count: 1, lastRequest: now })
    .onConflictDoUpdate({
      target: rateLimit.key,
      set: {
        count: sql`case when ${rateLimit.lastRequest} < ${cutoff} then 1 else ${rateLimit.count} + 1 end`,
        lastRequest: sql`case when ${rateLimit.lastRequest} < ${cutoff} then ${now} else ${rateLimit.lastRequest} end`,
      },
    })
    .returning({ count: rateLimit.count });
  return row.count;
}

/** Counts this attempt; false once there have been more than `max` in the window. */
export async function allow(key: string, max: number, windowSeconds: number) {
  return (await hit(key, windowSeconds)) <= max;
}

/** True when `key` has already reached `max` failures in the window (doesn't count anything). */
export async function blocked(key: string, max: number, windowSeconds: number) {
  const id = `hers:${key}`;
  const [row] = await db.select().from(rateLimit).where(eq(rateLimit.key, id)).limit(1);
  return !!row && row.lastRequest >= Date.now() - windowSeconds * 1000 && row.count >= max;
}

/** Records a failure (e.g. a wrong password). */
export async function recordFailure(key: string, windowSeconds: number) {
  await hit(key, windowSeconds);
}

export const TOO_MANY = "Too many attempts. Please wait a few minutes and try again.";
