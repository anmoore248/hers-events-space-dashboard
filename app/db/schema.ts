import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  primaryKey,
  snakeCase,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

// Better Auth's tables (user, session, account, verification) live in auth-schema.ts.
// Re-exported so Drizzle sees one schema.
export * from "./auth-schema";

// In Drizzle 1.0, snake_case column names come from the table builder:
// a column written as startDate becomes start_date in the database.
const pgTable = snakeCase.table;

/* Shared column helpers. */
const id = () => uuid().primaryKey().defaultRandom();

const createdAt = () =>
  timestamp({ withTimezone: true }).defaultNow().notNull();

const eventRef = () =>
  uuid()
    .notNull()
    .references(() => events.id, { onDelete: "cascade" });

export const enrollmentStatus = pgEnum("enrollment_status", [
  "invited",
  "active",
  "revoked",
]);

/* ---------- Organization ---------- */

/* Organization-wide values */
export const settings = pgTable("settings", {
  key: text().primaryKey(), // e.g. "messageStaffGroupMe", "helpEmail"
  value: text().notNull(),
  updatedBy: text().references(() => user.id),
  updatedAt: createdAt(),
});

/* One-time staff signup links */
export const staffInvites = pgTable("staff_invites", {
  id: id(),
  email: text().notNull(),
  token: text().notNull().unique(),
  invitedBy: text()
    .notNull()
    .references(() => user.id),
  usedAt: timestamp({ withTimezone: true }),
  cancelledAt: timestamp({ withTimezone: true }),
  createdAt: createdAt(),
});

/* Who, what, when, and related event */
export const activityLog = pgTable(
  "activity_log",
  {
    id: id(),
    actorId: text().references(() => user.id),
    action: text().notNull(), // e.g. "password_reset", "email_changed"
    details: text().notNull(),
    eventId: uuid().references(() => events.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.createdAt)],
);

/* ---------- Events ---------- */

/* Details, time zone, dates, access expiry, access key, created by */
export const events = pgTable("events", {
  id: id(),
  name: text().notNull(),
  description: text().notNull().default(""),
  startDate: date().notNull(),
  endDate: date().notNull(),
  timeZone: text().notNull(), // IANA name, e.g. "America/New_York"
  location: text(),
  virtualDetails: text(),
  accessExpiry: date().notNull(),
  accessKey: text().notNull().unique(),
  createdBy: text()
    .notNull()
    .references(() => user.id),
  createdAt: createdAt(),
});

/* Lable, URL, order, optional visibility dates */
export const eventLinks = pgTable("event_links", {
  id: id(),
  eventId: eventRef(),
  label: text().notNull(),
  url: text().notNull(),
  sortOrder: integer().notNull().default(0),
  visibleFrom: timestamp({ withTimezone: true }),
  visibleUntil: timestamp({ withTimezone: true }),
});

/* ---------- Attendees ---------- */

/* User and event, invited email, status (invited, active, revoked), individual expiry, display name, title, organisation, LinkedIn URL */
export const enrollments = pgTable(
  "enrollments",
  {
    id: id(),
    eventId: eventRef(),
    userId: text().references(() => user.id), // empty until the invitee signs up
    invitedEmail: text().notNull(), // always stored in lowercase
    status: enrollmentStatus().notNull().default("invited"),
    individualExpiry: date(),
    // The profile is stored per enrollment, not per account (doc §10).
    displayName: text().notNull(),
    title: text(),
    organization: text(),
    linkedin: text(),
    createdAt: createdAt(),
  },
  (t) => [unique().on(t.eventId, t.invitedEmail), index().on(t.userId)],
);

/* Name and private GrouMe link */
export const subcommittees = pgTable("subcommittees", {
  id: id(),
  eventId: eventRef(),
  name: text().notNull(),
  groupMeUrl: text().notNull(),
});

/* Staff-assigned membership */
export const subcommitteeMembers = pgTable(
  "subcommittee_members",
  {
    subcommitteeId: uuid()
      .notNull()
      .references(() => subcommittees.id, { onDelete: "cascade" }),
    enrollmentId: uuid()
      .notNull()
      .references(() => enrollments.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.subcommitteeId, t.enrollmentId] })],
);

/* ---------- Agenda ---------- */

/* Parallel session tracks per event, with order */
export const tracks = pgTable("tracks", {
  id: id(),
  eventId: eventRef(),
  name: text().notNull(),
  sortOrder: integer().notNull().default(0),
});

// Named sessions_agenda so it never clashes with Better Auth's login "session" table.
export const agendaSessions = pgTable(
  "sessions_agenda",
  {
    id: id(),
    eventId: eventRef(),
    trackId: uuid().references(() => tracks.id, { onDelete: "set null" }), // empty = everyone
    title: text().notNull(),
    startsAt: timestamp({ withTimezone: true }).notNull(), // stored in UTC (doc §8.1)
    endsAt: timestamp({ withTimezone: true }).notNull(),
    location: text(),
    virtualLink: text(),
    description: text().notNull().default(""),
  },
  (t) => [index().on(t.eventId, t.startsAt)],
);

/* Name, title, organisation, bio, optional contact links */
export const speakers = pgTable("speakers", {
  id: id(),
  eventId: eventRef(),
  name: text().notNull(),
  title: text(),
  organization: text(),
  bio: text().notNull().default(""),
  email: text(),
  linkedin: text(),
  website: text(),
});

/* Which speakers are in which sessions, in order */
export const sessionSpeakers = pgTable(
  "session_speakers",
  {
    sessionId: uuid()
      .notNull()
      .references(() => agendaSessions.id, { onDelete: "cascade" }),
    speakerId: uuid()
      .notNull()
      .references(() => speakers.id, { onDelete: "cascade" }),
    sortOrder: integer().notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.sessionId, t.speakerId] })],
);

/* ---------- Announcements ---------- */

/* Text, pinned flag, sent by, timestamp */
export const announcements = pgTable("announcements", {
  id: id(),
  eventId: eventRef(),
  title: text().notNull(),
  body: text().notNull(),
  pinned: boolean().notNull().default(false),
  sentBy: text()
    .notNull()
    .references(() => user.id),
  createdAt: createdAt(),
  updatedAt: createdAt(),
});

/* What each user as seen, for unread badges */
export const announcementReads = pgTable(
  "announcement_reads",
  {
    announcementId: uuid()
      .notNull()
      .references(() => announcements.id, { onDelete: "cascade" }),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    readAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.announcementId, t.userId] })],
);

/* ---------- Check-in ---------- */

/* Event, label ("Arrival" by default), optional date */
export const checkInPoints = pgTable("check_in_points", {
  id: id(),
  eventId: eventRef(),
  label: text().notNull().default("Arrival"),
  date: date(),
});

/* Check-in point, enrolment time, checked-in by */
export const checkIns = pgTable(
  "check_ins",
  {
    id: id(),
    pointId: uuid()
      .notNull()
      .references(() => checkInPoints.id, { onDelete: "cascade" }),
    enrollmentId: uuid()
      .notNull()
      .references(() => enrollments.id, { onDelete: "cascade" }),
    checkedInAt: createdAt(),
    checkedInBy: text()
      .notNull()
      .references(() => user.id),
  },
  // One check-in per person per point: a second tap does nothing (doc §14.1).
  (t) => [unique().on(t.pointId, t.enrollmentId)],
);
