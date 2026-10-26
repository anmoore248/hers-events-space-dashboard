"use server";

import { and, eq, inArray } from "drizzle-orm";
import { atomic, db } from "@/lib/db";
import { events, sessionSpeakers, sessionsAgenda, speakers, tracks } from "@/lib/db/schema";
import { zonedToUtc } from "@/lib/time";
import type { ActionResult } from "@/lib/action-result";
import { sessionWithSpeakersSchema, type SessionInput } from "@/lib/schemas";
import { done, fail, friendly, isUuid, NOT_FOUND, NOT_STAFF, parse, staffOnly } from "./_helpers";

/** Saves a session and its speakers (in order). Times are entered in the event's time zone and stored in UTC. */
export async function saveSession(eventId: string, sessionId: string | null, values: SessionInput): Promise<ActionResult<{ id: string }>> {
  if (!(await staffOnly())) return fail(NOT_STAFF);
  if (!isUuid(eventId) || (sessionId && !isUuid(sessionId))) return fail(NOT_FOUND);
  const v = parse(sessionWithSpeakersSchema, values);
  if ("error" in v) return fail(v.error);
  const s = v.data;

  const [event] = await db.select({ timeZone: events.timeZone }).from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) return fail(NOT_FOUND);

  // Track and speakers must belong to this event.
  const trackId = s.trackId || null;
  if (trackId) {
    if (!isUuid(trackId)) return fail("Choose a track from this event.");
    const [t] = await db.select({ id: tracks.id }).from(tracks).where(and(eq(tracks.id, trackId), eq(tracks.eventId, eventId))).limit(1);
    if (!t) return fail("Choose a track from this event.");
  }
  const speakerIds = [...new Set(s.speakerIds)];
  if (speakerIds.length) {
    if (!speakerIds.every(isUuid)) return fail("Choose speakers from this event.");
    const own = await db.select({ id: speakers.id }).from(speakers).where(and(eq(speakers.eventId, eventId), inArray(speakers.id, speakerIds)));
    if (own.length !== speakerIds.length) return fail("Choose speakers from this event.");
  }

  const data = {
    title: s.title,
    trackId,
    startsAt: zonedToUtc(s.date, s.start, event.timeZone),
    endsAt: zonedToUtc(s.date, s.end, event.timeZone),
    location: s.location?.trim() || null,
    virtualLink: s.virtualLink?.trim() || null,
    description: (s.description ?? "").trim(),
  };

  try {
    const id = sessionId ?? crypto.randomUUID();
    if (sessionId) {
      const [existing] = await db.select({ id: sessionsAgenda.id }).from(sessionsAgenda).where(and(eq(sessionsAgenda.id, sessionId), eq(sessionsAgenda.eventId, eventId))).limit(1);
      if (!existing) return fail(NOT_FOUND);
    }
    await atomic([
      sessionId
        ? db.update(sessionsAgenda).set(data).where(eq(sessionsAgenda.id, sessionId))
        : db.insert(sessionsAgenda).values({ ...data, id, eventId }),
      db.delete(sessionSpeakers).where(eq(sessionSpeakers.sessionId, id)),
      ...(speakerIds.length
        ? [db.insert(sessionSpeakers).values(speakerIds.map((speakerId, i) => ({ sessionId: id, speakerId, displayOrder: i })))]
        : []),
    ]);
    return done({ id });
  } catch (err) {
    return friendly(err);
  }
}

export async function deleteSession(eventId: string, sessionId: string): Promise<ActionResult> {
  if (!(await staffOnly())) return fail(NOT_STAFF);
  if (!isUuid(eventId) || !isUuid(sessionId)) return fail(NOT_FOUND);
  await db.delete(sessionsAgenda).where(and(eq(sessionsAgenda.id, sessionId), eq(sessionsAgenda.eventId, eventId)));
  return done();
}
