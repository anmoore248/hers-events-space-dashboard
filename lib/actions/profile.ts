"use server";

import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { enrollments, events } from "@/lib/db/schema";
import { authAdmin } from "@/lib/auth/admin";
import { getCurrentUser } from "@/lib/auth/session";
import { dateString, todayIn } from "@/lib/time";
import type { ActionResult } from "@/lib/action-result";
import { profileSchema, type ProfileInput } from "@/lib/schemas";
import { done, fail, parse } from "./_helpers";

/**
 * One save updates the profile on every ACTIVE enrollment; past events keep
 * the details from the time (doc §10).
 */
export async function saveProfile(values: ProfileInput): Promise<ActionResult> {
  const me = await getCurrentUser();
  if (!me) return fail("Please sign in again.");
  const v = parse(profileSchema, values);
  if ("error" in v) return fail(v.error);

  const rows = await db
    .select({ id: enrollments.id, individualExpiry: enrollments.individualExpiry, accessExpiry: events.accessExpiry, timeZone: events.timeZone })
    .from(enrollments)
    .innerJoin(events, eq(events.id, enrollments.eventId))
    .where(and(eq(enrollments.userId, me.id), eq(enrollments.status, "active")));
  const open = rows.filter((r) => todayIn(r.timeZone) <= (dateString(r.individualExpiry) ?? dateString(r.accessExpiry)!));
  if (!open.length) return fail("All your events have ended, so your profile can no longer be changed.");

  await db
    .update(enrollments)
    .set({
      displayName: v.data.displayName,
      title: v.data.title || null,
      organization: v.data.organization || null,
      linkedin: v.data.linkedin || null,
    })
    .where(inArray(enrollments.id, open.map((r) => r.id)));
  await authAdmin.updateUser(me.id, { name: v.data.displayName });
  return done();
}
