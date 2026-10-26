"use server";

import { and, eq, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { authAdmin, unusablePassword } from "@/lib/auth/admin";
import { atomic, db } from "@/lib/db";
import { enrollments, events, members, staffInvites, user } from "@/lib/db/schema";
import { ACTIONS, activityInsert } from "@/lib/activity";
import type { ActionResult } from "@/lib/action-result";
import { emailOnlySchema } from "@/lib/schemas";
import { done, fail, friendly, isUuid, NOT_FOUND, NOT_STAFF, parse, staffOnly } from "./_helpers";

/** A platform account (Neon Auth user with a members row). */
async function target(userId: string) {
  if (!isUuid(userId)) return null;
  const [u] = await db
    .select({ id: user.id, name: user.name, email: user.email, banned: user.banned, role: members.role })
    .from(user)
    .innerJoin(members, eq(members.userId, user.id))
    .where(eq(user.id, userId))
    .limit(1);
  return u ?? null;
}

/**
 * Staff-run password reset (doc §5.4): replaces the password with one nobody
 * knows, signs the person out everywhere and records it. Neon Auth keeps
 * passwords itself, so "cleared" is the platform's own flag. Attendees then go
 * through Sign up again with any of their access keys; staff get a new staff sign-up link.
 */
export async function clearPassword(userId: string): Promise<ActionResult> {
  const me = await staffOnly();
  if (!me) return fail(NOT_STAFF);
  const u = await target(userId);
  if (!u) return fail(NOT_FOUND);
  if (u.id === me.id) return fail("To change your own password, go to Account.");
  try {
    await authAdmin.setPassword(u.id, unusablePassword());
    await authAdmin.signOutEverywhere(u.id);
  } catch (err) {
    return friendly(err);
  }
  await atomic([
    db.update(members).set({ passwordCleared: true }).where(eq(members.userId, u.id)),
    activityInsert({ actorId: me.id, action: ACTIONS.passwordReset, details: `${u.name} (${u.email})` }),
  ]);
  return done();
}

/**
 * Staff-run email change (doc §5.6, §7). Rejects addresses already in use and
 * says which account has it, so staff can use the duplicate-account workaround.
 */
export async function changeEmail(userId: string, newEmail: string): Promise<ActionResult> {
  const me = await staffOnly();
  if (!me) return fail(NOT_STAFF);
  const v = parse(emailOnlySchema, { email: newEmail });
  if ("error" in v) return fail(v.error);
  const email = v.data.email;
  const u = await target(userId);
  if (!u) return fail(NOT_FOUND);
  if (u.email === email) return fail("That's already this account's email.");

  const [clash] = await db.select().from(user).where(eq(user.email, email)).limit(1);
  if (clash) {
    const evs = await db
      .select({ name: events.name })
      .from(enrollments)
      .innerJoin(events, eq(events.id, enrollments.eventId))
      .where(and(eq(enrollments.userId, clash.id), ne(enrollments.status, "revoked")));
    const list = evs.length ? evs.map((e) => e.name).join(", ") : "no events";
    return fail(
      `${email} already belongs to ${clash.name} (${list}). Free up the address first: search for it on People, open that account and choose “Free up this email,” then try again.`,
    );
  }
  // Guest-list rows waiting for this address in the same events would clash too.
  const mine = await db.select({ eventId: enrollments.eventId }).from(enrollments).where(eq(enrollments.userId, u.id));
  if (mine.length) {
    const waiting = await db
      .select({ name: events.name })
      .from(enrollments)
      .innerJoin(events, eq(events.id, enrollments.eventId))
      .where(and(eq(enrollments.invitedEmail, email), inArray(enrollments.eventId, mine.map((m) => m.eventId))));
    if (waiting.length) {
      return fail(`${email} is also on the guest list for ${waiting.map((w) => w.name).join(", ")}. Remove or correct that guest-list entry on the event's Attendees tab first.`);
    }
  }

  try {
    await authAdmin.updateUser(u.id, { email });
  } catch (err) {
    return friendly(err);
  }
  try {
    await atomic([
      db.update(enrollments).set({ invitedEmail: email }).where(eq(enrollments.userId, u.id)),
      db.update(staffInvites).set({ email }).where(and(eq(staffInvites.userId, u.id), isNull(staffInvites.usedAt))),
      activityInsert({ actorId: me.id, action: ACTIONS.emailChanged, details: `${u.email} → ${email}` }),
    ]);
  } catch (err) {
    // Put the login email back so it still matches the guest lists.
    await authAdmin.updateUser(u.id, { email: u.email }).catch((e) => console.error("Could not restore the email", e));
    return friendly(err);
  }
  await authAdmin.signOutEverywhere(u.id).catch((e) => console.error("Could not sign out after an email change", e));
  return done();
}

/** Duplicate-account workaround (doc §5.6): placeholder address, deactivated, enrollments revoked. */
export async function retireAccount(userId: string): Promise<ActionResult<{ placeholder: string }>> {
  const me = await staffOnly();
  if (!me) return fail(NOT_STAFF);
  const u = await target(userId);
  if (!u) return fail(NOT_FOUND);
  if (u.role === "staff") return fail("Staff accounts can't be freed up this way. Edit the email on the Staff page instead.");

  let placeholder = "";
  for (let i = 0; i < 5 && !placeholder; i++) {
    const candidate = `retired-${1000 + Math.floor(Math.random() * 9000)}@invalid`;
    const [taken] = await db.select({ id: user.id }).from(user).where(eq(user.email, candidate)).limit(1);
    if (!taken) placeholder = candidate;
  }
  if (!placeholder) return fail("Please try again.");

  try {
    await authAdmin.updateUser(u.id, { email: placeholder });
    await authAdmin.ban(u.id, `Email freed up (was ${u.email})`);
  } catch (err) {
    return friendly(err);
  }
  await atomic([
    db.update(enrollments).set({ invitedEmail: placeholder, status: "revoked" }).where(eq(enrollments.userId, u.id)),
    activityInsert({ actorId: me.id, action: ACTIONS.accountRetired, details: `${u.email} → ${placeholder} (deactivated)` }),
  ]);
  return done({ placeholder });
}

/** Deactivation blocks login and ends sessions but keeps the account (doc §7). */
export async function setDeactivated(userId: string, deactivated: boolean): Promise<ActionResult> {
  const me = await staffOnly();
  if (!me) return fail(NOT_STAFF);
  const u = await target(userId);
  if (!u) return fail(NOT_FOUND);
  if (u.id === me.id) return fail("You can't deactivate your own account.");

  if (deactivated && u.role === "staff") {
    const [{ n }] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(user)
      .innerJoin(members, eq(members.userId, user.id))
      .where(and(eq(members.role, "staff"), ne(user.id, u.id), sql`coalesce(${user.banned}, false) = false`));
    if (n === 0) return fail("This is the last active staff account, so it can't be deactivated.");
  }

  try {
    // Banning also ends every session.
    if (deactivated) await authAdmin.ban(u.id, `Deactivated by ${me.name}`);
    else await authAdmin.unban(u.id);
  } catch (err) {
    return friendly(err);
  }
  await atomic([
    ...(deactivated
      ? [
          // Outstanding staff sign-up links stop working too.
          db
            .update(staffInvites)
            .set({ cancelledAt: new Date() })
            .where(and(or(eq(staffInvites.userId, u.id), eq(staffInvites.email, u.email)), isNull(staffInvites.usedAt), isNull(staffInvites.cancelledAt))),
        ]
      : []),
    activityInsert({ actorId: me.id, action: deactivated ? ACTIONS.deactivated : ACTIONS.reactivated, details: `${u.name} (${u.email})` }),
  ]);
  return done();
}
