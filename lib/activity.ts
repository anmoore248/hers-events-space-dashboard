import "server-only";
import { db } from "@/lib/db";
import { activityLog } from "@/lib/db/schema";

/** The action names shown in the activity log and its filter (doc §15.1). */
export const ACTIONS = {
  passwordReset: "Password reset",
  newPassword: "New password set",
  staffInvited: "Staff invited",
  inviteCancelled: "Invite cancelled",
  staffJoined: "Staff joined",
  deactivated: "Account deactivated",
  reactivated: "Account reactivated",
  emailChanged: "Email changed",
  accountRetired: "Email freed up",
  revoked: "Enrollment revoked",
  restored: "Enrollment restored",
  eventCreated: "Event created",
  keyRegenerated: "Access key regenerated",
  imported: "Attendees imported",
  settingsChanged: "Settings changed",
  groupMeClosed: "GroupMe groups closed",
} as const;

export async function logActivity(entry: { actorId: string | null; action: string; details?: string; eventId?: string | null }) {
  await db.insert(activityLog).values({
    actorId: entry.actorId,
    action: entry.action,
    details: entry.details ?? "",
    eventId: entry.eventId ?? null,
  });
}

/** Same as logActivity but returns the query, for use inside atomic([...]). */
export function activityInsert(entry: { actorId: string | null; action: string; details?: string; eventId?: string | null }) {
  return db.insert(activityLog).values({
    actorId: entry.actorId,
    action: entry.action,
    details: entry.details ?? "",
    eventId: entry.eventId ?? null,
  });
}
