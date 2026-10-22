"use server";

import type { ActionResult } from "@/lib/action-result";
import type { EventInput } from "@/lib/schemas";
import { notConnected } from "./_not-connected";

/* Not connected yet: each action below returns notConnected(). See README → "Connecting the backend". */

export async function createEvent(values: EventInput): Promise<ActionResult<{ id: string }>> { void values; return notConnected(); }

export async function updateEvent(eventId: string, values: EventInput): Promise<ActionResult> { void eventId; void values; return notConnected(); }

export async function regenerateAccessKey(eventId: string): Promise<ActionResult<{ accessKey: string }>> { void eventId; return notConnected(); }

export async function markGroupMeClosed(eventId: string): Promise<ActionResult> { void eventId; return notConnected(); }
