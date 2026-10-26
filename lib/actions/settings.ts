"use server";

import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { ACTIONS, logActivity } from "@/lib/activity";
import type { ActionResult } from "@/lib/action-result";
import { settingsSchema, type SettingsInput } from "@/lib/schemas";
import { done, fail, NOT_STAFF, parse, staffOnly } from "./_helpers";

export async function saveSettings(values: SettingsInput): Promise<ActionResult> {
  const me = await staffOnly();
  if (!me) return fail(NOT_STAFF);
  const v = parse(settingsSchema, values);
  if ("error" in v) return fail(v.error);
  const now = new Date();
  const rows = Object.entries(v.data).map(([key, value]) => ({ key, value: String(value), updatedBy: me.id, updatedAt: now }));
  for (const row of rows) {
    await db.insert(settings).values(row).onConflictDoUpdate({ target: settings.key, set: { value: row.value, updatedBy: me.id, updatedAt: now } });
  }
  await logActivity({ actorId: me.id, action: ACTIONS.settingsChanged });
  return done();
}
