"use server";

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { enrollments, events, subcommitteeMembers, subcommittees } from "@/lib/db/schema";
import type { ActionResult } from "@/lib/action-result";
import { subcommitteeSchema, type SubcommitteeInput } from "@/lib/schemas";
import { done, fail, friendly, isUuid, NOT_FOUND, NOT_STAFF, parse, staffOnly } from "./_helpers";

export async function saveSubcommittee(eventId: string, subcommitteeId: string | null, values: SubcommitteeInput): Promise<ActionResult> {
  if (!(await staffOnly())) return fail(NOT_STAFF);
  if (!isUuid(eventId) || (subcommitteeId && !isUuid(subcommitteeId))) return fail(NOT_FOUND);
  const v = parse(subcommitteeSchema, values);
  if ("error" in v) return fail(v.error);
  const [event] = await db.select({ id: events.id }).from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) return fail(NOT_FOUND);

  // No near-duplicates: names are unique per event, ignoring case.
  const [clash] = await db
    .select({ id: subcommittees.id })
    .from(subcommittees)
    .where(and(eq(subcommittees.eventId, eventId), sql`lower(${subcommittees.name}) = ${v.data.name.toLowerCase()}`))
    .limit(1);
  if (clash && clash.id !== subcommitteeId) return fail(`This event already has a subcommittee called “${v.data.name}”.`);

  const data = { name: v.data.name, groupmeLink: v.data.groupMeUrl };
  try {
    if (subcommitteeId) {
      const r = await db.update(subcommittees).set(data).where(and(eq(subcommittees.id, subcommitteeId), eq(subcommittees.eventId, eventId))).returning({ id: subcommittees.id });
      if (!r.length) return fail(NOT_FOUND);
    } else {
      await db.insert(subcommittees).values({ ...data, eventId });
    }
    return done();
  } catch (err) {
    return friendly(err);
  }
}

export async function deleteSubcommittee(eventId: string, subcommitteeId: string): Promise<ActionResult> {
  if (!(await staffOnly())) return fail(NOT_STAFF);
  if (!isUuid(eventId) || !isUuid(subcommitteeId)) return fail(NOT_FOUND);
  await db.delete(subcommittees).where(and(eq(subcommittees.id, subcommitteeId), eq(subcommittees.eventId, eventId)));
  return done();
}

async function check(eventId: string, subcommitteeId: string, enrollmentId: string) {
  if (!isUuid(eventId) || !isUuid(subcommitteeId) || !isUuid(enrollmentId)) return false;
  const [sub] = await db.select({ id: subcommittees.id }).from(subcommittees).where(and(eq(subcommittees.id, subcommitteeId), eq(subcommittees.eventId, eventId))).limit(1);
  const [en] = await db.select({ id: enrollments.id }).from(enrollments).where(and(eq(enrollments.id, enrollmentId), eq(enrollments.eventId, eventId))).limit(1);
  return !!sub && !!en;
}

export async function addSubcommitteeMember(eventId: string, subcommitteeId: string, enrollmentId: string): Promise<ActionResult> {
  if (!(await staffOnly())) return fail(NOT_STAFF);
  if (!(await check(eventId, subcommitteeId, enrollmentId))) return fail(NOT_FOUND);
  await db.insert(subcommitteeMembers).values({ subcommitteeId, enrollmentId }).onConflictDoNothing();
  return done();
}

export async function removeSubcommitteeMember(eventId: string, subcommitteeId: string, enrollmentId: string): Promise<ActionResult> {
  if (!(await staffOnly())) return fail(NOT_STAFF);
  if (!(await check(eventId, subcommitteeId, enrollmentId))) return fail(NOT_FOUND);
  await db
    .delete(subcommitteeMembers)
    .where(and(eq(subcommitteeMembers.subcommitteeId, subcommitteeId), eq(subcommitteeMembers.enrollmentId, enrollmentId)));
  return done();
}
