"use server";

import type { ActionResult } from "@/lib/action-result";
import { notConnected } from "./_not-connected";

/* Not connected yet: each action below returns notConnected(). See README → "Connecting the backend". */

export async function addTrack(eventId: string, name: string): Promise<ActionResult> { void eventId; void name; return notConnected(); }

export async function renameTrack(eventId: string, trackId: string, name: string): Promise<ActionResult> { void eventId; void trackId; void name; return notConnected(); }

export async function deleteTrack(eventId: string, trackId: string): Promise<ActionResult> { void eventId; void trackId; return notConnected(); }

export async function reorderTracks(eventId: string, ids: string[]): Promise<ActionResult> { void eventId; void ids; return notConnected(); }
