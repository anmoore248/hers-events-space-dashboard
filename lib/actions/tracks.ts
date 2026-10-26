"use server";

import { and, eq, inArray, max } from "drizzle-orm";
import { atomic, db } from "@/lib/db";
import { events, tracks } from "@/lib/db/schema";
import type { ActionResult } from "@/lib/action-result";
import { nameSchema } from "@/lib/schemas";
import { done, fail, friendly, isUuid, NOT_FOUND, NOT_STAFF, parse, staffOnly } from "./_helpers";

export async function addTrack(eventId: string, name: string): Promise<ActionResult> {
  if (!(await staffOnly())) return fail(NOT_STAFF);
  if (!isUuid(eventId)) return fail(NOT_FOUND);
  const v = parse(nameSchema, name);
  if ("error" in v) return fail(v.error);
  const [event] = await db.select({ id: events.id }).from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) return fail(NOT_FOUND);
  try {
    const [row] = await db.select({ m: max(tracks.displayOrder) }).from(tracks).where(eq(tracks.eventId, eventId));
    await db.insert(tracks).values({ eventId, name: v.data, displayOrder: (row?.m ?? -1) + 1 });
    return done();
  } catch (err) {
    return friendly(err);
  }
}

export async function renameTrack(eventId: string, trackId: string, name: string): Promise<ActionResult> {
  if (!(await staffOnly())) return fail(NOT_STAFF);
  if (!isUuid(eventId) || !isUuid(trackId)) return fail(NOT_FOUND);
  const v = parse(nameSchema, name);
  if ("error" in v) return fail(v.error);
  const r = await db.update(tracks).set({ name: v.data }).where(and(eq(tracks.id, trackId), eq(tracks.eventId, eventId))).returning({ id: tracks.id });
  if (!r.length) return fail(NOT_FOUND);
  return done();
}

/** Its sessions move to "no track" (shown to everyone): the foreign key is ON DELETE SET NULL. */
export async function deleteTrack(eventId: string, trackId: string): Promise<ActionResult> {
  if (!(await staffOnly())) return fail(NOT_STAFF);
  if (!isUuid(eventId) || !isUuid(trackId)) return fail(NOT_FOUND);
  await db.delete(tracks).where(and(eq(tracks.id, trackId), eq(tracks.eventId, eventId)));
  return done();
}

export async function reorderTracks(eventId: string, ids: string[]): Promise<ActionResult> {
  if (!(await staffOnly())) return fail(NOT_STAFF);
  if (!isUuid(eventId) || !ids.every(isUuid)) return fail(NOT_FOUND);
  const own = await db.select({ id: tracks.id }).from(tracks).where(and(eq(tracks.eventId, eventId), inArray(tracks.id, ids)));
  if (own.length !== ids.length) return fail(NOT_FOUND);
  await atomic(ids.map((id, i) => db.update(tracks).set({ displayOrder: i }).where(eq(tracks.id, id))));
  return done();
}
