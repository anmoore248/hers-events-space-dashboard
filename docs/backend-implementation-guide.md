# HERS Event Platform: Backend Implementation Guide

Oct 13, 2026 · @Amya Moore

## How to use this guide

The backend is built in 12 steps, in order. Each step ends with a check you can run before moving on, so a mistake never travels more than one step.

**What "backend" means here.** Next.js has no separate server to build. The backend is the server-side code inside your existing project: the database tables (Drizzle + Neon), login and sessions (Better Auth), server actions (functions your forms call), and a few route handlers (the auth endpoint and CSV exports).

**Where you are starting.** The hers-events starter is running in your GitHub Codespace. Steps 1 to 8 cover Phase 1 (Foundation) plus the sign-up core from Phase 3. Step 9 walks Phases 2 to 6 feature by feature. Steps 10 to 12 cover Sentry, Netlify and testing.

**Conventions used below.**

- Run every command in the Codespace terminal from the project's root folder (the one with `package.json`).
- File paths assume a `src/` folder. If your project has none, drop `src/` from every path.
- `@/` in imports means `src/`. The Next.js starter sets this up by default.
- Next.js 16 renamed `middleware.ts` to `proxy.ts`. Run `npx next --version` once; if it shows 15 or lower, use `middleware.ts` wherever this guide says `proxy.ts`.

**Two changes from the Technical Documentation (v1.1).** Password resets are self-service (Step 8), and Step 4 adds a few columns and one small table. Update the doc's decision log and data model once these settle.

## Step 1: Create the Neon database and your secrets

You end this step with two database branches and a `.env.local` file holding three secrets.

1. Sign in to [Neon](https://neon.tech) with the shared HERS account (not your personal email) and create a project named `hers-events`. Pick the US East region.
2. The project starts with a `main` branch. That is production; never point your Codespace at it.
3. Create a second branch named `dev` from `main`. This is what your Codespace and every Netlify preview will use.
4. On the `dev` branch, open **Connect**, turn on **Connection pooling**, and copy the connection string. It starts with `postgresql://` and contains `-pooler`.
5. In the terminal, generate a random secret for Better Auth: `openssl rand -base64 32`
6. Create a file named `.env.local` in the project root:

```bash
DATABASE_URL="postgresql://...dev-branch...-pooler..."
BETTER_AUTH_SECRET="paste-the-random-secret"
BETTER_AUTH_URL="https://your-codespace-name-3000.app.github.dev"
```

`BETTER_AUTH_URL` is the address your app opens at in the browser. In a Codespace, copy it from the **Ports** tab (port 3000), with no trailing slash.

**Check:** run `git status`. `.env.local` must not appear in the list. The Next.js `.gitignore` already ignores `.env*` files; if it shows up, add `.env*.local` to `.gitignore` before you commit anything.

## Step 2: Install and connect Drizzle

Drizzle is the layer your code uses to read and write Neon. This step creates the connection; the tables come in Steps 3 and 4.

1. Install the packages:

```bash
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit dotenv tsx
```

2. Create `src/db/index.ts`. Leave the schema out for now; Step 4 adds it.

```ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle({ client: sql });
```

3. Create `drizzle.config.ts` in the project root:

```ts
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/db/schema",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

4. Add these lines to the `scripts` section of `package.json`:

```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:studio": "drizzle-kit studio"
```

**Why generate + migrate instead of push.** `db:generate` writes each schema change as a SQL file in `/drizzle`, which you commit. `db:migrate` applies those files in order. That gives you a history of every change and lets Netlify apply the same files to production later (Step 11). Avoid `drizzle-kit push` once real data exists.

**One limit to know.** The `neon-http` driver cannot run `db.transaction()`. When several writes must succeed or fail together (CSV import, email change), use `db.batch([...])`, which runs them as one transaction.

**Check:** nothing to run yet. You will test the connection at the end of Step 4.

## Step 3: Set up Better Auth and generate its tables

Better Auth comes before your own tables because several of them point at its `user` table. You end this step with a working `/api/auth` endpoint and the auth tables written as a Drizzle file.

1. Install it: `npm install better-auth`
2. Create `src/lib/auth.ts`:

```ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true, // accounts are only created by our own flows (Steps 5 and 8)
    minPasswordLength: 10,
  },
  rateLimit: { enabled: true, storage: "database" }, // memory storage resets on serverless
  trustedOrigins: ["https://*--hersnetwork-events.netlify.app"], // Netlify previews
  plugins: [
    admin({ defaultRole: "attendee", adminRoles: ["staff"] }),
    nextCookies(), // keep this last
  ],
});

export type SessionUser = typeof auth.$Infer.Session.user;
```

The admin plugin adds `role`, `banned`, `banReason` and `banExpires` to the user table, plus server functions for banning, revoking sessions and setting passwords. Setting `adminRoles: ["staff"]` means every staff member gets those powers, which matches "all staff are equal." Replace `hersnetwork-events` with your real Netlify site name once you have it.

3. Generate the auth tables as a Drizzle file:

```bash
npx @better-auth/cli@latest generate --output src/db/schema/auth.ts
```

Open the file and confirm it exports `user`, `session`, `account`, `verification` and `rateLimit`. Do not hand-edit it; rerun the command if you add Better Auth plugins later.

4. Create the auth endpoint at `src/app/api/auth/[...all]/route.ts`:

```ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

5. Create the browser-side client at `src/lib/auth-client.ts`. Your login form calls `authClient.signIn.email(...)` and the logout button calls `authClient.signOut()`.

```ts
import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({ plugins: [adminClient()] });
```

6. Create `src/proxy.ts`. It bounces logged-out visitors to `/login` before a page loads. It only checks that a session cookie exists, so it is a convenience, not security; the real checks happen on the server in Steps 6 and 7.

```ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile", "/events/:path*", "/admin/:path*", "/account"],
};
```

(On Next.js 15 or lower, name the file `middleware.ts` and the function `middleware`.)

**Check:** nothing to test until the tables exist. Continue to Step 4.

## Step 4: Write the platform tables and migrate

This step turns the data model (Technical Documentation section 16) into code and creates every table on your `dev` branch.

**Additions to the documented data model,** each needed by a flow you already designed:

