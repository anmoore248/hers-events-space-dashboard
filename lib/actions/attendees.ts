"use server";

import { and, eq, inArray } from "drizzle-orm";
import { atomic, db } from "@/lib/db";
import { enrollments, events, subcommitteeMembers, subcommittees, user } from "@/lib/db/schema";
import { ACTIONS, activityInsert, logActivity } from "@/lib/activity";
import { buildImportPreview, unknownSubcommittees } from "@/lib/import";
import type { ActionResult } from "@/lib/action-result";
import { addAttendeeSchema, attendeeSchema, type AddAttendeeInput, type AttendeeInput } from "@/lib/schemas";
import { done, fail, friendly, isUuid, NOT_FOUND, NOT_STAFF, parse, staffOnly } from "./_helpers";

const MAX_IMPORT_BYTES = 2_000_000;

/**
 * CSV import (doc §9). The file is checked again here with the same rules as
 * the preview. New rows become invitations; existing guests are never
 * overwritten; unknown subcommittee names follow staff's choice in `mapping`.
 */
export async function importAttendees(eventId: string, csvText: string, mapping: Record<string, string>): Promise<ActionResult<{ imported: number; skipped: number }>> {
  const me = await staffOnly();
  if (!me) return fail(NOT_STAFF);
  if (!isUuid(eventId)) return fail(NOT_FOUND);
  if (csvText.length > MAX_IMPORT_BYTES) return fail("That file is too large. Split it into smaller files.");
  const [event] = await db.select({ name: events.name }).from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) return fail(NOT_FOUND);

  const [existing, subs] = await Promise.all([
    db.select({ email: enrollments.invitedEmail }).from(enrollments).where(eq(enrollments.eventId, eventId)),
    db.select().from(subcommittees).where(eq(subcommittees.eventId, eventId)),
  ]);
  const rows = buildImportPreview(csvText, existing.map((e) => e.email), subs.map((s) => s.name));
  if (!rows) return fail("The file needs an email and a display_name column.");

  // Resolve unknown subcommittee names: map to an existing one, or create it.
  const byName = new Map(subs.map((s) => [s.name.toLowerCase(), s.id]));
  const toCreate: { id: string; name: string }[] = [];
  for (const name of unknownSubcommittees(rows, subs.map((s) => s.name))) {
    const choice = mapping[name];
    if (!choice) return fail(`Choose what to do with the subcommittee “${name}”.`);
    if (choice === "__create") {
      const id = crypto.randomUUID();
      toCreate.push({ id, name });
      byName.set(name.toLowerCase(), id);
    } else {
      const target = byName.get(choice.toLowerCase());
      if (!target) return fail(`“${choice}” isn't a subcommittee of this event.`);
      byName.set(name.toLowerCase(), target);
    }
  }

  const fresh = rows.filter((r) => r.kind === "new" || r.kind === "unknown-sub");
  if (!fresh.length) return fail("There are no new attendees in this file.");

  const newEnrollments = fresh.map((r) => ({
    id: crypto.randomUUID(),
    eventId,
    invitedEmail: r.email,
    displayName: r.name,
    title: r.title ?? null,
    organization: r.organization ?? null,
    linkedin: r.linkedin ?? null,
  }));
  const memberships = fresh.flatMap((r, i) =>
    [...new Set(r.subs.map((s) => byName.get(s.toLowerCase())).filter((x): x is string => !!x))].map((subcommitteeId) => ({
      subcommitteeId,
      enrollmentId: newEnrollments[i].id,
    })),
  );

  try {
    await atomic([
      ...(toCreate.length ? [db.insert(subcommittees).values(toCreate.map((s) => ({ ...s, eventId })))] : []),
      // ON CONFLICT DO NOTHING: anyone added since the preview is kept as they are.
      db.insert(enrollments).values(newEnrollments).onConflictDoNothing(),
      ...(memberships.length ? [db.insert(subcommitteeMembers).values(memberships).onConflictDoNothing()] : []),
      activityInsert({
        actorId: me.id,
        action: ACTIONS.imported,
        details: `${fresh.length} new to ${event.name}${toCreate.length ? `; created ${toCreate.map((s) => s.name).join(", ")}` : ""}`,
        eventId,
      }),
    ]);
  } catch (err) {
    return friendly(err, "The import didn't finish. Nothing was saved. Please try again.");
  }
  return done({ imported: fresh.length, skipped: rows.length - fresh.length });
}

