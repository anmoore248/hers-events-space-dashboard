"use server";

import type { ActionResult } from "@/lib/action-result";
import { notConnected } from "./_not-connected";

/* Not connected yet: each action below returns notConnected(). See README → "Connecting the backend". */

export async function inviteStaff(email: string): Promise<ActionResult<{ url: string }>> { void email; return notConnected(); }

export async function cancelStaffInvite(inviteId: string): Promise<ActionResult> { void inviteId; return notConnected(); }
