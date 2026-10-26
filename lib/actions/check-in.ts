"use server";

import { and, count, eq, max, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { checkIns, checkInPoints, enrollments, events } from "@/lib/db/schema";
import type { ActionResult } from "@/lib/action-result";
import { checkInPointSchema, nameSchema, type CheckInPointInput } from "@/lib/schemas";
import { done, fail, friendly, isUuid, NOT_FOUND, NOT_STAFF, parse, staffOnly } from "./_helpers";

async function pointInEvent(eventId: string, pointId: string) {
  if (!isUuid(eventId) || !isUuid(pointId)) return false;
  const [p] = await db.select({ id: checkInPoints.id }).from(checkInPoints).where(and(eq(checkInPoints.id, pointId), eq(checkInPoints.eventId, eventId))).limit(1);
  return !!p;
}

/** A second tap by another staff member does nothing (unique point + enrollment, ON CONFLICT DO NOTHING). */
export async function checkIn(eventId: string, pointId: string, enrollmentId: string): Promise<ActionResult> {
  const me = await staffOnly();
  if (!me) return fail(NOT_STAFF);
  if (!(await pointInEvent(eventId, pointId)) || !isUuid(enrollmentId)) return fail(NOT_FOUND);
  const [en] = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(and(eq(enrollments.id, enrollmentId), eq(enrollments.eventId, eventId), ne(enrollments.status, "revoked")))
    .limit(1);
  if (!en) return fail("This person isn't on the guest list any more.");
  await db.insert(checkIns).values({ checkInPointId: pointId, enrollmentId, checkedInBy: me.id }).onConflictDoNothing();
  return done();
}

export async function undoCheckIn(eventId: string, pointId: string, enrollmentId: string): Promise<ActionResult> {
  if (!(await staffOnly())) return fail(NOT_STAFF);
  if (!(await pointInEvent(eventId, pointId)) || !isUuid(enrollmentId)) return fail(NOT_FOUND);
  await db.delete(checkIns).where(and(eq(checkIns.checkInPointId, pointId), eq(checkIns.enrollmentId, enrollmentId)));
  return done();
}

export async function addCheckInPoint(eventId: string, values: CheckInPointInput): Promise<ActionResult> {
  if (!(await staffOnly())) return fail(NOT_STAFF);
  if (!isUuid(eventId)) return fail(NOT_FOUND);
  const v = parse(checkInPointSchema, values);
  if ("error" in v) return fail(v.error);
  const [event] = await db.select({ id: events.id }).from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) return fail(NOT_FOUND);
  try {
    const [row] = await db.select({ m: max(checkInPoints.displayOrder) }).from(checkInPoints).where(eq(checkInPoints.eventId, eventId));
    await db.insert(checkInPoints).values({ eventId, label: v.data.label, pointDate: v.data.date || null, displayOrder: (row?.m ?? -1) + 1 });
    return done();
  } catch (err) {
    return friendly(err);
  }
}

export async function renameCheckInPoint(eventId: string, pointId: string, label: string): Promise<ActionResult> {
  if (!(await staffOnly())) return fail(NOT_STAFF);
  if (!(await pointInEvent(eventId, pointId))) return fail(NOT_FOUND);
  const v = parse(nameSchema, label);
  if ("error" in v) return fail(v.error);
  await db.update(checkInPoints).set({ label: v.data }).where(eq(checkInPoints.id, pointId));
  return done();
}

/** Deletes the point and its check-ins. Every event keeps at least one point. */
export async function deleteCheckInPoint(eventId: string, pointId: string): Promise<ActionResult> {
  if (!(await staffOnly())) return fail(NOT_STAFF);
  if (!(await pointInEvent(eventId, pointId))) return fail(NOT_FOUND);
  const [{ n }] = await db.select({ n: count() }).from(checkInPoints).where(eq(checkInPoints.eventId, eventId));
  if (n <= 1) return fail("Every event needs at least one check-in point. Rename this one instead.");
  await db.delete(checkInPoints).where(eq(checkInPoints.id, pointId));
  return done();
}