| Table | Added | Why |
| --- | --- | --- |
| staff\_invites | `email`, `expires_at`, `used_at` | Ties a link to one person and makes it one-time |
| events | `description`, `location`, `virtual_details` | Section 8.1 lists them; the schema diagram does not |
| events | `access_expires_at` (timestamp) instead of a date | Stores "end of that day in the event's time zone" once, so every check is a simple comparison |
| enrollments | `individual_expires_at` (timestamp) | Same reason, per enrollment |
| speakers | `email`, `linkedin`, `website` | Section 11.2 lists them |
| check\_ins | unique (point, enrollment) | A second tap by another staff member does nothing |
| activity\_log | `target_user_id`, `details` | Records whose account changed and the old/new email |
| staff\_activity\_seen (new) | `user_id`, `last_seen_at` | Powers the unread count on the staff activity feed |

1. Create `src/db/schema/platform.ts`:

```ts
import {
  pgTable, pgEnum, text, integer, boolean, date, timestamp, jsonb,
  primaryKey, uniqueIndex, index,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

const id = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());
const ts = (name: string) => timestamp(name, { withTimezone: true });
const createdAt = () => ts("created_at").notNull().defaultNow();

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
});

export const staffInvites = pgTable("staff_invites", {
  id: id(),
  token: text("token").notNull().unique(),
  email: text("email").notNull(),
  createdBy: text("created_by").references(() => user.id), // null = seed script
  expiresAt: ts("expires_at").notNull(),
  usedAt: ts("used_at"),
  createdAt: createdAt(),
});

export const events = pgTable("events", {
  id: id(),
  name: text("name").notNull(),
  description: text("description"),
  location: text("location"),
  virtualDetails: text("virtual_details"),
  timeZone: text("time_zone").notNull().default("America/New_York"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  accessExpiresAt: ts("access_expires_at").notNull(),
  accessKey: text("access_key").notNull().unique(),
  createdBy: text("created_by").references(() => user.id),
  createdAt: createdAt(),
});

export const eventLinks = pgTable("event_links", {
  id: id(),
  eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  url: text("url").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  visibleFrom: ts("visible_from"),
  visibleUntil: ts("visible_until"),
});

export const enrollmentStatus = pgEnum("enrollment_status", ["invited", "active", "revoked"]);

export const enrollments = pgTable("enrollments", {
  id: id(),
  eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => user.id), // null until sign-up
  invitedEmail: text("invited_email").notNull(),     // always stored lowercase
  status: enrollmentStatus("status").notNull().default("invited"),
  individualExpiresAt: ts("individual_expires_at"),
  displayName: text("display_name").notNull(),
  title: text("title"),
  organization: text("organization"),
  linkedin: text("linkedin"),
  createdAt: createdAt(),
}, (t) => [
  uniqueIndex("enrollments_event_email").on(t.eventId, t.invitedEmail),
  uniqueIndex("enrollments_event_user").on(t.eventId, t.userId),
]);

export const tracks = pgTable("tracks", {
  id: id(),
  eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
});

// Named sessions_agenda so it never clashes with Better Auth's "session" table
export const agendaSessions = pgTable("sessions_agenda", {
  id: id(),
  eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  trackId: text("track_id").references(() => tracks.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  startsAt: ts("starts_at").notNull(),
  endsAt: ts("ends_at").notNull(),
  location: text("location"),
  virtualLink: text("virtual_link"),
  description: text("description"),
}, (t) => [index("agenda_event_start").on(t.eventId, t.startsAt)]);

export const speakers = pgTable("speakers", {
  id: id(),
  eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  title: text("title"),
  organization: text("organization"),
  bio: text("bio"),
  email: text("email"),
  linkedin: text("linkedin"),
  website: text("website"),
});

export const sessionSpeakers = pgTable("session_speakers", {
  sessionId: text("session_id").notNull().references(() => agendaSessions.id, { onDelete: "cascade" }),
  speakerId: text("speaker_id").notNull().references(() => speakers.id, { onDelete: "cascade" }),
  displayOrder: integer("display_order").notNull().default(0),
}, (t) => [primaryKey({ columns: [t.sessionId, t.speakerId] })]);

export const subcommittees = pgTable("subcommittees", {
  id: id(),
  eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  groupmeLink: text("groupme_link"),
}, (t) => [uniqueIndex("subcommittees_event_name").on(t.eventId, t.name)]);

export const subcommitteeMembers = pgTable("subcommittee_members", {
  subcommitteeId: text("subcommittee_id").notNull().references(() => subcommittees.id, { onDelete: "cascade" }),
  enrollmentId: text("enrollment_id").notNull().references(() => enrollments.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.subcommitteeId, t.enrollmentId] })]);

export const announcements = pgTable("announcements", {
  id: id(),
  eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  pinned: boolean("pinned").notNull().default(false),
  sentBy: text("sent_by").references(() => user.id),
  createdAt: createdAt(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
});

export const announcementReads = pgTable("announcement_reads", {
  announcementId: text("announcement_id").notNull().references(() => announcements.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  readAt: ts("read_at").notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.announcementId, t.userId] })]);

export const checkInPoints = pgTable("check_in_points", {
  id: id(),
  eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  label: text("label").notNull().default("Arrival"),
  pointDate: date("point_date"),
  displayOrder: integer("display_order").notNull().default(0),
});

export const checkIns = pgTable("check_ins", {
  id: id(),
  checkInPointId: text("check_in_point_id").notNull().references(() => checkInPoints.id, { onDelete: "cascade" }),
  enrollmentId: text("enrollment_id").notNull().references(() => enrollments.id, { onDelete: "cascade" }),
  checkedInAt: ts("checked_in_at").notNull().defaultNow(),
  checkedInBy: text("checked_in_by").references(() => user.id),
}, (t) => [uniqueIndex("check_ins_point_enrollment").on(t.checkInPointId, t.enrollmentId)]);

export const activityLog = pgTable("activity_log", {
  id: id(),
  actorId: text("actor_id").references(() => user.id),   // who did it (null = system)
  action: text("action").notNull(),                        // e.g. "password_reset"
  eventId: text("event_id").references(() => events.id, { onDelete: "set null" }),
  targetUserId: text("target_user_id").references(() => user.id),
  details: jsonb("details"),
  createdAt: createdAt(),
}, (t) => [index("activity_created").on(t.createdAt)]);

export const staffActivitySeen = pgTable("staff_activity_seen", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  lastSeenAt: ts("last_seen_at").notNull().defaultNow(),
});
```

