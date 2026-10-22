"use server";

import type { ActionResult } from "@/lib/action-result";
import type { SettingsInput } from "@/lib/schemas";
import { notConnected } from "./_not-connected";

/* Not connected yet: each action below returns notConnected(). See README → "Connecting the backend". */

export async function saveSettings(values: SettingsInput): Promise<ActionResult> { void values; return notConnected(); }