export async function addAttendee(eventId: string, values: AddAttendeeInput): Promise<ActionResult> {
  if (!(await staffOnly())) return fail(NOT_STAFF);
  if (!isUuid(eventId)) return fail(NOT_FOUND);
  const v = parse(addAttendeeSchema, values);
  if ("error" in v) return fail(v.error);
  const [event] = await db.select({ id: events.id }).from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) return fail(NOT_FOUND);
  const [dupe] = await db.select({ id: enrollments.id }).from(enrollments).where(and(eq(enrollments.eventId, eventId), eq(enrollments.invitedEmail, v.data.email))).limit(1);
  if (dupe) return fail(`${v.data.email} is already on this event's guest list.`);
  await db.insert(enrollments).values({
    eventId,
    invitedEmail: v.data.email,
    displayName: v.data.displayName,
    title: v.data.title || null,
    organization: v.data.organization || null,
  });
  return done();
}

/** Staff can edit any attendee's profile at any time (doc §10). */
export async function updateAttendee(eventId: string, enrollmentId: string, values: AttendeeInput): Promise<ActionResult> {
  if (!(await staffOnly())) return fail(NOT_STAFF);
  if (!isUuid(eventId) || !isUuid(enrollmentId)) return fail(NOT_FOUND);
  const v = parse(attendeeSchema, values);
  if ("error" in v) return fail(v.error);
  const [en] = await db.select().from(enrollments).where(and(eq(enrollments.id, enrollmentId), eq(enrollments.eventId, eventId))).limit(1);
  if (!en) return fail(NOT_FOUND);

  // Signed-up attendees' emails are their login emails: those change from People (doc §5.6).
  const email = en.userId ? en.invitedEmail : v.data.email;
  if (email !== en.invitedEmail) {
    const [dupe] = await db.select({ id: enrollments.id }).from(enrollments).where(and(eq(enrollments.eventId, eventId), eq(enrollments.invitedEmail, email))).limit(1);
    if (dupe) return fail(`${email} is already on this event's guest list.`);
  }

  const subIds = [...new Set(v.data.subcommitteeIds)];
  if (subIds.length) {
    if (!subIds.every(isUuid)) return fail(NOT_FOUND);
    const own = await db.select({ id: subcommittees.id }).from(subcommittees).where(and(eq(subcommittees.eventId, eventId), inArray(subcommittees.id, subIds)));
    if (own.length !== subIds.length) return fail("Choose subcommittees from this event.");
  }

  try {
    await atomic([
      db
        .update(enrollments)
        .set({
          displayName: v.data.displayName,
          invitedEmail: email,
          title: v.data.title || null,
          organization: v.data.organization || null,
          linkedin: v.data.linkedin || null,
          individualExpiry: v.data.individualExpiry || null,
        })
        .where(eq(enrollments.id, enrollmentId)),
      db.delete(subcommitteeMembers).where(eq(subcommitteeMembers.enrollmentId, enrollmentId)),
      ...(subIds.length ? [db.insert(subcommitteeMembers).values(subIds.map((subcommitteeId) => ({ subcommitteeId, enrollmentId })))] : []),
    ]);
  } catch (err) {
    return friendly(err);
  }
  return done();
}

async function setStatus(eventId: string, enrollmentId: string, revoke: boolean): Promise<ActionResult> {
  const me = await staffOnly();
  if (!me) return fail(NOT_STAFF);
  if (!isUuid(eventId) || !isUuid(enrollmentId)) return fail(NOT_FOUND);
  const [row] = await db
    .select({ en: enrollments, eventName: events.name, email: user.email })
    .from(enrollments)
    .innerJoin(events, eq(events.id, enrollments.eventId))
    .leftJoin(user, eq(user.id, enrollments.userId))
    .where(and(eq(enrollments.id, enrollmentId), eq(enrollments.eventId, eventId)))
    .limit(1);
  if (!row) return fail(NOT_FOUND);

  const status = revoke ? "revoked" : row.en.userId ? "active" : "invited";
  await db.update(enrollments).set({ status }).where(eq(enrollments.id, enrollmentId));
  await logActivity({
    actorId: me.id,
    action: revoke ? ACTIONS.revoked : ACTIONS.restored,
    details: `${row.en.displayName} (${row.en.invitedEmail}) ${revoke ? "from" : "to"} ${row.eventName}`,
    eventId,
  });
  return done();
}

export async function revokeEnrollment(eventId: string, enrollmentId: string) {
  return setStatus(eventId, enrollmentId, true);
}

export async function restoreEnrollment(eventId: string, enrollmentId: string) {
  return setStatus(eventId, enrollmentId, false);
}