2. Create `src/db/schema/index.ts` so everything is importable from one place:

```ts
export * from "./auth";
export * from "./platform";
```

3. Give Drizzle and Better Auth the schema. In `src/db/index.ts`, add `import * as schema from "./schema";` and change the last line to `export const db = drizzle({ client: sql, schema });`. In `src/lib/auth.ts`, add `import * as schema from "@/db/schema";` and change the adapter to `drizzleAdapter(db, { provider: "pg", schema })`.
4. Create and apply the first migration on `dev`:

```bash
npm run db:generate -- --name init
npm run db:migrate
```

**Check:** run `npm run db:studio` and open the link it prints. You should see all 22 tables, empty. Then run `npm run dev` and visit `/api/auth/ok` in the browser; it should show `{"ok":true}`. If Better Auth ever errors with "No transactions support in neon-http driver," add `transaction: false` inside the `drizzleAdapter` options.

## Step 5: Account helpers, activity log helper and the first-staff seed

Because public sign-up is off, your own code creates accounts and sets passwords. This step puts that code in one file, adds a one-line way to write to the activity log, and creates the seed script that makes the first staff invite.

1. Install two small packages: `npm install server-only zod`. (`server-only` makes the build fail if a server file is ever imported into the browser.)
2. Create `src/lib/accounts.ts`:

```ts
import "server-only";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

type Role = "staff" | "attendee";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function findAccountByEmail(email: string) {
  const ctx = await auth.$context;
  const found = await ctx.internalAdapter.findUserByEmail(normalizeEmail(email), { includeAccounts: true });
  if (!found) return null;
  const credential = found.accounts.find((a) => a.providerId === "credential");
  return {
    user: found.user as typeof found.user & { role: Role; banned: boolean | null },
    hasCredential: Boolean(credential),
    hasPassword: Boolean(credential?.password),
  };
}

export async function createAccount(email: string, name: string, role: Role, password: string) {
  const ctx = await auth.$context;
  const user = await ctx.internalAdapter.createUser({
    email: normalizeEmail(email), name, emailVerified: true, role,
  });
  const hash = await ctx.password.hash(password);
  await ctx.internalAdapter.linkAccount({
    userId: user.id, providerId: "credential", accountId: user.id, password: hash,
  });
  return user;
}

/** Sets a new password and logs the person out everywhere. */
export async function setPassword(userId: string, password: string, hasCredential: boolean) {
  const ctx = await auth.$context;
  const hash = await ctx.password.hash(password);
  if (hasCredential) await ctx.internalAdapter.updatePassword(userId, hash);
  else await ctx.internalAdapter.linkAccount({ userId, providerId: "credential", accountId: userId, password: hash });
  await ctx.internalAdapter.deleteSessions(userId);
}

/** Logs the person in on this browser right after they set a password. */
export async function signInNow(email: string, password: string) {
  await auth.api.signInEmail({ body: { email: normalizeEmail(email), password }, headers: await headers() });
}
```

`auth.$context.internalAdapter` is Better Auth's internal toolkit. It is stable in practice but not part of the documented public API, which is exactly why it lives in this one file: if a Better Auth update renames something, you fix it here only. Test sign-up on a preview deploy after every Better Auth update.

3. Create `src/lib/activity.ts`:

```ts
import "server-only";
import { db } from "@/db";
import { activityLog } from "@/db/schema";

export async function logActivity(entry: {
  actorId: string | null;
  action: string;
  eventId?: string;
  targetUserId?: string;
  details?: Record<string, unknown>;
}) {
  await db.insert(activityLog).values(entry);
}
```

4. Create `scripts/seed-staff.ts`. It never touches passwords; it prints a one-time staff sign-up link, which the new staff member opens to set their own password (Step 8 builds that page).

```ts
import { config } from "dotenv";
import { randomBytes } from "node:crypto";
config({ path: ".env.local" });

async function main() {
  const { db } = await import("../src/db");
  const { staffInvites } = await import("../src/db/schema");

  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) throw new Error("Usage: npm run seed:staff -- name@hersnetwork.org");

  const token = randomBytes(32).toString("base64url");
  await db.insert(staffInvites).values({
    token, email, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  console.log(`Staff sign-up link: ${process.env.BETTER_AUTH_URL}/staff-signup/${token}`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
```

5. Add `"seed:staff": "tsx scripts/seed-staff.ts"` to the `scripts` in `package.json`.

**Check:** run `npm run seed:staff -- your.name@hersnetwork.org`. It prints a link, and Drizzle Studio shows one row in `staff_invites`. The link will work once Step 8 is done.

**Using it on production later:** values you type before a command override `.env.local`, so the same script can seed the live database once: `DATABASE_URL="<main-branch-url>" BETTER_AUTH_URL="https://<your-site>.netlify.app" npm run seed:staff -- your.name@hersnetwork.org`. This is also the recovery path if every staff account is ever locked out.

## Step 6: Session helpers, the access check and time zones

Every page and action asks two questions: who is this, and what can they do in this event? This step answers both in one place each, as section 4.1 of the Technical Documentation requires.

1. Create `src/lib/session.ts`:

```ts
import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// cache() means several calls in one request hit the database once
export const getCurrentUser = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireStaff() {
  const user = await requireUser();
  if (user.role !== "staff") redirect("/dashboard");
  return user;
}
```

2. Create `src/lib/access.ts`, the single access check:

