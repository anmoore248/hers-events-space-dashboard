"use server";

import type { ActionResult } from "@/lib/action-result";
import type { EventLinkInput } from "@/lib/schemas";
import { notConnected } from "./_not-connected";

/* Not connected yet: each action below returns notConnected(). See README → "Connecting the backend". */

export async function saveEventLink(eventId: string, linkId: string | null, values: EventLinkInput): Promise<ActionResult> { void eventId; void linkId; void values; return notConnected(); }

export async function deleteEventLink(eventId: string, linkId: string): Promise<ActionResult> { void eventId; void linkId; return notConnected(); }

export async function reorderEventLinks(eventId: string, ids: string[]): Promise<ActionResult> { void eventId; void ids; return notConnected(); }
