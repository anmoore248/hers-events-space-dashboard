import "server-only";
import { cache } from "react";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { enrollments, events } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { dateString, todayIn } from "@/lib/time";
import type { Access } from "./types";

/**
 * The one shared access check (doc §4.1). Every event page and every event
 * action asks it: what can this person do in this event?
 *   staff → "full"
 *   active enrollment, on or before its expiry → "full"
 *   active enrollment, after its expiry → "read-only"
 *   no enrollment, invited only, or revoked → "none"
 * Expiry is checked on every request, so an open session can't outlast the event.
 * Hiding a form is never enough on its own: server actions call this too.
 */
export const getEventAccess = cache(async (eventId: string): Promise<Access> => {
  if (!isUuid(eventId)) return "none";
  const user = await getCurrentUser();
  if (!user) return "none";
  const [event] = await db.select({ id: events.id, timeZone: events.timeZone, accessExpiry: events.accessExpiry }).from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) return "none";
  if (user.role === "staff") return "full";

  const [enrollment] = await db
    .select({ status: enrollments.status, individualExpiry: enrollments.individualExpiry })
    .from(enrollments)
    .where(and(eq(enrollments.eventId, eventId), eq(enrollments.userId, user.id)))
    .limit(1);
  if (!enrollment || enrollment.status !== "active") return "none";

  const expiry = dateString(enrollment.individualExpiry) ?? dateString(event.accessExpiry)!;
  return todayIn(event.timeZone) > expiry ? "read-only" : "full";
});

/** For server actions that change something in an event. */
export async function canChange(eventId: string) {
  return (await getEventAccess(eventId)) === "full";
}

export function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}