```ts
import "server-only";
import { cache } from "react";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { enrollments, events } from "@/db/schema";

export type Access = "full" | "readonly" | "none";

export const getEventAccess = cache(async (
  user: { id: string; role?: string | null },
  eventId: string,
) => {
  const event = await db.query.events.findFirst({ where: eq(events.id, eventId) });
  if (!event) return { access: "none" as Access, event: null, enrollment: null };

  if (user.role === "staff") return { access: "full" as Access, event, enrollment: null };

  const enrollment = await db.query.enrollments.findFirst({
    where: and(
      eq(enrollments.eventId, eventId),
      eq(enrollments.userId, user.id),
      eq(enrollments.status, "active"),
    ),
  });
  if (!enrollment) return { access: "none" as Access, event: null, enrollment: null };

  const expiresAt = enrollment.individualExpiresAt ?? event.accessExpiresAt;
  const access: Access = new Date() < expiresAt ? "full" : "readonly";
  return { access, event, enrollment };
});
```

3. Use it at the top of every event page. Return "not found" for no access, so a blocked person cannot even tell the event exists:

```tsx
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getEventAccess } from "@/lib/access";

export default async function EventHome({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const user = await requireUser();
  const { access, event } = await getEventAccess(user, eventId);
  if (access === "none") notFound();
  const readOnly = access === "readonly"; // hide forms when true
  // ...load and render the page
}
```

4. Install the time-zone tools, `npm install date-fns @date-fns/tz`, and create `src/lib/dates.ts`. Staff type local times for the event; the database stores UTC.

```ts
import { TZDate } from "@date-fns/tz";

/** "2027-06-14" in "America/New_York" → 11:59:59 pm that day there, as a UTC Date */
export function endOfDayInZone(isoDate: string, timeZone: string) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(new TZDate(y, m - 1, d, 23, 59, 59, timeZone).getTime());
}

/** "2027-06-14T09:30" typed by staff for the event's zone → UTC Date */
export function localToUtc(localDateTime: string, timeZone: string) {
  const [date, time] = localDateTime.split("T");
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(new TZDate(y, m - 1, d, hh, mm, 0, timeZone).getTime());
}

/** UTC Date → "9:30 AM ET" style text in the event's zone */
export function formatInZone(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone, hour: "numeric", minute: "2-digit", timeZoneName: "short",
  }).format(date);
}
```

**Check:** run `npx tsc --noEmit`. It should finish with no errors. The access rules themselves are tested end to end in Step 12.

## Step 7: The server action pattern

Every change in the platform goes through a server action that does the same five things in the same order. Learn it once here with "post an announcement"; every feature in Step 9 is a copy of this shape.

1. Create `src/lib/action-result.ts`, the one return shape every action uses:

```ts
export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };
```

2. Put each form's Zod schema in `src/lib/validation/`. The browser form and the server action import the same file, so the rules can never drift apart. Example, `src/lib/validation/announcement.ts`:

```ts
import { z } from "zod";

export const announcementSchema = z.object({
  body: z.string().trim().min(1, "Write the announcement first").max(5000),
  pinned: z.boolean(),
});
export type AnnouncementInput = z.infer<typeof announcementSchema>;
```

3. Write the action next to the page that uses it, e.g. `src/app/admin/events/[eventId]/announcements/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { announcements } from "@/db/schema";
import { requireStaff } from "@/lib/session";
import { getEventAccess } from "@/lib/access";
import { announcementSchema, type AnnouncementInput } from "@/lib/validation/announcement";
import type { ActionResult } from "@/lib/action-result";

export async function postAnnouncement(eventId: string, input: AnnouncementInput): Promise<ActionResult> {
  // 1. Who is this?
  const user = await requireStaff();

  // 2. What can they do in this event?
  const { access } = await getEventAccess(user, eventId);
  if (access !== "full") return { ok: false, error: "You can't change this event." };

  // 3. Is the input valid? Never trust what the browser sent.
  const parsed = announcementSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // 4. Write. Who did it comes from the session, never from the form.
  await db.insert(announcements).values({ eventId, ...parsed.data, sentBy: user.id });

  // 5. Refresh every page that shows this data.
  revalidatePath(`/admin/events/${eventId}/announcements`);
  revalidatePath(`/events/${eventId}`);
  return { ok: true };
}
```

4. Call it from the shadcn form (React Hook Form). If `@hookform/resolvers` is not installed yet: `npm install react-hook-form @hookform/resolvers`.

```tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { announcementSchema, type AnnouncementInput } from "@/lib/validation/announcement";
import { postAnnouncement } from "./actions";

export function AnnouncementForm({ eventId }: { eventId: string }) {
  const form = useForm<AnnouncementInput>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { body: "", pinned: false },
  });

  async function onSubmit(values: AnnouncementInput) {
    const result = await postAnnouncement(eventId, values);
    if (!result.ok) return form.setError("root", { message: result.error });
    form.reset();
  }
  // ...render shadcn <Form> fields and show form.formState.errors.root?.message
}
```

**Rules every action follows:**

- Staff-only actions start with `requireStaff()`. Attendee actions start with `requireUser()` and also need `access === "full"`, which blocks expired events automatically.
- Any ID that arrives from the browser (a session, speaker or enrollment ID) is matched together with `eventId` in the `where` clause, e.g. `and(eq(speakers.id, speakerId), eq(speakers.eventId, eventId))`. Otherwise someone could edit another event's data by changing an ID.
- Sensitive actions (password, email, deactivation, revocation, staff invites) also call `logActivity(...)`.
- Several writes that must succeed together go in one `db.batch([...])`.
- User-facing error messages are plain sentences; technical details go to Sentry (Step 10), not the screen.

**Check:** build a bare announcement form on the staff event page, post one, and see the row in Drizzle Studio. Then log in as an attendee (after Step 8) and confirm calling the action is refused.

## Step 8: Staff sign-up, attendee sign-up, adding events and password resets

This is the riskiest part of the build, so every flow lives in one place and shares the same checks. You finish with five working account flows: staff sign-up, login, attendee sign-up with an access key, adding another event, and self-service password reset.

### 8a. Shared validation and invite lookup

`src/lib/validation/auth.ts`:

