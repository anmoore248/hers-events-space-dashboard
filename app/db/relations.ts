import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
	accountInNeonAuth: {
		userInNeonAuth: r.one.userInNeonAuth({
			from: r.accountInNeonAuth.userId,
			to: r.userInNeonAuth.id
		}),
	},
	userInNeonAuth: {
		accountInNeonAuths: r.many.accountInNeonAuth(),
		organizationInNeonAuthsViaInvitationInNeonAuth: r.many.organizationInNeonAuth({
			from: r.userInNeonAuth.id.through(r.invitationInNeonAuth.inviterId),
			to: r.organizationInNeonAuth.id.through(r.invitationInNeonAuth.organizationId),
			alias: "userInNeonAuth_id_organizationInNeonAuth_id_via_invitationInNeonAuth"
		}),
		invitationInNeonAuths: r.many.invitationInNeonAuth(),
		organizationInNeonAuthsViaMemberInNeonAuth: r.many.organizationInNeonAuth({
			alias: "organizationInNeonAuth_id_userInNeonAuth_id_via_memberInNeonAuth"
		}),
		memberInNeonAuths: r.many.memberInNeonAuth(),
		sessionInNeonAuths: r.many.sessionInNeonAuth(),
	},
	organizationInNeonAuth: {
		userInNeonAuthsViaInvitationInNeonAuth: r.many.userInNeonAuth({
			alias: "userInNeonAuth_id_organizationInNeonAuth_id_via_invitationInNeonAuth"
		}),
		invitationInNeonAuths: r.many.invitationInNeonAuth(),
		userInNeonAuthsViaMemberInNeonAuth: r.many.userInNeonAuth({
			from: r.organizationInNeonAuth.id.through(r.memberInNeonAuth.organizationId),
			to: r.userInNeonAuth.id.through(r.memberInNeonAuth.userId),
			alias: "organizationInNeonAuth_id_userInNeonAuth_id_via_memberInNeonAuth"
		}),
		memberInNeonAuths: r.many.memberInNeonAuth(),
	},
	invitationInNeonAuth: {
		userInNeonAuth: r.one.userInNeonAuth({
			from: r.invitationInNeonAuth.inviterId,
			to: r.userInNeonAuth.id
		}),
		organizationInNeonAuth: r.one.organizationInNeonAuth({
			from: r.invitationInNeonAuth.organizationId,
			to: r.organizationInNeonAuth.id
		}),
	},
	memberInNeonAuth: {
		organizationInNeonAuth: r.one.organizationInNeonAuth({
			from: r.memberInNeonAuth.organizationId,
			to: r.organizationInNeonAuth.id
		}),
		userInNeonAuth: r.one.userInNeonAuth({
			from: r.memberInNeonAuth.userId,
			to: r.userInNeonAuth.id
		}),
	},
	sessionInNeonAuth: {
		userInNeonAuth: r.one.userInNeonAuth({
			from: r.sessionInNeonAuth.userId,
			to: r.userInNeonAuth.id
		}),
	},
	account: {
		user: r.one.user({
			from: r.account.userId,
			to: r.user.id
		}),
	},
	user: {
		accounts: r.many.account(),
		eventsViaActivityLog: r.many.events({
			from: r.user.id.through(r.activityLog.actorId),
			to: r.events.id.through(r.activityLog.eventId),
			alias: "user_id_events_id_via_activityLog"
		}),
		activityLogs: r.many.activityLog(),
		announcementsViaAnnouncementReads: r.many.announcements({
			alias: "announcements_id_user_id_via_announcementReads"
		}),
		announcementReads: r.many.announcementReads(),
		eventsViaAnnouncements: r.many.events({
			alias: "events_id_user_id_via_announcements"
		}),
		announcementsSentBy: r.many.announcements({
			alias: "announcements_sentBy_user_id"
		}),
		checkIns: r.many.checkIns(),
		eventsViaEnrollments: r.many.events({
			alias: "events_id_user_id_via_enrollments"
		}),
		enrollments: r.many.enrollments(),
		eventsCreatedBy: r.many.events({
			alias: "events_createdBy_user_id"
		}),
		sessions: r.many.session(),
		settings: r.many.settings(),
		staffInvites: r.many.staffInvites(),
	},
	events: {
		usersViaActivityLog: r.many.user({
			alias: "user_id_events_id_via_activityLog"
		}),
		activityLogs: r.many.activityLog(),
		usersViaAnnouncements: r.many.user({
			from: r.events.id.through(r.announcements.eventId),
			to: r.user.id.through(r.announcements.sentBy),
			alias: "events_id_user_id_via_announcements"
		}),
		announcements: r.many.announcements(),
		checkInPoints: r.many.checkInPoints(),
		usersViaEnrollments: r.many.user({
			from: r.events.id.through(r.enrollments.eventId),
			to: r.user.id.through(r.enrollments.userId),
			alias: "events_id_user_id_via_enrollments"
		}),
		enrollments: r.many.enrollments(),
		eventLinks: r.many.eventLinks(),
		user: r.one.user({
			from: r.events.createdBy,
			to: r.user.id,
			alias: "events_createdBy_user_id"
		}),
		tracksViaSessionsAgenda: r.many.tracks({
			from: r.events.id.through(r.sessionsAgenda.eventId),
			to: r.tracks.id.through(r.sessionsAgenda.trackId),
			alias: "events_id_tracks_id_via_sessionsAgenda"
		}),
		sessionsAgenda: r.many.sessionsAgenda(),
		speakers: r.many.speakers(),
		subcommittees: r.many.subcommittees(),
		tracksEventId: r.many.tracks({
			alias: "tracks_eventId_events_id"
		}),
	},
	activityLog: {
		user: r.one.user({
			from: r.activityLog.actorId,
			to: r.user.id
		}),
		event: r.one.events({
			from: r.activityLog.eventId,
			to: r.events.id
		}),
	},
	announcements: {
		users: r.many.user({
			from: r.announcements.id.through(r.announcementReads.announcementId),
			to: r.user.id.through(r.announcementReads.userId),
			alias: "announcements_id_user_id_via_announcementReads"
		}),
		announcementReads: r.many.announcementReads(),
		event: r.one.events({
			from: r.announcements.eventId,
			to: r.events.id
		}),
		user: r.one.user({
			from: r.announcements.sentBy,
			to: r.user.id,
			alias: "announcements_sentBy_user_id"
		}),
	},
	announcementReads: {
		announcement: r.one.announcements({
			from: r.announcementReads.announcementId,
			to: r.announcements.id
		}),
		user: r.one.user({
			from: r.announcementReads.userId,
			to: r.user.id
		}),
	},
	checkInPoints: {
		event: r.one.events({
			from: r.checkInPoints.eventId,
			to: r.events.id
		}),
		checkIns: r.many.checkIns(),
	},
	checkIns: {
		user: r.one.user({
			from: r.checkIns.checkedInBy,
			to: r.user.id
		}),
		enrollment: r.one.enrollments({
			from: r.checkIns.enrollmentId,
			to: r.enrollments.id
		}),
		checkInPoint: r.one.checkInPoints({
			from: r.checkIns.pointId,
			to: r.checkInPoints.id
		}),
	},
	enrollments: {
		checkIns: r.many.checkIns(),
		event: r.one.events({
			from: r.enrollments.eventId,
			to: r.events.id
		}),
		user: r.one.user({
			from: r.enrollments.userId,
			to: r.user.id
		}),
		subcommittees: r.many.subcommittees({
			from: r.enrollments.id.through(r.subcommitteeMembers.enrollmentId),
			to: r.subcommittees.id.through(r.subcommitteeMembers.subcommitteeId)
		}),
		subcommitteeMembers: r.many.subcommitteeMembers(),
	},
	eventLinks: {
		event: r.one.events({
			from: r.eventLinks.eventId,
			to: r.events.id
		}),
	},
	session: {
		user: r.one.user({
			from: r.session.userId,
			to: r.user.id
		}),
	},
	sessionsAgenda: {
		speakers: r.many.speakers({
			from: r.sessionsAgenda.id.through(r.sessionSpeakers.sessionId),
			to: r.speakers.id.through(r.sessionSpeakers.speakerId)
		}),
		sessionSpeakers: r.many.sessionSpeakers(),
		event: r.one.events({
			from: r.sessionsAgenda.eventId,
			to: r.events.id
		}),
		track: r.one.tracks({
			from: r.sessionsAgenda.trackId,
			to: r.tracks.id
		}),
	},
	speakers: {
		sessionsAgenda: r.many.sessionsAgenda(),
		sessionSpeakers: r.many.sessionSpeakers(),
		event: r.one.events({
			from: r.speakers.eventId,
			to: r.events.id
		}),
	},
	sessionSpeakers: {
		sessionsAgendum: r.one.sessionsAgenda({
			from: r.sessionSpeakers.sessionId,
			to: r.sessionsAgenda.id
		}),
		speaker: r.one.speakers({
			from: r.sessionSpeakers.speakerId,
			to: r.speakers.id
		}),
	},
	tracks: {
		events: r.many.events({
			alias: "events_id_tracks_id_via_sessionsAgenda"
		}),
		sessionsAgenda: r.many.sessionsAgenda(),
		event: r.one.events({
			from: r.tracks.eventId,
			to: r.events.id,
			alias: "tracks_eventId_events_id"
		}),
	},
	settings: {
		user: r.one.user({
			from: r.settings.updatedBy,
			to: r.user.id
		}),
	},
	staffInvites: {
		user: r.one.user({
			from: r.staffInvites.invitedBy,
			to: r.user.id
		}),
	},
	subcommittees: {
		enrollments: r.many.enrollments(),
		subcommitteeMembers: r.many.subcommitteeMembers(),
		event: r.one.events({
			from: r.subcommittees.eventId,
			to: r.events.id
		}),
	},
	subcommitteeMembers: {
		enrollment: r.one.enrollments({
			from: r.subcommitteeMembers.enrollmentId,
			to: r.enrollments.id
		}),
		subcommittee: r.one.subcommittees({
			from: r.subcommitteeMembers.subcommitteeId,
			to: r.subcommittees.id
		}),
	},
}))