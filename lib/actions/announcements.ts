"use server";

import type { ActionResult } from "@/lib/action-result";
import type { AnnouncementInput } from "@/lib/schemas";
import { notConnected } from "./_not-connected";

/* Not connected yet: each action below returns notConnected(). See README → "Connecting the backend". */

export async function saveAnnouncement(eventId: string, announcementId: string | null, values: AnnouncementInput): Promise<ActionResult> { void eventId; void announcementId; void values; return notConnected(); }

export async function setAnnouncementPinned(eventId: string, announcementId: string, pinned: boolean): Promise<ActionResult> { void eventId; void announcementId; void pinned; return notConnected(); }

export async function deleteAnnouncement(eventId: string, announcementId: string): Promise<ActionResult> { void eventId; void announcementId; return notConnected(); }
