/**
 * HERS Events database schema (doc §16), for Drizzle ORM 1.0 and Neon Postgres.
 *
 * Three groups of tables:
 *  1. Neon Auth's user table (neon_auth.user). Neon Auth is managed Better Auth:
 *     Neon creates and updates everything in the neon_auth schema, so the app
 *     only reads it here and never writes it directly. Changes go through the
 *     Neon Auth API (lib/auth/admin.ts). drizzle.config.ts leaves the schema alone.
 *  2. members: the platform's own data about each account (staff or attendee,
 *     password cleared, activity log last opened), one row per neon_auth user.
 *  3. The platform's tables, named as in the data model diagram. The agenda table is
 *     sessions_agenda so it never clashes with Neon Auth's login "session" table.
 */
import { sql } from "drizzle-orm";
import {
  bigint, boolean, date, index, integer, pgEnum, pgSchema, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid,
} from "drizzle-orm/pg-core";

/* ------------------------------- Neon Auth ------------------------------ */

const neonAuth = pgSchema("neon_auth").existing();

/** Read-only. Column names are Neon Auth's own (camelCase). banned = deactivated. */
export const user = neonAuth.table("user", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull(),
  role: text("role"), // Neon Auth's own role ("user" or "admin"), not the platform's
  banned: boolean("banned"),
  banReason: text("banReason"),
  banExpires: timestamp("banExpires", { withTimezone: true }),
});

/* -------------------------------- Members ------------------------------- */

/**
 * The platform's side of each account. Neon Auth's "admin" role belongs to the
 * service account alone (it can call the admin API), so staff/attendee lives here.
 * An account with no members row (such as the service account) can't use the app.
 */