```ts
import { z } from "zod";

const password = z.string().min(10, "Use at least 10 characters").max(128);
const matching = (v: { password: string; confirmPassword: string }) => v.password === v.confirmPassword;
const mismatch = { message: "Passwords don't match", path: ["confirmPassword"] };

export const keyPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  accessKey: z.string().trim().min(4, "Enter the access key from your invitation"),
  password, confirmPassword: z.string(),
}).refine(matching, mismatch);
export type KeyPasswordInput = z.infer<typeof keyPasswordSchema>;

export const staffSignupSchema = z.object({
  name: z.string().trim().min(1, "Enter your name"),
  password, confirmPassword: z.string(),
}).refine(matching, mismatch);
export type StaffSignupInput = z.infer<typeof staffSignupSchema>;

export const accessKeySchema = z.object({ accessKey: z.string().trim().min(4) });
```

`src/lib/invites.ts` finds an invitation and limits guessing to 10 failed tries per email per hour:

```ts
import "server-only";
import { and, count, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { activityLog, enrollments, events } from "@/db/schema";
import { normalizeEmail } from "@/lib/accounts";
import { logActivity } from "@/lib/activity";

export async function findInvite(email: string, accessKey: string) {
  const event = await db.query.events.findFirst({
    where: eq(events.accessKey, accessKey.trim().toUpperCase()),
  });
  if (!event) return null;
  const invite = await db.query.enrollments.findFirst({
    where: and(eq(enrollments.eventId, event.id), eq(enrollments.invitedEmail, normalizeEmail(email))),
  });
  return invite ?? null;
}

export async function tooManyKeyAttempts(email: string) {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const [row] = await db.select({ n: count() }).from(activityLog).where(and(
    eq(activityLog.action, "access_key_failed"),
    gt(activityLog.createdAt, since),
    sql`${activityLog.details}->>'email' = ${normalizeEmail(email)}`,
  ));
  return row.n >= 10;
}

export async function recordKeyFailure(email: string) {
  await logActivity({ actorId: null, action: "access_key_failed", details: { email: normalizeEmail(email) } });
}
```

Hide `access_key_failed` rows from the staff activity feed (Phase 6); they exist only for the limit.

### 8b. Staff sign-up (`/staff-signup/[token]`)

The page loads the invite by token and shows its email (read-only) with a name and password form. Its action:

```ts
"use server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { staffInvites } from "@/db/schema";
import { createAccount, findAccountByEmail, setPassword, signInNow } from "@/lib/accounts";
import { logActivity } from "@/lib/activity";
import { staffSignupSchema, type StaffSignupInput } from "@/lib/validation/auth";
import type { ActionResult } from "@/lib/action-result";

export async function completeStaffSignup(token: string, input: StaffSignupInput): Promise<ActionResult> {
  const parsed = staffSignupSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the highlighted fields." };

  const invite = await db.query.staffInvites.findFirst({ where: eq(staffInvites.token, token) });
  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return { ok: false, error: "This link has expired or was already used. Ask a colleague for a new one." };
  }

  const existing = await findAccountByEmail(invite.email);
  let userId: string;
  if (!existing) {
    userId = (await createAccount(invite.email, parsed.data.name, "staff", parsed.data.password)).id;
  } else if (existing.user.role === "staff" && !existing.hasPassword && !existing.user.banned) {
    await setPassword(existing.user.id, parsed.data.password, existing.hasCredential); // locked-out staff
    userId = existing.user.id;
  } else {
    return { ok: false, error: "An account already uses this email. Ask a colleague to check Staff settings." };
  }

  await db.update(staffInvites).set({ usedAt: new Date() }).where(eq(staffInvites.id, invite.id));
  await logActivity({ actorId: userId, action: "staff_signup_completed", targetUserId: userId });
  await signInNow(invite.email, parsed.data.password);
  redirect("/admin");
}
```

### 8c. Login, home redirect and own-password change

- `/login`: the form calls `authClient.signIn.email({ email, password })`, then `router.push("/")`.
- `/` (a server page): no user → `redirect("/login")`; staff → `/admin`; attendee → `/dashboard`.
- `/account`: the form calls `authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true })`. Better Auth checks the current password itself; no server code needed.
- Deactivated (banned) users are refused at login by Better Auth's admin plugin.

### 8d. Attendee sign-up with an access key (`/signup`)

```ts
"use server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { enrollments } from "@/db/schema";
import { createAccount, findAccountByEmail, normalizeEmail, setPassword, signInNow } from "@/lib/accounts";
import { findInvite, recordKeyFailure, tooManyKeyAttempts } from "@/lib/invites";
import { logActivity } from "@/lib/activity";
import { keyPasswordSchema, type KeyPasswordInput } from "@/lib/validation/auth";
import type { ActionResult } from "@/lib/action-result";

const NO_MATCH = "That email and access key don't match an invitation. Check both, or email hers@hersnetwork.org.";

export async function signUpWithKey(input: KeyPasswordInput): Promise<ActionResult> {
  const parsed = keyPasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  const email = normalizeEmail(parsed.data.email);
  if (await tooManyKeyAttempts(email)) return { ok: false, error: "Too many attempts. Please wait an hour." };

  const invite = await findInvite(email, parsed.data.accessKey);
  if (!invite || invite.status === "revoked") {
    await recordKeyFailure(email);
    return { ok: false, error: NO_MATCH };
  }

  const existing = await findAccountByEmail(email);
  let userId: string;
  if (!existing) {
    userId = (await createAccount(email, invite.displayName, "attendee", parsed.data.password)).id;
  } else if (existing.user.banned || (invite.userId && invite.userId !== existing.user.id)) {
    return { ok: false, error: NO_MATCH };
  } else if (existing.hasPassword) {
    return { ok: false, error: "You already have an account. Log in, then add this event from your dashboard." };
  } else {
    // Password was cleared by staff: let them set a new one
    await setPassword(existing.user.id, parsed.data.password, existing.hasCredential);
    userId = existing.user.id;
    await logActivity({ actorId: userId, action: "password_set_after_clear", targetUserId: userId });
  }

  await db.update(enrollments).set({ userId, status: "active" }).where(eq(enrollments.id, invite.id));
  await signInNow(email, parsed.data.password);
  redirect("/dashboard");
}
```

One message covers "wrong key" and "not on the guest list" on purpose, so nobody can use the form to test which emails were invited.

### 8e. Adding another event (`/dashboard/add-event`)

Same lookup, but the email comes from the logged-in session, never from the form:

