"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { announcementReads, announcements, events } from "@/lib/db/schema";
import type { ActionResult } from "@/lib/action-result";
import { announcementSchema, type AnnouncementInput } from "@/lib/schemas";
import { done, fail, friendly, isUuid, NOT_FOUND, NOT_STAFF, parse, staffOnly } from "./_helpers";

/** In-app only: the platform sends no email (doc §12). Editing marks it unread again for everyone. */
export async function saveAnnouncement(eventId: string, announcementId: string | null, values: AnnouncementInput): Promise<ActionResult> {
  const me = await staffOnly();
  if (!me) return fail(NOT_STAFF);
  if (!isUuid(eventId) || (announcementId && !isUuid(announcementId))) return fail(NOT_FOUND);
  const v = parse(announcementSchema, values);
  if ("error" in v) return fail(v.error);
  const [event] = await db.select({ id: events.id }).from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) return fail(NOT_FOUND);

  const data = { title: v.data.title, body: v.data.message, pinned: v.data.pinned };
  try {
    if (announcementId) {
      const r = await db.update(announcements).set(data).where(and(eq(announcements.id, announcementId), eq(announcements.eventId, eventId))).returning({ id: announcements.id });
      if (!r.length) return fail(NOT_FOUND);
      await db.delete(announcementReads).where(eq(announcementReads.announcementId, announcementId));
    } else {
      await db.insert(announcements).values({ ...data, eventId, sentBy: me.id });
    }
    return done();
  } catch (err) {
    return friendly(err);
  }
}

export async function setAnnouncementPinned(eventId: string, announcementId: string, pinned: boolean): Promise<ActionResult> {
  if (!(await staffOnly())) return fail(NOT_STAFF);
  if (!isUuid(eventId) || !isUuid(announcementId)) return fail(NOT_FOUND);
  const r = await db.update(announcements).set({ pinned }).where(and(eq(announcements.id, announcementId), eq(announcements.eventId, eventId))).returning({ id: announcements.id });
  if (!r.length) return fail(NOT_FOUND);
  return done();
}

export async function deleteAnnouncement(eventId: string, announcementId: string): Promise<ActionResult> {
  if (!(await staffOnly())) return fail(NOT_STAFF);
  if (!isUuid(eventId) || !isUuid(announcementId)) return fail(NOT_FOUND);
  await db.delete(announcements).where(and(eq(announcements.id, announcementId), eq(announcements.eventId, eventId)));
  return done();
}
