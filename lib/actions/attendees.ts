"use server";

import type { ActionResult } from "@/lib/action-result";
import type { AddAttendeeInput, AttendeeInput } from "@/lib/schemas";
import { notConnected } from "./_not-connected";

/* Not connected yet: each action below returns notConnected(). See README → "Connecting the backend". */

/** `mapping` resolves unknown subcommittee names: an existing name, or "__create". */
export async function importAttendees(eventId: string, csvText: string, mapping: Record<string, string>): Promise<ActionResult<{ imported: number; skipped: number }>> { void eventId; void csvText; void mapping; return notConnected(); }

export async function addAttendee(eventId: string, values: AddAttendeeInput): Promise<ActionResult> { void eventId; void values; return notConnected(); }

export async function updateAttendee(eventId: string, enrollmentId: string, values: AttendeeInput): Promise<ActionResult> { void eventId; void enrollmentId; void values; return notConnected(); }

export async function revokeEnrollment(eventId: string, enrollmentId: string): Promise<ActionResult> { void eventId; void enrollmentId; return notConnected(); }

export async function restoreEnrollment(eventId: string, enrollmentId: string): Promise<ActionResult> { void eventId; void enrollmentId; return notConnected(); }
