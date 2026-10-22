"use server";

import type { ActionResult } from "@/lib/action-result";
import type { SubcommitteeInput } from "@/lib/schemas";
import { notConnected } from "./_not-connected";

/* Not connected yet: each action below returns notConnected(). See README → "Connecting the backend". */

export async function saveSubcommittee(eventId: string, subcommitteeId: string | null, values: SubcommitteeInput): Promise<ActionResult> { void eventId; void subcommitteeId; void values; return notConnected(); }

export async function deleteSubcommittee(eventId: string, subcommitteeId: string): Promise<ActionResult> { void eventId; void subcommitteeId; return notConnected(); }

export async function addSubcommitteeMember(eventId: string, subcommitteeId: string, enrollmentId: string): Promise<ActionResult> { void eventId; void subcommitteeId; void enrollmentId; return notConnected(); }

export async function removeSubcommitteeMember(eventId: string, subcommitteeId: string, enrollmentId: string): Promise<ActionResult> { void eventId; void subcommitteeId; void enrollmentId; return notConnected(); }
