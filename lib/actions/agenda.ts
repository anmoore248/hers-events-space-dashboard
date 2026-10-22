"use server";

import type { ActionResult } from "@/lib/action-result";
import type { SessionInput } from "@/lib/schemas";
import { notConnected } from "./_not-connected";

/* Not connected yet: each action below returns notConnected(). See README → "Connecting the backend". */

export async function saveSession(eventId: string, sessionId: string | null, values: SessionInput): Promise<ActionResult<{ id: string }>> { void eventId; void sessionId; void values; return notConnected(); }

export async function deleteSession(eventId: string, sessionId: string): Promise<ActionResult> { void eventId; void sessionId; return notConnected(); }