```ts
export async function addEventWithKey(input: { accessKey: string }): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = accessKeySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter the access key from your invitation." };
  if (await tooManyKeyAttempts(user.email)) return { ok: false, error: "Too many attempts. Please wait an hour." };

  const invite = await findInvite(user.email, parsed.data.accessKey);
  if (!invite || invite.status === "revoked" || (invite.userId && invite.userId !== user.id)) {
    await recordKeyFailure(user.email);
    return { ok: false, error: `That key doesn't match an invitation for ${user.email}. If you were invited at another address, email hers@hersnetwork.org.` };
  }

  await db.update(enrollments).set({ userId: user.id, status: "active" }).where(eq(enrollments.id, invite.id));
  revalidatePath("/dashboard");
  return { ok: true };
}
```

### 8f. Self-service password reset (`/forgot-password`)

The attendee enters their email, the access key for any event they are enrolled in (past events count), and a new password. Staff get a GroupMe message and an activity-feed entry every time.

First, set up the staff GroupMe bot (free, about five minutes):

1. Log in to [dev.groupme.com](https://dev.groupme.com) with the shared HERS GroupMe account.
2. Go to **Bots**, then **Create Bot**. Choose the staff group, name it "HERS Event Platform", and leave the callback URL empty.
3. Copy the **Bot ID** into `.env.local` as `GROUPME_STAFF_BOT_ID="..."`. Treat it as a secret: anyone who has it can post in that group.

Then `src/lib/notify.ts`:

```ts
import "server-only";

