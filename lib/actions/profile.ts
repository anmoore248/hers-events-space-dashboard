"use server";

import type { ActionResult } from "@/lib/action-result";
import type { ProfileInput } from "@/lib/schemas";
import { notConnected } from "./_not-connected";

/* Not connected yet: each action below returns notConnected(). See README → "Connecting the backend". */

export async function saveProfile(values: ProfileInput): Promise<ActionResult> { void values; return notConnected(); }
