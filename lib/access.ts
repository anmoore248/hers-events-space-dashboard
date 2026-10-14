import { getEvent, type Access } from "./mock-data";

/**
 * The one shared access check (doc §4.1). Every event page and server action
 * calls this. Replace the mock body with: look up the session (Better Auth),
 * staff → "full"; no active enrollment → "none"; past expiry → "read-only".
 * Hiding a form is never enough on its own — server actions must call this too.
 */
export async function getEventAccess(eventId: string): Promise<Access> {
  const event = getEvent(eventId);
  if (!event) return "none";
  return event.status === "Expired" ? "read-only" : "full";
}
