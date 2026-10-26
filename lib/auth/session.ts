import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { members, user } from "@/lib/db/schema";
import { auth } from "./index";
import type { CurrentUser, Role } from "@/lib/types";

/** The Neon Auth session for this request (read once per request). */
export const getSession = cache(async () => {
  // Read the headers outside the try: this is also what tells Next.js the page is per-request.
  await headers();
  try {
    const { data, error } = await auth.getSession();
    if (error) throw error;
    return data?.user ? data : null;
  } catch (err) {
    console.error("Could not read the session", err);
    return null;
  }
});

/**
 * The signed-in person, read from the database rather than the session: the
 * session cookie is cached for up to a minute, and a deactivated account (or
 * one with no members row, like the service account) must stop working at once.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const s = await getSession();
  if (!s) return null;
  const [row] = await db
    .select({ id: user.id, name: user.name, email: user.email, banned: user.banned, role: members.role })
    .from(user)
    .innerJoin(members, eq(members.userId, user.id))
    .where(eq(user.id, s.user.id))
    .limit(1);
  if (!row || row.banned) return null;
  const role: Role = row.role === "staff" ? "staff" : "attendee";
  return { id: row.id, name: row.name, email: row.email, role };
});

/** Pages and actions for anyone signed in. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Staff pages. Attendees are sent to their dashboard. */
export async function requireStaff(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "staff") redirect("/dashboard");
  return user;
}
