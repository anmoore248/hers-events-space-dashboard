"use server";

import type { ActionResult } from "@/lib/action-result";
import type { SpeakerInput } from "@/lib/schemas";
import { notConnected } from "./_not-connected";

/* Not connected yet: each action below returns notConnected(). See README → "Connecting the backend". */

export async function saveSpeaker(eventId: string, speakerId: string | null, values: SpeakerInput): Promise<ActionResult<{ id: string }>> { void eventId; void speakerId; void values; return notConnected(); }

export async function deleteSpeaker(eventId: string, speakerId: string): Promise<ActionResult> { void eventId; void speakerId; return notConnected(); }