export async function notifyStaffGroupMe(text: string) {
  const botId = process.env.GROUPME_STAFF_BOT_ID;
  if (!botId) return; // not configured, e.g. on previews
  try {
    await fetch("https://api.groupme.com/v3/bots/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bot_id: botId, text }),
    });
  } catch (error) {
    console.error(error); // Step 10 swaps this for Sentry.captureException(error)
    // a failed ping must never block the reset
  }
}
```

And the reset action:

```ts
export async function resetPasswordWithKey(input: KeyPasswordInput): Promise<ActionResult> {
  const parsed = keyPasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  const email = normalizeEmail(parsed.data.email);
  if (await tooManyKeyAttempts(email)) return { ok: false, error: "Too many attempts. Please wait an hour." };

  const existing = await findAccountByEmail(email);
  const invite = await findInvite(email, parsed.data.accessKey);
  if (!existing || existing.user.banned || !invite || invite.status !== "active" || invite.userId !== existing.user.id) {
    await recordKeyFailure(email);
    return { ok: false, error: NO_MATCH };
  }

  await setPassword(existing.user.id, parsed.data.password, existing.hasCredential); // also logs out everywhere
  await logActivity({ actorId: existing.user.id, action: "password_reset_self", eventId: invite.eventId, targetUserId: existing.user.id });
  await notifyStaffGroupMe(`${existing.user.name} reset their event platform password. If that seems wrong, check the activity feed.`);
  await signInNow(email, parsed.data.password);
  redirect("/dashboard");
}
```

**A risk to accept knowingly.** Anyone who has an event's access key and guesses a fellow attendee's email could reset that person's password, with no staff check in between. The guardrails are the 10-tries limit, the identical error message, emails never appearing in the directory, and the staff GroupMe ping on every reset. If that trade-off ever feels too loose, the staff-run clear (Phase 2) still exists and the reset page can be switched off. Record this in the Technical Documentation's risks table.

**Check:** open your seeded staff link, set a password, and land on `/admin`. Log out and back in. Then insert a test event and invitation for a second email in Drizzle Studio (on `dev`), sign up with its key, add a second event with its key, and reset the password. Each should land on `/dashboard`, and the reset should post in the staff GroupMe.

## Step 9: Build each feature's backend, phase by phase

With Steps 1 to 8 done, every remaining feature is a set of Step 7 actions plus a few queries. Build one phase at a time, matching the build order in your outline, and deploy a preview (Step 11) at the end of each phase. Each table lists the actions to write; the code below each table covers the parts that are easy to get wrong.

### Phase 2: Events and staff tools

| Action | What it does | Watch for |
| --- | --- | --- |
| `createEvent` | Inserts the event and its "Arrival" check-in point together | Generate the event ID in code so both inserts go in one `db.batch`. Default `accessExpiresAt` to `endOfDayInZone(endDate, timeZone)` |
| `updateEvent` | Edits details, dates, time zone, expiry | Recompute `accessExpiresAt` when the date or zone changes |
| `regenerateAccessKey` | Replaces the key immediately | Log it; old invitations stop working |
| `saveEventLink` / `deleteEventLink` / `reorderEventLinks` | Event links list | Validate URLs with `z.string().url()`; attendees only see links inside their visible window |
| `createStaffInvite` | Same as the seed script, with `createdBy` set; shows the link to copy | Expire after 7 days; log it |
| `deactivateUser` / `reactivateUser` | `auth.api.banUser` / `unbanUser` | Refuse if it would leave zero active staff; log it |
| `clearPassword` | Removes the password and logs the person out | Log it; works for staff and attendees |
| `changeUserEmail` | Updates login email and every enrollment's invited email | Block duplicates and show which account holds the address; remind staff to update Salesforce |
| `saveSetting` | "Message HERS staff" link, help email | Upsert by key |

Access key generator (`src/lib/access-key.ts`), using letters and digits that cannot be confused when read aloud:

```ts
import { randomInt } from "node:crypto";
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I/L
export function generateAccessKey(length = 8) {
  return Array.from({ length }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
}
```

The three account actions, inside staff-only actions after `requireStaff()`:

```ts
// Clear a password: they set a new one through /signup or /forgot-password
await db.update(account).set({ password: null })
  .where(and(eq(account.userId, targetId), eq(account.providerId, "credential")));
await auth.api.revokeUserSessions({ body: { userId: targetId }, headers: await headers() });

// Change an email (after checking findAccountByEmail(newEmail) returns null)
await db.batch([
  db.update(user).set({ email: newEmail, updatedAt: new Date() }).where(eq(user.id, targetId)),
  db.update(enrollments).set({ invitedEmail: newEmail }).where(eq(enrollments.userId, targetId)),
]);
await auth.api.revokeUserSessions({ body: { userId: targetId }, headers: await headers() });

// Deactivate
await auth.api.banUser({ body: { userId: targetId, banReason: "Deactivated by staff" }, headers: await headers() });
```

If the email batch fails, an unclaimed invitation already uses the new address in some event; show staff that event so they can fix the invitation first. Log every one of these with `logActivity`, including old and new email in `details`.

### Phase 3: Attendees

| Action or query | What it does | Watch for |
| --- | --- | --- |
| `previewImport` | Parses the CSV and returns each row as new, already invited, or error, plus unknown subcommittee names | Saves nothing |
| `confirmImport` | Inserts new invitations and subcommittee memberships | Re-validates on the server; never trusts the preview |
| `updateAttendee` (staff) | Edits one enrollment's profile, individual expiry, or invited email | Invited email only editable while status is `invited` |
| `revokeEnrollment` | Sets status to `revoked` | Return a flag so the page shows the GroupMe removal reminder; log it |
| `updateProfile` (attendee) | Saves name, title, organization, LinkedIn | Updates only enrollments that are active and not expired, matching "saves to all ACTIVE enrollments" |
| Dashboard query | The user's active enrollments with their events, split into current and past | Revoked enrollments never appear |

Install the CSV parser: `npm install papaparse` and `npm install -D @types/papaparse`. The browser reads the file with `await file.text()` and sends the text to the action; at 200 rows that is well under Next.js's 1 MB action limit. The row rules (`src/lib/validation/import.ts`), matching Appendix A:

```ts
import { z } from "zod";

const linkedin = z.string().trim().refine(
  (v) => v === "" || /^(https?:\/\/)?([a-z]{2,3}\.)?linkedin\.com\/in\//i.test(v),
  "Not a LinkedIn profile address",
);

export const importRowSchema = z.object({
  email: z.string().trim().toLowerCase().email("Missing or badly formatted email"),
  display_name: z.string().trim().min(1, "Missing name"),
  title: z.string().trim().default(""),
  organization: z.string().trim().default(""),
  linkedin: linkedin.default(""),
  subcommittees: z.string().default(""), // "Finance; Programs"
});
```

In `confirmImport`, insert invitations with `.onConflictDoNothing({ target: [enrollments.eventId, enrollments.invitedEmail] })`. That single line is what makes re-importing safe: existing attendees are skipped, never overwritten.

### Phase 4: Agenda

| Action | What it does | Watch for |
| --- | --- | --- |
| `saveTrack` / `deleteTrack` / `reorderTracks` | Track list | Deleting a track moves its sessions to "no track" (the schema does this) |
| `saveSession` | Creates or edits a session and its speaker list | Convert typed times with `localToUtc`; refine end after start; replace `session_speakers` rows in the same `db.batch` |
| `duplicateSession` | Copies a session and its speakers | New ID; title unchanged so staff just edit the time |
| `saveSpeaker` / `deleteSpeaker` | Speaker list | Empty contact fields are stored as null and never shown |

The overlap warning is a query, not a block. Run it after saving and show the result:

```ts
const clashes = await db.select({ title: agendaSessions.title }).from(agendaSessions).where(and(
  eq(agendaSessions.eventId, eventId),
  eq(agendaSessions.trackId, trackId),     // only when the session has a track
  ne(agendaSessions.id, sessionId),
  lt(agendaSessions.startsAt, endsAt),
  gt(agendaSessions.endsAt, startsAt),
));
```

Show descriptions and bios as plain text with the Tailwind class `whitespace-pre-line`. Never use `dangerouslySetInnerHTML`.

### Phase 5: Community

| Action or query | What it does | Watch for |
| --- | --- | --- |
| Directory query | Active enrollments for the event: name, title, organization, LinkedIn | Never select the email column |
| `saveSubcommittee` / `deleteSubcommittee` | Name and GroupMe link | Names unique per event |
| `setSubcommitteeMembers` | Adds and removes members | Return removed names so the page shows the GroupMe reminder |
| `postAnnouncement` / `editAnnouncement` / `togglePin` / `deleteAnnouncement` | Step 7's example, extended | Pinned first, then newest |
| `markAnnouncementsRead` | Records what an attendee has seen | Insert with `.onConflictDoNothing()` when they open the event home or announcements page |
| Event home GroupMe links | Subcommittee links for this attendee | Staff see all; attendees see only their own |

Unread counts for the dashboard badges, in one query:

```ts
const unread = await db
  .select({ eventId: announcements.eventId, n: count() })
  .from(announcements)
  .leftJoin(announcementReads, and(
    eq(announcementReads.announcementId, announcements.id),
    eq(announcementReads.userId, user.id),
  ))
  .where(and(inArray(announcements.eventId, eventIds), isNull(announcementReads.announcementId)))
  .groupBy(announcements.eventId);
```

### Phase 6: Event day

| Action or route | What it does | Watch for |
| --- | --- | --- |
| `checkIn` | Records arrival at a check-in point | Confirm the point and the enrollment both belong to this event |
| `undoCheckIn` | Deletes the check-in | The page asks for confirmation first |
| `saveCheckInPoint` / `deleteCheckInPoint` | Extra points for WHLI | "Arrival" cannot be deleted while it is the only point |
| Check-in export route | CSV with one column per point | Staff only; returns a file download |
| Activity feed | Newest 100 entries, unread count | Hide `access_key_failed`; opening `/admin/activity` updates `staff_activity_seen` |

The unique index from Step 4 makes double taps harmless:

```ts
await db.insert(checkIns)
  .values({ checkInPointId, enrollmentId, checkedInBy: user.id })
  .onConflictDoNothing(); // a second staff member tapping the same person does nothing
```

For the auto-refreshing table, the client component calls `router.refresh()` every 5 seconds inside a `useEffect` with `setInterval`. The CSV export is a route handler at `src/app/admin/events/[eventId]/check-in/export/route.ts` with a `GET` function. It checks the user is staff (return a 403 response if not), builds rows with `Papa.unparse(rows)`, and returns `new Response(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="check-ins.csv"' } })`.

**Check at the end of each phase:** run the full event setup flow from your outline (section 3, Key Flows) on a Netlify preview, as staff in one browser and as an attendee in a private window.

## Step 10: Add Sentry with personal data removed

Sentry reports server and browser errors as they happen. Add it once the account flows work, so the reports you see are real problems rather than setup noise.

1. Create a Sentry project (platform: Next.js) under the shared HERS account.
2. Run the setup wizard and answer its questions: `npx @sentry/wizard@latest -i nextjs`. Say **yes** to tracing and **no** to Session Replay, which records attendees' screens. The wizard creates `instrumentation.ts`, `instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` and a `global-error.tsx`, and edits `next.config`.
3. In both `sentry.server.config.ts` and `instrumentation-client.ts`, make sure these options are inside `Sentry.init({...})`:

```ts
sendDefaultPii: false,
tracesSampleRate: 0.1, // 10% is plenty at HERS's traffic and stays inside the free tier
beforeSend(event) {
  delete event.user;                 // no emails or IDs
  if (event.request) {
    delete event.request.data;       // no form contents
    delete event.request.cookies;
    delete event.request.headers;
  }
  return event;
},
```

4. In `src/lib/notify.ts`, add `import * as Sentry from "@sentry/nextjs";` and replace `console.error(error)` with `Sentry.captureException(error)`.
5. Copy the `SENTRY_AUTH_TOKEN` the wizard created (it is in `.env.sentry-build-plugin`); it goes into Netlify in Step 11 so error reports show your real code lines.
6. In Sentry, send alerts to a shared HERS address, not your personal inbox.

Errors thrown inside server actions and pages are reported automatically through the `onRequestError` hook the wizard adds to `instrumentation.ts`.

**Check:** open `/sentry-example-page` (the wizard creates it), click its button, and confirm the error appears in Sentry with no email, cookies or form data in it. Then delete the example page.

## Step 11: Deploy on Netlify with separate environments

Netlify builds every push from GitHub: a preview for each pull request on the `dev` database, and production from `main` on the `main` database. Set this up early (after Step 4 is fine) so every later step can be checked on a real preview.

1. In Netlify (shared HERS account), choose **Add new site → Import from Git**, pick the repository, and set the site name to the permanent address, e.g. `hersnetwork-events`. Netlify detects Next.js on its own.
2. Set the build command to `npm run db:migrate && npm run build`. Each deploy applies any new migration files to its own database before building.
3. Add environment variables under **Site configuration → Environment variables**, using **Different value for each deploy context**:

| Variable | Production | Deploy previews and branch deploys |
| --- | --- | --- |
| `DATABASE_URL` | `main` branch pooled URL | `dev` branch pooled URL |
| `BETTER_AUTH_SECRET` | A new random secret | A different random secret |
| `BETTER_AUTH_URL` | `https://hersnetwork-events.netlify.app` | Leave unset; Better Auth uses the preview's own address |
| `GROUPME_STAFF_BOT_ID` | The staff bot ID | Leave unset, or a bot in a test group, so tests never ping staff |
| `SENTRY_AUTH_TOKEN` | The token from Step 10 | Same value |

4. Confirm `trustedOrigins` in `src/lib/auth.ts` uses your real site name, so logins work on previews.
5. Your working routine from now on: create a Git branch, push, open a pull request, test the Netlify preview link, merge. Merging to `main` deploys production.
6. After the first production deploy, create the first real staff account with the production seed command from Step 5.

**Keep migrations safe.** Production migrations run automatically on merge, so read the SQL file `db:generate` creates before every merge. Prefer additive changes: add a new column, ship the code that uses it, and remove the old column in a later release. A migration that drops or renames something can lose data and cannot be undone by reverting code.

**Check:** a pull request shows a working preview where you can log in with a `dev` account. Production refuses those `dev` accounts, because it reads a different database.

## Step 12: Test every account path, then set up backups and handover

Before real attendees arrive, run every path below on a Netlify preview. Use one normal browser window for staff and one private window for an attendee, so their logins never mix.

**Account and access tests**

- [ ] Seeded staff link sets a password and lands on `/admin`; the same link fails the second time
- [ ] Staff invite link from `/admin/staff` creates a second staff account
- [ ] Attendee signs up with email + key and sees the event on `/dashboard`
- [ ] Wrong key, an email not on the list, and a revoked invitation all show the same error
- [ ] The 11th failed key attempt in an hour is refused
- [ ] Signing up again with an existing password says "Log in instead"
- [ ] Logged-in attendee adds a second event with its key
- [ ] Self-service reset works with a past event's key, logs out other sessions, and posts in the staff GroupMe
- [ ] Staff clears a password; the attendee sets a new one through `/signup`
- [ ] Staff changes an attendee's email; the attendee is logged out and logs in with the new email
- [ ] Changing to an email another account uses is blocked and names that account
- [ ] After the expiry date, the attendee sees the event read-only and a profile save is refused by the server
- [ ] A revoked attendee no longer sees the event, and its URL shows "not found"
- [ ] A deactivated account cannot log in; deactivating the last active staff account is refused
- [ ] An attendee visiting any `/admin` URL is sent to `/dashboard`
- [ ] Changing an ID in a URL to another event's item never shows or edits it

To test expiry without waiting, set the event's `access_expires_at` to yesterday in Drizzle Studio on `dev`.

**Weekly backup (Phase 7).** Neon's free tier keeps only a short restore history. A scheduled GitHub Action can run `pg_dump` against the production database once a week and upload the file to a HERS Dropbox folder, at no cost. It needs three repository secrets: the production database's direct (non-pooled) URL, and a Dropbox app key and refresh token. Build it after launch; it is self-contained and touches no app code.

**Handover (Phase 7).**

- [ ] Neon, Netlify, Sentry, GitHub and the GroupMe bot all sit under shared HERS accounts, with logins in the shared password manager
- [ ] The repository README covers: how to run the seed script on production, how to restore a backup, and which environment variable lives where
- [ ] The Technical Documentation is updated for self-service resets, the reset risk, and the Step 4 schema additions
- [ ] The staff guide covers event setup to cleanup, written for non-technical staff
- [ ] Library updates are reviewed monthly; Better Auth and Next.js updates are always tested on a preview first
