"use server";

import { redirect } from "next/navigation";
import { and, eq, gt, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { authAdmin } from "@/lib/auth/admin";
import { getCurrentUser } from "@/lib/auth/session";
import { db, atomic } from "@/lib/db";
import { enrollments, events, members, staffInvites, user } from "@/lib/db/schema";
import { getSettings } from "@/lib/data";
import { ACTIONS, activityInsert } from "@/lib/activity";
import { allow, blocked, clientIp, recordFailure, TOO_MANY } from "@/lib/rate-limit";
import type { ActionResult } from "@/lib/action-result";
import {
  addEventSchema, changePasswordSchema, loginSchema, signUpCompleteSchema, signUpVerifySchema, staffSignUpSchema,
  type AddEventInput, type ChangePasswordInput, type LoginInput, type SignUpCompleteInput, type SignUpVerifyInput, type StaffSignUpInput,
} from "@/lib/schemas";
import { done, fail, ok, parse } from "./_helpers";

const home = (role: string | null | undefined) => (role === "staff" ? "/admin" : "/dashboard");

/** The Neon Auth account for an email, with the platform's side of it (role is null when there is none). */
async function findAccount(email: string) {
  const [row] = await db
    .select({
      id: user.id, name: user.name, email: user.email, banned: user.banned,
      role: members.role, passwordCleared: members.passwordCleared,
    })
    .from(user)
    .leftJoin(members, eq(members.userId, user.id))
    .where(eq(user.email, email))
    .limit(1);
  return row ?? null;
}

/** Signs in through Neon Auth, which sets the session cookie on this response. */
async function startSession(email: string, password: string) {
  const { error } = await auth.signIn.email({ email, password });
  if (error) throw new Error(`Sign-in after setting the password failed: ${error.message}`);
}

/**
 * Creates the Neon Auth account, then the platform's rows. Neon Auth and the
 * database can't share a transaction, so if the platform's rows fail the new
 * account is removed again and nothing is left half-made.
 */
async function createAccount(input: { email: string; password: string; name: string }, rows: (userId: string) => Parameters<typeof atomic>[0]) {
  const created = await authAdmin.createUser(input);
  try {
    await atomic(rows(created.id));
  } catch (err) {
    await authAdmin.removeUser(created.id).catch((e) => console.error("Could not remove the half-made account", e));
    throw err;
  }
  return created.id;
}

/* ------------------------------- sign in ------------------------------ */

export async function signIn(values: LoginInput): Promise<ActionResult<{ redirectTo: string }>> {
  const v = parse(loginSchema, values);
  if ("error" in v) return fail(v.error);
  const { email, password } = v.data;
  // Only failures count, and per email *and* IP, so nobody can lock someone else out.
  const ip = await clientIp();
  const keys = [`login-fail:${email}:${ip}`, `login-fail-ip:${ip}`] as const;
  if ((await blocked(keys[0], 10, 15 * 60)) || (await blocked(keys[1], 50, 15 * 60))) return fail(TOO_MANY);

  const { error } = await auth.signIn.email({ email, password });
  if (error) {
    await Promise.all(keys.map((k) => recordFailure(k, 15 * 60)));
    // TODO(human): turn Neon Auth's error into the message the person sees.
    return fail("Email or password is incorrect. If HERS staff reset your password, choose a new one under “Sign up.”");
  }

  const account = await findAccount(email);
  if (!account?.role) {
    // A Neon Auth account the platform doesn't know (such as the service account).
    await auth.signOut();
    return fail("Email or password is incorrect. If HERS staff reset your password, choose a new one under “Sign up.”");
  }
  return ok({ redirectTo: home(account.role) });
}

export async function signOut(): Promise<void> {
  try {
    await auth.signOut();
  } catch {
    // Already signed out.
  }
  redirect("/login");
}

/* ------------------------ sign up with an access key ------------------------ */

const NO_MATCH = "We couldn't match that email and access key. Use the exact email address and key from your HERS invitation.";

/**
 * The guest-list check (doc §5.2): the key must belong to an event, and the
 * email must be on that event's imported guest list. One message for every
 * failure, so the form never reveals who is on a guest list.
 */
async function matchInvitation(email: string, accessKey: string) {
  const [row] = await db
    .select({ event: events, enrollment: enrollments })
    .from(events)
    .innerJoin(enrollments, and(eq(enrollments.eventId, events.id), eq(enrollments.invitedEmail, email)))
    .where(eq(events.accessKey, accessKey))
    .limit(1);
  if (!row || row.enrollment.status === "revoked") return null;
  return row;
}

/**
 * Sign-up attempts are limited per email+IP, per IP, and per access key (so a
 * leaked key can't be used to test many emails). Invitations go out in bulk,
 * so the per-key limit allows a whole cohort signing up in the same hour.
 */
async function guard(email: string, accessKey: string) {
  const ip = await clientIp();
  return (
    (await allow(`signup:${email}:${ip}`, 10, 15 * 60)) &&
    (await allow(`signup-ip:${ip}`, 30, 15 * 60)) &&
    (await allow(`signup-key:${accessKey}`, 300, 60 * 60))
  );
}

/** Step 1: checks the email and key. Returning accounts with a cleared password continue to set a new one (doc §5.4). */
export async function verifySignUp(values: SignUpVerifyInput): Promise<ActionResult<{ eventName: string; returning: boolean }>> {
  const v = parse(signUpVerifySchema, values);
  if ("error" in v) return fail(v.error);
  if (!(await guard(v.data.email, v.data.accessKey))) return fail(TOO_MANY);
  return checkSignUp(v.data.email, v.data.accessKey);
}

async function checkSignUp(email: string, accessKey: string): Promise<ActionResult<{ eventName: string; returning: boolean }>> {
  const match = await matchInvitation(email, accessKey);
  if (!match) return fail(NO_MATCH);

  const existing = await findAccount(email);
  if (existing) {
    // Staff passwords are only ever set through a staff sign-up link, and an
    // account the platform doesn't know (no members row) is never claimed.
    if (existing.role !== "attendee") return fail(NO_MATCH);
    const { helpEmail } = await getSettings();
    if (existing.banned) return fail(`This account has been deactivated. Email ${helpEmail} for help.`);
    if (!existing.passwordCleared) {
      return fail("You already have an account. Please log in instead, then use “Add an event” to join this event.");
    }
    // An enrollment linked to someone else means the email was moved; don't let this account claim it.
    if (match.enrollment.userId && match.enrollment.userId !== existing.id) return fail(NO_MATCH);
    return ok({ eventName: match.event.name, returning: true });
  }
  if (match.enrollment.userId) return fail(NO_MATCH);
  return ok({ eventName: match.event.name, returning: false });
}

/** Step 2: creates the account (or sets the new password), activates the enrollment, and signs in. */
export async function completeSignUp(values: SignUpCompleteInput): Promise<ActionResult<{ redirectTo: string }>> {
  const v = parse(signUpCompleteSchema, values);
  if ("error" in v) return fail(v.error);
  const { email, accessKey, password } = v.data;
  if (!(await guard(email, accessKey))) return fail(TOO_MANY);

  // Run every check from step 1 again: nothing from the browser is trusted.
  const check = await checkSignUp(email, accessKey);
  if (!check.ok) return check;

  const match = (await matchInvitation(email, accessKey))!;
  const now = new Date();
  const activate = (userId: string) =>
    db
      .update(enrollments)
      .set({ userId, status: "active", activatedAt: match.enrollment.activatedAt ?? now })
      .where(eq(enrollments.id, match.enrollment.id));

  try {
    if (check.data.returning) {
      const existing = (await findAccount(email))!;
      await authAdmin.setPassword(existing.id, password);
      await atomic([
        db.update(members).set({ passwordCleared: false }).where(eq(members.userId, existing.id)),
        activate(existing.id),
        activityInsert({ actorId: existing.id, action: ACTIONS.newPassword, details: `${existing.name} (${email}) set a new password after a reset` }),
      ]);
    } else {
      await createAccount({ email, password, name: match.enrollment.displayName }, (id) => [
        db.insert(members).values({ userId: id, role: "attendee" }),
        activate(id),
      ]);
    }
    await startSession(email, password);
  } catch (err) {
    console.error(err);
    return fail("We couldn't finish setting up your account. Please try again.");
  }
  return ok({ redirectTo: "/dashboard" });
}

/* ------------------------------- staff sign-up ------------------------------ */

export async function staffSignUp(token: string, values: StaffSignUpInput): Promise<ActionResult<{ redirectTo: string }>> {
  const v = parse(staffSignUpSchema, values);
  if ("error" in v) return fail(v.error);
  if (!(await allow(`staff-signup-ip:${await clientIp()}`, 20, 15 * 60))) return fail(TOO_MANY);

  const [invite] = await db
    .select()
    .from(staffInvites)
    .where(and(eq(staffInvites.token, token), isNull(staffInvites.usedAt), isNull(staffInvites.cancelledAt), gt(staffInvites.expiresAt, new Date())))
    .limit(1);
  if (!invite) return fail("This sign-up link has already been used, was cancelled, or has expired. Ask another staff member for a new one.");

  const { name, password } = v.data;
  const now = new Date();
  const existing = await findAccount(invite.email);
  if (existing) {
    // Only a reset link made for this staff account may set its password, and never for a deactivated one.
    if (invite.userId !== existing.id || existing.role !== "staff") {
      return fail("An account with this email already exists. Ask another staff member to check the Staff page.");
    }
    if (existing.banned) return fail("This staff account has been deactivated. Ask another staff member to reactivate it first.");
  }

  // Claim the link before doing anything, so two submissions can't both use it.
  const claimed = await db
    .update(staffInvites)
    .set({ usedAt: now })
    .where(and(eq(staffInvites.id, invite.id), isNull(staffInvites.usedAt), isNull(staffInvites.cancelledAt)))
    .returning({ id: staffInvites.id });
  if (!claimed.length) return fail("This sign-up link has already been used.");

  try {
    if (existing) {
      await authAdmin.setPassword(existing.id, password);
      await authAdmin.updateUser(existing.id, { name });
      await authAdmin.signOutEverywhere(existing.id);
      await atomic([
        db.update(members).set({ passwordCleared: false }).where(eq(members.userId, existing.id)),
        activityInsert({ actorId: existing.id, action: ACTIONS.newPassword, details: `${name} (${invite.email}) set a new staff password` }),
      ]);
    } else {
      await createAccount({ email: invite.email, password, name }, (id) => [
        db.insert(members).values({ userId: id, role: "staff" }),
        activityInsert({ actorId: id, action: ACTIONS.staffJoined, details: `${name} (${invite.email}) created a staff account` }),
      ]);
    }
    await startSession(invite.email, password);
  } catch (err) {
    console.error(err);
    // Give the link back so they can try again.
    await db.update(staffInvites).set({ usedAt: null }).where(eq(staffInvites.id, invite.id)).catch(() => {});
    return fail("We couldn't create your account. Please try again.");
  }
  return ok({ redirectTo: "/admin" });
}

/* --------------------------- signed-in account tasks --------------------------- */

/** Staff and attendees change their own password; other devices are signed out (doc §5.5). */
export async function changePassword(values: ChangePasswordInput): Promise<ActionResult> {
  const v = parse(changePasswordSchema, values);
  if ("error" in v) return fail(v.error);
  const me = await getCurrentUser();
  if (!me) return fail("Please sign in again.");
  const { error } = await auth.changePassword({
    currentPassword: v.data.currentPassword,
    newPassword: v.data.newPassword,
    revokeOtherSessions: true,
  });
  if (error) {
    if (error.code === "INVALID_PASSWORD") return fail("Your current password is incorrect.");
    if (error.status === 429) return fail(TOO_MANY);
    console.error(error);
    return fail("We couldn't change your password. Please try again.");
  }
  return ok();
}

/** A returning attendee joins another event with its access key (doc §5.3). */
export async function addEventWithKey(values: AddEventInput): Promise<ActionResult<{ eventId: string }>> {
  const v = parse(addEventSchema, values);
  if ("error" in v) return fail(v.error);
  const me = await getCurrentUser();
  if (!me) return fail("Please sign in again.");
  if (!(await allow(`add-event:${me.id}`, 10, 15 * 60))) return fail(TOO_MANY);

  const match = await matchInvitation(me.email, v.data.accessKey);
  if (!match) {
    return fail(`That key didn't match an invitation for ${me.email}. Check the key, and that the invitation was sent to this address.`);
  }
  if (match.enrollment.userId && match.enrollment.userId !== me.id) {
    return fail(`That key didn't match an invitation for ${me.email}.`);
  }
  if (match.enrollment.status !== "active") {
    await db
      .update(enrollments)
      .set({ userId: me.id, status: "active", activatedAt: new Date() })
      .where(eq(enrollments.id, match.enrollment.id));
  }
  return done({ eventId: match.event.id });
}
