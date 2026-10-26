import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

/** Relations for Drizzle's relational queries (db.query.*), using the 1.0 defineRelations API. */
export const relations = defineRelations(schema, (r) => ({
  user: {
    member: r.one.members({ from: r.user.id, to: r.members.userId }),
    enrollments: r.many.enrollments(),
  },
  members: { user: r.one.user({ from: r.members.userId, to: r.user.id }) },
  events: {
    creator: r.one.user({ from: r.events.createdBy, to: r.user.id }),
    links: r.many.eventLinks(),
    enrollments: r.many.enrollments(),
    tracks: r.many.tracks(),
    sessions: r.many.sessionsAgenda(),
    speakers: r.many.speakers(),
    subcommittees: r.many.subcommittees(),
    announcements: r.many.announcements(),
    checkInPoints: r.many.checkInPoints(),
  },
  eventLinks: { event: r.one.events({ from: r.eventLinks.eventId, to: r.events.id }) },
  enrollments: {
    event: r.one.events({ from: r.enrollments.eventId, to: r.events.id }),
    user: r.one.user({ from: r.enrollments.userId, to: r.user.id }),
    subcommittees: r.many.subcommittees({
      from: r.enrollments.id.through(r.subcommitteeMembers.enrollmentId),
      to: r.subcommittees.id.through(r.subcommitteeMembers.subcommitteeId),
    }),
    checkIns: r.many.checkIns(),
  },
  tracks: {
    event: r.one.events({ from: r.tracks.eventId, to: r.events.id }),
    sessions: r.many.sessionsAgenda(),
  },
  sessionsAgenda: {
    event: r.one.events({ from: r.sessionsAgenda.eventId, to: r.events.id }),
    track: r.one.tracks({ from: r.sessionsAgenda.trackId, to: r.tracks.id }),
    speakers: r.many.speakers({
      from: r.sessionsAgenda.id.through(r.sessionSpeakers.sessionId),
      to: r.speakers.id.through(r.sessionSpeakers.speakerId),
    }),
  },
  speakers: { event: r.one.events({ from: r.speakers.eventId, to: r.events.id }) },
  subcommittees: {
    event: r.one.events({ from: r.subcommittees.eventId, to: r.events.id }),
    members: r.many.enrollments({
      from: r.subcommittees.id.through(r.subcommitteeMembers.subcommitteeId),
      to: r.enrollments.id.through(r.subcommitteeMembers.enrollmentId),
    }),
  },
  announcements: {
    event: r.one.events({ from: r.announcements.eventId, to: r.events.id }),
    sender: r.one.user({ from: r.announcements.sentBy, to: r.user.id }),
    reads: r.many.announcementReads(),
  },
  announcementReads: { announcement: r.one.announcements({ from: r.announcementReads.announcementId, to: r.announcements.id }) },
  checkInPoints: {
    event: r.one.events({ from: r.checkInPoints.eventId, to: r.events.id }),
    checkIns: r.many.checkIns(),
  },
  checkIns: {
    point: r.one.checkInPoints({ from: r.checkIns.checkInPointId, to: r.checkInPoints.id }),
    enrollment: r.one.enrollments({ from: r.checkIns.enrollmentId, to: r.enrollments.id }),
    checkedInByUser: r.one.user({ from: r.checkIns.checkedInBy, to: r.user.id }),
  },
  activityLog: {
    actor: r.one.user({ from: r.activityLog.actorId, to: r.user.id }),
    event: r.one.events({ from: r.activityLog.eventId, to: r.events.id }),
  },
}));
