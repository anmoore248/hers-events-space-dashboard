import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

/**
 * How tables connect, for Drizzle's relational queries (db.query…findMany({ with: … })).
 * These don't change the database: the foreign keys in schema.ts do that.
 * They let you fetch, for example, an event with its sessions and their speakers in one call.
 */
export const relations = defineRelations(schema, (r) => ({
  /* ---------- Better Auth ---------- */
  user: {
    sessions: r.many.session(),
    accounts: r.many.account(),
    enrollments: r.many.enrollments(),
  },
  session: {
    user: r.one.user({
      from: r.session.userId,
      to: r.user.id,
      optional: false,
    }),
  },
  account: {
    user: r.one.user({
      from: r.account.userId,
      to: r.user.id,
      optional: false,
    }),
  },

  /* ---------- Events ---------- */
  events: {
    links: r.many.eventLinks(),
    enrollments: r.many.enrollments(),
    tracks: r.many.tracks(),
    sessions: r.many.agendaSessions(),
    speakers: r.many.speakers(),
    subcommittees: r.many.subcommittees(),
    announcements: r.many.announcements(),
    checkInPoints: r.many.checkInPoints(),
  },
  eventLinks: {
    event: r.one.events({
      from: r.eventLinks.eventId,
      to: r.events.id,
      optional: false,
    }),
  },

  /* ---------- Attendees ---------- */
  enrollments: {
    event: r.one.events({
      from: r.enrollments.eventId,
      to: r.events.id,
      optional: false,
    }),
    user: r.one.user({ from: r.enrollments.userId, to: r.user.id }), // empty until sign-up
    subcommittees: r.many.subcommittees({
      from: r.enrollments.id.through(r.subcommitteeMembers.enrollmentId),
      to: r.subcommittees.id.through(r.subcommitteeMembers.subcommitteeId),
    }),
    checkIns: r.many.checkIns(),
  },
  subcommittees: {
    event: r.one.events({
      from: r.subcommittees.eventId,
      to: r.events.id,
      optional: false,
    }),
    members: r.many.enrollments(),
  },

  /* ---------- Agenda ---------- */
  tracks: {
    event: r.one.events({
      from: r.tracks.eventId,
      to: r.events.id,
      optional: false,
    }),
    sessions: r.many.agendaSessions(),
  },
  agendaSessions: {
    event: r.one.events({
      from: r.agendaSessions.eventId,
      to: r.events.id,
      optional: false,
    }),
    track: r.one.tracks({ from: r.agendaSessions.trackId, to: r.tracks.id }), // empty = everyone
    speakers: r.many.speakers({
      from: r.agendaSessions.id.through(r.sessionSpeakers.sessionId),
      to: r.speakers.id.through(r.sessionSpeakers.speakerId),
    }),
  },
  speakers: {
    event: r.one.events({
      from: r.speakers.eventId,
      to: r.events.id,
      optional: false,
    }),
    sessions: r.many.agendaSessions(),
  },

  /* ---------- Announcements and check-in ---------- */
  announcements: {
    event: r.one.events({
      from: r.announcements.eventId,
      to: r.events.id,
      optional: false,
    }),
    sender: r.one.user({
      from: r.announcements.sentBy,
      to: r.user.id,
      optional: false,
    }), // can't reuse the column name sentBy
  },
  checkInPoints: {
    event: r.one.events({
      from: r.checkInPoints.eventId,
      to: r.events.id,
      optional: false,
    }),
    checkIns: r.many.checkIns(),
  },
  checkIns: {
    point: r.one.checkInPoints({
      from: r.checkIns.pointId,
      to: r.checkInPoints.id,
      optional: false,
    }),
    enrollment: r.one.enrollments({
      from: r.checkIns.enrollmentId,
      to: r.enrollments.id,
      optional: false,
    }),
  },
}));
