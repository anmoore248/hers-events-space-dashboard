"use server";

import { and, eq, inArray, max } from "drizzle-orm";
import { atomic, db } from "@/lib/db";
import { eventLinks, events } from "@/lib/db/schema";
import { localInputToUtc } from "@/lib/time";
import type { ActionResult } from "@/lib/action-result";
import { eventLinkSchema, type EventLinkInput } from "@/lib/schemas";
import { done, fail, friendly, isUuid, NOT_FOUND, NOT_STAFF, parse, staffOnly } from "./_helpers";

export async function saveEventLink(eventId: string, linkId: string | null, values: EventLinkInput): Promise<ActionResult> {
  if (!(await staffOnly())) return fail(NOT_STAFF);
  if (!isUuid(eventId) || (linkId && !isUuid(linkId))) return fail(NOT_FOUND);
  const v = parse(eventLinkSchema, values);
  if ("error" in v) return fail(v.error);
  const [event] = await db.select({ timeZone: events.timeZone }).from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) return fail(NOT_FOUND);

  const data = {
    label: v.data.label,
    url: v.data.url,
    visibleFrom: localInputToUtc(v.data.visibleFrom, event.timeZone),
    visibleUntil: localInputToUtc(v.data.visibleUntil, event.timeZone),
  };
  try {
    if (linkId) {
      const r = await db.update(eventLinks).set(data).where(and(eq(eventLinks.id, linkId), eq(eventLinks.eventId, eventId))).returning({ id: eventLinks.id });
      if (!r.length) return fail(NOT_FOUND);
    } else {
      const [row] = await db.select({ m: max(eventLinks.displayOrder) }).from(eventLinks).where(eq(eventLinks.eventId, eventId));
      await db.insert(eventLinks).values({ ...data, eventId, displayOrder: (row?.m ?? -1) + 1 });
    }
    return done();
  } catch (err) {
    return friendly(err);
  }
}

export async function deleteEventLink(eventId: string, linkId: string): Promise<ActionResult> {
  if (!(await staffOnly())) return fail(NOT_STAFF);
  if (!isUuid(eventId) || !isUuid(linkId)) return fail(NOT_FOUND);
  await db.delete(eventLinks).where(and(eq(eventLinks.id, linkId), eq(eventLinks.eventId, eventId)));
  return done();
}

export async function reorderEventLinks(eventId: string, ids: string[]): Promise<ActionResult> {
  if (!(await staffOnly())) return fail(NOT_STAFF);
  if (!isUuid(eventId) || !ids.every(isUuid)) return fail(NOT_FOUND);
  const own = await db.select({ id: eventLinks.id }).from(eventLinks).where(and(eq(eventLinks.eventId, eventId), inArray(eventLinks.id, ids)));
  if (own.length !== ids.length) return fail(NOT_FOUND);
  await atomic(ids.map((id, i) => db.update(eventLinks).set({ displayOrder: i }).where(eq(eventLinks.id, id))));
  return done();
}
