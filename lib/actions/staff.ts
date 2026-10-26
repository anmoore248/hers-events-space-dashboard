"use server";

import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { members, staffInvites, user } from "@/lib/db/schema";
import { ACTIONS, logActivity } from "@/lib/activity";
import { signUpUrl } from "@/lib/data";
import type { ActionResult } from "@/lib/action-result";
import { emailOnlySchema } from "@/lib/schemas";
import { done, fail, isUuid, NOT_FOUND, NOT_STAFF, parse, staffOnly } from "./_helpers";

const INVITE_DAYS = 30;

/**
 * Creates a one-time staff sign-up link to send from your own email (doc §7).
 * For a staff member whose password was cleared, the link lets them set a new one (doc §5.5).
 */
export async function inviteStaff(email: string): Promise<ActionResult<{ url: string }>> {
  const me = await staffOnly();
  if (!me) return fail(NOT_STAFF);
  const v = parse(emailOnlySchema, { email });
  if ("error" in v) return fail(v.error);
  const address = v.data.email;

  const [existing] = await db
    .select({ id: user.id, name: user.name, banned: user.banned, role: members.role, passwordCleared: members.passwordCleared })
    .from(user)
    .leftJoin(members, eq(members.userId, user.id))
    .where(eq(user.email, address))
    .limit(1);
  let userId: string | null = null;
  if (existing) {
    if (existing.role !== "staff") return fail("This email belongs to an attendee account. Use a different address for the staff account.");
    if (existing.banned) return fail(`${existing.name}'s account is deactivated. Reactivate it on the Staff page first.`);
    if (!existing.passwordCleared) return fail(`${existing.name} already has an active staff account. To let them set a new password, clear it first.`);
    userId = existing.id;
  }

  // One live link per address.
  await db.update(staffInvites).set({ cancelledAt: new Date() }).where(and(eq(staffInvites.email, address), isNull(staffInvites.usedAt), isNull(staffInvites.cancelledAt)));
  const token = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url");
  await db.insert(staffInvites).values({
    token, email: address, userId, createdBy: me.id, expiresAt: new Date(Date.now() + INVITE_DAYS * 864e5),
  });
  await logActivity({ actorId: me.id, action: ACTIONS.staffInvited, details: userId ? `${address} (new password link)` : address });
  return done({ url: await signUpUrl(token) });
}

export async function cancelStaffInvite(inviteId: string): Promise<ActionResult> {
  const me = await staffOnly();
  if (!me) return fail(NOT_STAFF);
  if (!isUuid(inviteId)) return fail(NOT_FOUND);
  const [row] = await db
    .update(staffInvites)
    .set({ cancelledAt: new Date() })
    .where(and(eq(staffInvites.id, inviteId), isNull(staffInvites.usedAt), isNull(staffInvites.cancelledAt)))
    .returning({ email: staffInvites.email });
  if (!row) return fail(NOT_FOUND);
  await logActivity({ actorId: me.id, action: ACTIONS.inviteCancelled, details: row.email });
  return done();
}
