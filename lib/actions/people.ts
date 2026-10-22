"use server";

import type { ActionResult } from "@/lib/action-result";
import { notConnected } from "./_not-connected";

/* Not connected yet: each action below returns notConnected(). See README → "Connecting the backend". */

/** Staff-run password reset (doc §5.4): removes the password and ends every session. */
export async function clearPassword(userId: string): Promise<ActionResult> { void userId; return notConnected(); }

/** Staff-run email change (doc §5.6). Fails with a description of the clashing account if the address is taken. */
export async function changeEmail(userId: string, newEmail: string): Promise<ActionResult> { void userId; void newEmail; return notConnected(); }

/** Duplicate-account workaround: move the account to a placeholder address and deactivate it. */
export async function retireAccount(userId: string): Promise<ActionResult<{ placeholder: string }>> { void userId; return notConnected(); }

export async function setDeactivated(userId: string, deactivated: boolean): Promise<ActionResult> { void userId; void deactivated; return notConnected(); }
