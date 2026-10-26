"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { checkInPoints, events } from "@/lib/db/schema";
import { ACTIONS, logActivity } from "@/lib/activity";
import type { ActionResult } from "@/lib/action-result";
import { eventSchema, type EventInput } from "@/lib/schemas";
import { timeZones } from "@/lib/format";
import { done, fail, friendly, isUuid, NOT_FOUND, NOT_STAFF, parse, staffOnly } from "./_helpers";

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I/L

/** e.g. "SUMMER-7K4QXT": readable, easy to type, and only useful with a guest-list email (doc §8.2). */
function newAccessKey(name: string) {
  const prefix = (name.toUpperCase().match(/[A-Z]{3,}/)?.[0] ?? "HERS").slice(0, 8);
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return `${prefix}-${Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("")}`;
}

async function uniqueKey(name: string) {
  for (let i = 0; i < 5; i++) {
    const key = newAccessKey(name);
    const [taken] = await db.select({ id: events.id }).from(events).where(eq(events.accessKey, key)).limit(1);
    if (!taken) return key;
  }
  throw new Error("Could not generate a unique access key");
}

function clean(v: ReturnType<typeof eventSchema.parse>) {
  if (!timeZones.some((t) => t.value === v.timeZone)) throw new Error("Unknown time zone");
  return {
    name: v.name,
    description: (v.description ?? "").trim(),
    startDate: v.startDate,
    endDate: v.endDate,
    timeZone: v.timeZone,
    accessExpiry: v.accessExpiry || v.endDate, // defaults to the end date (doc §6)
    location: (v.location ?? "").trim(),
    virtualDetails: v.virtualDetails?.trim() || null,
  };
}

export async function createEvent(values: EventInput): Promise<ActionResult<{ id: string }>> {
  const me = await staffOnly();
  if (!me) return fail(NOT_STAFF);
  const v = parse(eventSchema, values);
  if ("error" in v) return fail(v.error);
  try {
    const [created] = await db
      .insert(events)
      .values({ ...clean(v.data), accessKey: await uniqueKey(v.data.name), createdBy: me.id })
      .returning({ id: events.id });
    // Every event starts with one check-in point, "Arrival" (doc §14.2).
    await db.insert(checkInPoints).values({ eventId: created.id, label: "Arrival", displayOrder: 0 });
    await logActivity({ actorId: me.id, action: ACTIONS.eventCreated, details: v.data.name, eventId: created.id });
    return done({ id: created.id });
  } catch (err) {
    return friendly(err);
  }
}

export async function updateEvent(eventId: string, values: EventInput): Promise<ActionResult> {
  if (!(await staffOnly())) return fail(NOT_STAFF);
  if (!isUuid(eventId)) return fail(NOT_FOUND);
  const v = parse(eventSchema, values);
  if ("error" in v) return fail(v.error);
  try {
    const updated = await db.update(events).set(clean(v.data)).where(eq(events.id, eventId)).returning({ id: events.id });
    if (!updated.length) return fail(NOT_FOUND);
    return done();
  } catch (err) {
    return friendly(err);
  }
}

export async function regenerateAccessKey(eventId: string): Promise<ActionResult<{ accessKey: string }>> {
  const me = await staffOnly();
  if (!me) return fail(NOT_STAFF);
  if (!isUuid(eventId)) return fail(NOT_FOUND);
  const [event] = await db.select({ name: events.name }).from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) return fail(NOT_FOUND);
  const accessKey = await uniqueKey(event.name);
  await db.update(events).set({ accessKey }).where(eq(events.id, eventId));
  await logActivity({ actorId: me.id, action: ACTIONS.keyRegenerated, details: event.name, eventId });
  return done({ accessKey });
}

/** Clears the "GroupMe cleanup due" reminder once staff have closed the event's groups (doc §13.1). */
export async function markGroupMeClosed(eventId: string): Promise<ActionResult> {
  const me = await staffOnly();
  if (!me) return fail(NOT_STAFF);
  if (!isUuid(eventId)) return fail(NOT_FOUND);
  const [event] = await db.update(events).set({ groupMeClosedAt: new Date() }).where(eq(events.id, eventId)).returning({ name: events.name });
  if (!event) return fail(NOT_FOUND);
  await logActivity({ actorId: me.id, action: ACTIONS.groupMeClosed, details: event.name, eventId });
  return done();
}
