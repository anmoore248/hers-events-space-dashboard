import "server-only";
import type { Access } from "./types";
import { getEvent } from "./data";

/**
 * The one shared access check (doc §4.1). Every event page and every event
 * action asks it: what can this person do in this event?
 *   staff → "full"
 *   active enrollment, before its expiry → "full"
 *   active enrollment, after its expiry → "read-only"
 *   no enrollment, or revoked → "none"
 * Hiding a form is never enough on its own: server actions call this too.
 */
export async function getEventAccess(eventId: string): Promise<Access> {
  // TODO: read the Better Auth session and the person's enrollment for this event.
  const event = await getEvent(eventId);
  if (!event) return "none";
  return event.status === "Expired" ? "read-only" : "full";
}
