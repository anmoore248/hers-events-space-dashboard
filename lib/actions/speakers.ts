"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { events, speakers } from "@/lib/db/schema";
import type { ActionResult } from "@/lib/action-result";
import { speakerSchema, type SpeakerInput } from "@/lib/schemas";
import { done, fail, friendly, isUuid, NOT_FOUND, NOT_STAFF, parse, staffOnly } from "./_helpers";

/** Staff enter only the contact details a speaker agreed to share; empty fields are stored as null and never shown. */
export async function saveSpeaker(eventId: string, speakerId: string | null, values: SpeakerInput): Promise<ActionResult<{ id: string }>> {
  if (!(await staffOnly())) return fail(NOT_STAFF);
  if (!isUuid(eventId) || (speakerId && !isUuid(speakerId))) return fail(NOT_FOUND);
  const v = parse(speakerSchema, values);
  if ("error" in v) return fail(v.error);
  const [event] = await db.select({ id: events.id }).from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) return fail(NOT_FOUND);

  const data = {
    name: v.data.name,
    title: v.data.title?.trim() || null,
    organization: v.data.organization?.trim() || null,
    bio: (v.data.bio ?? "").trim(),
    email: v.data.email || null,
    linkedin: v.data.linkedin || null,
    website: v.data.website || null,
  };
  try {
    if (speakerId) {
      const r = await db.update(speakers).set(data).where(and(eq(speakers.id, speakerId), eq(speakers.eventId, eventId))).returning({ id: speakers.id });
      if (!r.length) return fail(NOT_FOUND);
      return done({ id: speakerId });
    }
    const [row] = await db.insert(speakers).values({ ...data, eventId }).returning({ id: speakers.id });
    return done({ id: row.id });
  } catch (err) {
    return friendly(err);
  }
}

export async function deleteSpeaker(eventId: string, speakerId: string): Promise<ActionResult> {
  if (!(await staffOnly())) return fail(NOT_STAFF);
  if (!isUuid(eventId) || !isUuid(speakerId)) return fail(NOT_FOUND);
  await db.delete(speakers).where(and(eq(speakers.id, speakerId), eq(speakers.eventId, eventId)));
  return done();
}