export const members = pgTable("members", {
  userId: uuid("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  role: text("role").default("attendee").notNull(), // "staff" | "attendee"
  // Staff cleared the password (doc §5.4): the person sets a new one through sign-up.
  passwordCleared: boolean("password_cleared").default(false).notNull(),
  // When this staff member last opened the activity log (unread badge).
  activitySeenAt: timestamp("activity_seen_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** The platform's own limits on sign-in, sign-up and key checks (lib/rate-limit.ts). */
export const rateLimit = pgTable("rate_limit", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

/* -------------------------------- Platform ------------------------------ */

export const enrollmentStatus = pgEnum("enrollment_status", ["invited", "active", "revoked"]);

/** Organization-wide values staff edit on the Settings page (doc §15.2). */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedBy: uuid("updated_by").references(() => user.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** One-time staff sign-up links (doc §7). user_id is set when the link resets an existing staff password. */
export const staffInvites = pgTable(
  "staff_invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    token: text("token").notNull().unique(),
    email: text("email").notNull(),
    userId: uuid("user_id").references(() => user.id, { onDelete: "cascade" }),
    createdBy: uuid("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  },
  (t) => [index("staff_invites_email_idx").on(t.email)],
);

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description").default("").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  timeZone: text("time_zone").notNull(),
  location: text("location").default("").notNull(),
  virtualDetails: text("virtual_details"),
  accessExpiry: date("access_expiry").notNull(),
  accessKey: text("access_key").notNull().unique(),
  groupMeClosedAt: timestamp("groupme_closed_at", { withTimezone: true }),
  createdBy: uuid("created_by").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const eventLinks = pgTable(
  "event_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    url: text("url").notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    visibleFrom: timestamp("visible_from", { withTimezone: true }),
    visibleUntil: timestamp("visible_until", { withTimezone: true }),
  },
  (t) => [index("event_links_event_idx").on(t.eventId)],
);

/** One person in one event, with their profile for that event (doc §6, §10). */
export const enrollments = pgTable(
  "enrollments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => user.id, { onDelete: "set null" }), // null until sign-up
    invitedEmail: text("invited_email").notNull(), // always lower case
    status: enrollmentStatus("status").default("invited").notNull(),
    individualExpiry: date("individual_expiry"),
    displayName: text("display_name").notNull(),
    title: text("title"),
    organization: text("organization"),
    linkedin: text("linkedin"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    activatedAt: timestamp("activated_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("enrollments_event_email_uq").on(t.eventId, t.invitedEmail),
    uniqueIndex("enrollments_event_user_uq").on(t.eventId, t.userId).where(sql`${t.userId} is not null`),
    index("enrollments_user_idx").on(t.userId),
  ],
);

export const tracks = pgTable(
  "tracks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
  },
  (t) => [index("tracks_event_idx").on(t.eventId)],
);

/** Agenda sessions. Times are stored in UTC and shown in the event's time zone (doc §8.1). */
export const sessionsAgenda = pgTable(
  "sessions_agenda",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
    trackId: uuid("track_id").references(() => tracks.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    location: text("location"),
    virtualLink: text("virtual_link"),
    description: text("description").default("").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("sessions_agenda_event_idx").on(t.eventId, t.startsAt)],
);

export const speakers = pgTable(
  "speakers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    title: text("title"),
    organization: text("organization"),
    bio: text("bio").default("").notNull(),
    email: text("email"),
    linkedin: text("linkedin"),
    website: text("website"),
  },
  (t) => [index("speakers_event_idx").on(t.eventId)],
);

export const sessionSpeakers = pgTable(
  "session_speakers",
  {
    sessionId: uuid("session_id").notNull().references(() => sessionsAgenda.id, { onDelete: "cascade" }),
    speakerId: uuid("speaker_id").notNull().references(() => speakers.id, { onDelete: "cascade" }),
    displayOrder: integer("display_order").default(0).notNull(),
  },
  (t) => [primaryKey({ columns: [t.sessionId, t.speakerId] }), index("session_speakers_speaker_idx").on(t.speakerId)],
);

export const subcommittees = pgTable(
  "subcommittees",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    groupmeLink: text("groupme_link").default("").notNull(),
  },
  (t) => [index("subcommittees_event_idx").on(t.eventId)],
);

export const subcommitteeMembers = pgTable(
  "subcommittee_members",
  {
    subcommitteeId: uuid("subcommittee_id").notNull().references(() => subcommittees.id, { onDelete: "cascade" }),
    enrollmentId: uuid("enrollment_id").notNull().references(() => enrollments.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.subcommitteeId, t.enrollmentId] }), index("subcommittee_members_enrollment_idx").on(t.enrollmentId)],
);

export const announcements = pgTable(
  "announcements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    pinned: boolean("pinned").default(false).notNull(),
    sentBy: uuid("sent_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  (t) => [index("announcements_event_idx").on(t.eventId, t.createdAt)],
);

export const announcementReads = pgTable(
  "announcement_reads",
  {
    announcementId: uuid("announcement_id").notNull().references(() => announcements.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    readAt: timestamp("read_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.announcementId, t.userId] })],
);

/** "Arrival" by default; one per meeting for programs like the Weekend HLI (doc §14.2). */
export const checkInPoints = pgTable(
  "check_in_points",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    pointDate: date("point_date"),
    displayOrder: integer("display_order").default(0).notNull(),
  },
  (t) => [index("check_in_points_event_idx").on(t.eventId)],
);

export const checkIns = pgTable(
  "check_ins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    checkInPointId: uuid("check_in_point_id").notNull().references(() => checkInPoints.id, { onDelete: "cascade" }),
    enrollmentId: uuid("enrollment_id").notNull().references(() => enrollments.id, { onDelete: "cascade" }),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }).defaultNow().notNull(),
    checkedInBy: uuid("checked_in_by").references(() => user.id, { onDelete: "set null" }),
  },
  // One check-in per person per point: a second tap does nothing.
  (t) => [uniqueIndex("check_ins_point_enrollment_uq").on(t.checkInPointId, t.enrollmentId)],
);

export const activityLog = pgTable(
  "activity_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => user.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    details: text("details").default("").notNull(),
    eventId: uuid("event_id").references(() => events.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("activity_log_created_idx").on(t.createdAt)],
);
