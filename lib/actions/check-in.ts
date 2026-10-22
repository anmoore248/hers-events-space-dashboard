"use server";

import type { ActionResult } from "@/lib/action-result";
import type { CheckInPointInput } from "@/lib/schemas";
import { notConnected } from "./_not-connected";

/* Not connected yet: each action below returns notConnected(). See README → "Connecting the backend". */

export async function checkIn(eventId: string, pointId: string, enrollmentId: string): Promise<ActionResult> { void eventId; void pointId; void enrollmentId; return notConnected(); }

export async function undoCheckIn(eventId: string, pointId: string, enrollmentId: string): Promise<ActionResult> { void eventId; void pointId; void enrollmentId; return notConnected(); }

export async function addCheckInPoint(eventId: string, values: CheckInPointInput): Promise<ActionResult> { void eventId; void values; return notConnected(); }

export async function renameCheckInPoint(eventId: string, pointId: string, label: string): Promise<ActionResult> { void eventId; void pointId; void label; return notConnected(); }

export async function deleteCheckInPoint(eventId: string, pointId: string): Promise<ActionResult> { void eventId; void pointId; return notConnected(); }
