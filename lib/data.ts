import "server-only";
import { cache } from "react";
import { and, asc, count, desc, eq, gt, ilike, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import {
  activityLog, announcementReads, announcements, checkIns, checkInPoints, enrollments, eventLinks, events,
  sessionSpeakers, sessionsAgenda, settings, speakers, staffInvites, subcommitteeMembers, subcommittees, tracks, members, user,
} from "@/lib/db/schema";
import { appUrl } from "@/lib/app-url";
import { getCurrentUser as currentUser, requireStaff, requireUser } from "@/lib/auth/session";
import { getEventAccess, isUuid } from "@/lib/access";
import { addDays, dateString, todayIn, utcToLocalInput, utcToZoned } from "@/lib/time";
import type {
  ActivityFilters, ActivityItem, ActivityPage, Agenda, AgendaSession, Announcement, CheckInPoint, CheckInSheet, CurrentUser,
  DirectoryPerson, Enrollment, GroupMeCleanup, EventHome, EventLink, EventStats, EventStatus, EventSummary, HersEvent, MyEvent, MyProfile,
  PersonAccount, PersonStatus, SessionDetail, Settings, Speaker, SpeakerDetail, SpeakerRow, StaffInvite, StaffRow, Subcommittee, Track,
} from "./types";

/**
 * Every read the interface makes. Each function checks who is asking: staff
 * functions require a staff session, and event functions go through the
 * shared access check (lib/access.ts), so data never leaks to a page that
 * forgot to check.
 */

export const DEFAULT_SETTINGS: Settings = {
  messageStaffGroupMe: "",
  helpEmail: "hers@hersnetwork.org",
  groupMeCleanupDays: 30,
};

const opt = (v: string | null | undefined) => (v ? v : undefined);
const iso = (d: Date | string) => (typeof d === "string" ? new Date(d) : d).toISOString();

/* ----------------------------- everyone ----------------------------- */

export async function getCurrentUser(): Promise<CurrentUser | null> {
  return currentUser();
}

export const getSettings = cache(async (): Promise<Settings> => {
  const rows = await db
    .select({ key: settings.key, value: settings.value, updatedAt: settings.updatedAt, updatedByName: user.name })
    .from(settings)
    .leftJoin(user, eq(user.id, settings.updatedBy));
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const latest = rows.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
  return {
    messageStaffGroupMe: map.get("messageStaffGroupMe") ?? DEFAULT_SETTINGS.messageStaffGroupMe,
    helpEmail: map.get("helpEmail") ?? DEFAULT_SETTINGS.helpEmail,
    groupMeCleanupDays: Number(map.get("groupMeCleanupDays") ?? DEFAULT_SETTINGS.groupMeCleanupDays) || DEFAULT_SETTINGS.groupMeCleanupDays,
    updatedByName: latest?.updatedByName ?? undefined,
    updatedAt: latest ? iso(latest.updatedAt) : undefined,
  };
});

type EventRow = typeof events.$inferSelect;

export function eventStatus(e: Pick<EventRow, "timeZone" | "startDate" | "accessExpiry">): EventStatus {
  const today = todayIn(e.timeZone);
  if (today < dateString(e.startDate)!) return "Upcoming";
  if (today > dateString(e.accessExpiry)!) return "Expired";
  return "Active";
}

function toHersEvent(e: EventRow, createdByName?: string | null): HersEvent {
  return {
    id: e.id,
    name: e.name,
    description: e.description,
    startDate: dateString(e.startDate)!,
    endDate: dateString(e.endDate)!,
    location: e.location,
    virtualDetails: opt(e.virtualDetails),
    timeZone: e.timeZone,
    accessExpiry: dateString(e.accessExpiry)!,
    accessKey: e.accessKey,
    status: eventStatus(e),
    createdByName: createdByName ?? undefined,
    createdAt: iso(e.createdAt),
  };
}

/** The event, for anyone with access to it. Attendees never see the access key. */
export const getEvent = cache(async (eventId: string): Promise<HersEvent | null> => {
  if ((await getEventAccess(eventId)) === "none") return null;
  const [row] = await db
    .select({ e: events, creator: user.name })
    .from(events)
    .leftJoin(user, eq(user.id, events.createdBy))
    .where(eq(events.id, eventId))
    .limit(1);
  if (!row) return null;
  const me = await currentUser();
  const e = toHersEvent(row.e, row.creator);
  return me?.role === "staff" ? e : { ...e, accessKey: "" };
});

/* ----------------------------- attendee ----------------------------- */

/** The signed-in person's own enrollment in an event. */
const myEnrollment = cache(async (eventId: string) => {
  const me = await currentUser();
  if (!me || !isUuid(eventId)) return null;
  const [row] = await db
    .select()
    .from(enrollments)
    .where(and(eq(enrollments.eventId, eventId), eq(enrollments.userId, me.id), eq(enrollments.status, "active")))
    .limit(1);
  return row ?? null;
});

export async function getMyEvents(): Promise<MyEvent[]> {
  const me = await requireUser();
  const rows = await db
    .select({ e: events, individualExpiry: enrollments.individualExpiry })
    .from(enrollments)
    .innerJoin(events, eq(events.id, enrollments.eventId))
    .where(and(eq(enrollments.userId, me.id), eq(enrollments.status, "active")))
    .orderBy(asc(events.startDate));
  if (!rows.length) return [];

  const ids = rows.map((r) => r.e.id);
  const unread = await db
    .select({ eventId: announcements.eventId, n: count() })
    .from(announcements)
    .leftJoin(announcementReads, and(eq(announcementReads.announcementId, announcements.id), eq(announcementReads.userId, me.id)))
    .where(and(inArray(announcements.eventId, ids), isNull(announcementReads.userId)))
    .groupBy(announcements.eventId);

  const mine = rows.map(({ e, individualExpiry }) => {
    const expiry = dateString(individualExpiry) ?? dateString(e.accessExpiry)!;
    return {
      id: e.id,
      name: e.name,
      startDate: dateString(e.startDate)!,
      endDate: dateString(e.endDate)!,
      location: e.location,
      readOnly: todayIn(e.timeZone) > expiry,
      unread: unread.find((u) => u.eventId === e.id)?.n ?? 0,
    };
  });
  // Current events soonest first; past events most recent first.
  return [...mine.filter((e) => !e.readOnly), ...mine.filter((e) => e.readOnly).reverse()];
}

export async function getMyProfile(): Promise<MyProfile | null> {
  const me = await requireUser();
  const rows = await db
    .select({ en: enrollments, e: events })
    .from(enrollments)
    .innerJoin(events, eq(events.id, enrollments.eventId))
    .where(and(eq(enrollments.userId, me.id), eq(enrollments.status, "active")))
    .orderBy(desc(events.startDate));
  if (!rows.length) return null;

  const withState = rows.map(({ en, e }) => {
    const expiry = dateString(en.individualExpiry) ?? dateString(e.accessExpiry)!;
    return { en, e, frozen: todayIn(e.timeZone) > expiry };
  });
  // Prefill from the most recent active enrollment (or the most recent of any).
  const source = (withState.find((r) => !r.frozen) ?? withState[0]).en;
  return {
    displayName: source.displayName,
    title: source.title ?? "",
    organization: source.organization ?? "",
    linkedin: source.linkedin ?? "",
    events: withState.map((r) => ({ id: r.e.id, name: r.e.name, frozen: r.frozen })),
  };
}

function toSession(
  s: typeof sessionsAgenda.$inferSelect,
  timeZone: string,
  speakerIds: string[],
): AgendaSession {
  const start = utcToZoned(s.startsAt, timeZone);
  const end = utcToZoned(s.endsAt, timeZone);
  return {
    id: s.id,
    title: s.title,
    date: start.date,
    start: start.time,
    end: end.date === start.date ? end.time : "23:59",
    trackId: opt(s.trackId),
    location: opt(s.location),
    virtualLink: opt(s.virtualLink),
    speakerIds,
    description: s.description,
  };
}

function toSpeaker(s: typeof speakers.$inferSelect): Speaker {
  return {
    id: s.id, name: s.name, title: opt(s.title), organization: opt(s.organization), bio: s.bio,
    email: opt(s.email), linkedin: opt(s.linkedin), website: opt(s.website),
  };
}

const toTrack = (t: typeof tracks.$inferSelect): Track => ({ id: t.id, name: t.name, order: t.displayOrder });

/** Speaker ids per session, in display order. */
async function speakerIdsBySession(sessionIds: string[]) {
  const map = new Map<string, string[]>();
  if (!sessionIds.length) return map;
  const rows = await db
    .select()
    .from(sessionSpeakers)
    .where(inArray(sessionSpeakers.sessionId, sessionIds))
    .orderBy(asc(sessionSpeakers.displayOrder));
  for (const r of rows) map.set(r.sessionId, [...(map.get(r.sessionId) ?? []), r.speakerId]);
  return map;
}

export const getAgenda = cache(async (eventId: string): Promise<Agenda> => {
  const empty = { sessions: [], tracks: [], speakers: [] };
  if ((await getEventAccess(eventId)) === "none") return empty;
  const [event] = await db.select({ timeZone: events.timeZone }).from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) return empty;

  const [sessionRows, trackRows, speakerRows] = await Promise.all([
    db.select().from(sessionsAgenda).where(eq(sessionsAgenda.eventId, eventId)).orderBy(asc(sessionsAgenda.startsAt), asc(sessionsAgenda.endsAt)),
    db.select().from(tracks).where(eq(tracks.eventId, eventId)).orderBy(asc(tracks.displayOrder), asc(tracks.name)),
    db.select().from(speakers).where(eq(speakers.eventId, eventId)).orderBy(asc(speakers.name)),
  ]);
  const ids = await speakerIdsBySession(sessionRows.map((s) => s.id));
  return {
    sessions: sessionRows.map((s) => toSession(s, event.timeZone, ids.get(s.id) ?? [])),
    tracks: trackRows.map(toTrack),
    speakers: speakerRows.map(toSpeaker),
  };
});

export async function getEventHome(eventId: string): Promise<EventHome> {
  const empty: EventHome = { unreadCount: 0, upNext: [], tracks: [], links: [], laterLinks: [], mySubcommittees: [] };
  if ((await getEventAccess(eventId)) === "none") return empty;
  const me = (await currentUser())!;
  const [event] = await db.select({ timeZone: events.timeZone }).from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) return empty;
  const now = new Date();

  const [list, upcoming, trackRows, linkRows, enrollment] = await Promise.all([
    getAnnouncementList(eventId, me.id),
    db
      .select()
      .from(sessionsAgenda)
      .where(and(eq(sessionsAgenda.eventId, eventId), gt(sessionsAgenda.endsAt, now)))
      .orderBy(asc(sessionsAgenda.startsAt))
      .limit(2),
    db.select().from(tracks).where(eq(tracks.eventId, eventId)),
    db
      .select()
      .from(eventLinks)
      .where(and(eq(eventLinks.eventId, eventId), or(isNull(eventLinks.visibleUntil), gt(eventLinks.visibleUntil, now))))
      .orderBy(asc(eventLinks.displayOrder)),
    myEnrollment(eventId),
  ]);

  const ids = await speakerIdsBySession(upcoming.map((s) => s.id));
  const toLink = (l: typeof eventLinks.$inferSelect): EventLink => ({
    id: l.id, label: l.label, url: l.url, order: l.displayOrder,
    visibleFrom: utcToLocalInput(l.visibleFrom, event.timeZone),
    visibleUntil: utcToLocalInput(l.visibleUntil, event.timeZone),
  });

  // Staff see every subcommittee link; attendees only their own (doc §13).
  const subRows =
    me.role === "staff"
      ? await db.select().from(subcommittees).where(eq(subcommittees.eventId, eventId)).orderBy(asc(subcommittees.name))
      : enrollment
        ? await db
            .select({ s: subcommittees })
            .from(subcommitteeMembers)
            .innerJoin(subcommittees, eq(subcommittees.id, subcommitteeMembers.subcommitteeId))
            .where(eq(subcommitteeMembers.enrollmentId, enrollment.id))
            .orderBy(asc(subcommittees.name))
            .then((r) => r.map((x) => x.s))
        : [];

  return {
    pinned: list.find((a) => a.pinned),
    unreadCount: list.filter((a) => a.unread).length,
    upNext: upcoming.map((s) => toSession(s, event.timeZone, ids.get(s.id) ?? [])),
    tracks: trackRows.map(toTrack),
    links: linkRows.filter((l) => !l.visibleFrom || l.visibleFrom <= now).map(toLink),
    laterLinks: linkRows.filter((l) => l.visibleFrom && l.visibleFrom > now).map(toLink),
    mySubcommittees: subRows.map((s) => ({ id: s.id, name: s.name, groupMeUrl: s.groupmeLink, memberCount: 0 })),
  };
}

export async function getSessionDetail(eventId: string, sessionId: string): Promise<SessionDetail | null> {
  if (!isUuid(sessionId)) return null;
  const agenda = await getAgenda(eventId);
  const session = agenda.sessions.find((s) => s.id === sessionId);
  if (!session) return null;
  return {
    session,
    track: agenda.tracks.find((t) => t.id === session.trackId),
    speakers: session.speakerIds.map((id) => agenda.speakers.find((s) => s.id === id)).filter((s): s is Speaker => !!s),
  };
}

export async function getSpeakers(eventId: string): Promise<SpeakerRow[]> {
  const agenda = await getAgenda(eventId);
  return agenda.speakers.map((s) => ({ ...s, sessionCount: agenda.sessions.filter((x) => x.speakerIds.includes(s.id)).length }));
}

export async function getSpeakerDetail(eventId: string, speakerId: string): Promise<SpeakerDetail | null> {
  if (!isUuid(speakerId)) return null;
  const agenda = await getAgenda(eventId);
  const speaker = agenda.speakers.find((s) => s.id === speakerId);
  if (!speaker) return null;
  return { speaker, sessions: agenda.sessions.filter((s) => s.speakerIds.includes(speakerId)) };
}

/** Everyone signed up for the event: name, title, organization, LinkedIn. Never emails (doc §10). */
export async function getDirectory(eventId: string): Promise<DirectoryPerson[]> {
  if ((await getEventAccess(eventId)) === "none") return [];
  const rows = await db
    .select({
      id: enrollments.id, displayName: enrollments.displayName, title: enrollments.title,
      organization: enrollments.organization, linkedin: enrollments.linkedin,
    })
    .from(enrollments)
    .where(and(eq(enrollments.eventId, eventId), eq(enrollments.status, "active")))
    .orderBy(asc(sql`lower(${enrollments.displayName})`));
  return rows.map((r) => ({ id: r.id, displayName: r.displayName, title: opt(r.title), organization: opt(r.organization), linkedin: opt(r.linkedin) }));
}

/** Pinned first, then newest first, with "unread" for this person. */
async function getAnnouncementList(eventId: string, userId: string): Promise<Announcement[]> {
  const rows = await db
    .select({ a: announcements, sender: user.name, readAt: announcementReads.readAt })
    .from(announcements)
    .leftJoin(user, eq(user.id, announcements.sentBy))
    .leftJoin(announcementReads, and(eq(announcementReads.announcementId, announcements.id), eq(announcementReads.userId, userId)))
    .where(eq(announcements.eventId, eventId))
    .orderBy(desc(announcements.pinned), desc(announcements.createdAt));
  return rows.map(({ a, sender, readAt }) => ({
    id: a.id, title: a.title, body: a.body, pinned: a.pinned,
    postedByName: sender ?? "HERS staff",
    postedAt: iso(a.createdAt),
    unread: !readAt,
    readCount: 0,
  }));
}

/** The attendee announcements page. Viewing it marks every announcement as read. */
export async function getAnnouncements(eventId: string): Promise<Announcement[]> {
  if ((await getEventAccess(eventId)) === "none") return [];
  const me = (await currentUser())!;
  const list = await getAnnouncementList(eventId, me.id);
  const unread = list.filter((a) => a.unread);
  if (me.role === "attendee" && unread.length) {
    await db
      .insert(announcementReads)
      .values(unread.map((a) => ({ announcementId: a.id, userId: me.id })))
      .onConflictDoNothing();
  }
  return list;
}

/* ------------------------------- staff ------------------------------ */

/** Every /admin page calls this as well as the admin layout, so no staff page ever renders for someone else. */
export async function requireStaffPage(): Promise<void> {
  await requireStaff();
}

export async function getStaffEvents(): Promise<EventSummary[]> {
  await requireStaff();
  const [rows, { groupMeCleanupDays }] = await Promise.all([
    db
      .select({
        e: events,
        creator: user.name,
        attendees: sql<number>`(select count(*)::int from ${enrollments} where ${enrollments.eventId} = ${events.id} and ${enrollments.status} <> 'revoked')`,
      })
      .from(events)
      .leftJoin(user, eq(user.id, events.createdBy))
      .orderBy(desc(events.startDate)),
    getSettings(),
  ]);
  return rows.map(({ e, creator, attendees }) => {
    const ev = toHersEvent(e, creator);
    const cleanupDate = addDays(ev.endDate, groupMeCleanupDays);
    return {
      ...ev,
      attendeeCount: Number(attendees),
      groupMeCleanupDue: !e.groupMeClosedAt && todayIn(e.timeZone) >= cleanupDate,
    };
  });
}

export async function getGroupMeCleanup(eventId: string): Promise<GroupMeCleanup | null> {
  await requireStaff();
  if (!isUuid(eventId)) return null;
  const [e] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!e) return null;
  const { groupMeCleanupDays } = await getSettings();
  const dueDate = addDays(dateString(e.endDate)!, groupMeCleanupDays);
  return { due: !e.groupMeClosedAt && todayIn(e.timeZone) >= dueDate, closedAt: e.groupMeClosedAt ? iso(e.groupMeClosedAt) : undefined, dueDate };
}

export async function getEventStats(eventId: string): Promise<EventStats> {
  await requireStaff();
  const zero = { invited: 0, signedUp: 0, revoked: 0, subcommittees: 0, sessions: 0, speakers: 0 };
  if (!isUuid(eventId)) return zero;
  const [byStatus, [subs], [sess], [spk]] = await Promise.all([
    db.select({ status: enrollments.status, n: count() }).from(enrollments).where(eq(enrollments.eventId, eventId)).groupBy(enrollments.status),
    db.select({ n: count() }).from(subcommittees).where(eq(subcommittees.eventId, eventId)),
    db.select({ n: count() }).from(sessionsAgenda).where(eq(sessionsAgenda.eventId, eventId)),
    db.select({ n: count() }).from(speakers).where(eq(speakers.eventId, eventId)),
  ]);
  const n = (s: string) => byStatus.find((b) => b.status === s)?.n ?? 0;
  return { invited: n("invited"), signedUp: n("active"), revoked: n("revoked"), subcommittees: subs.n, sessions: sess.n, speakers: spk.n };
}

const actor = alias(user, "actor");

function activityQuery() {
  return db
    .select({ a: activityLog, actorName: actor.name, eventName: events.name })
    .from(activityLog)
    .leftJoin(actor, eq(actor.id, activityLog.actorId))
    .leftJoin(events, eq(events.id, activityLog.eventId));
}

async function seenAt(userId: string) {
  const [row] = await db.select({ seen: members.activitySeenAt }).from(members).where(eq(members.userId, userId)).limit(1);
  return row?.seen ?? new Date(0);
}

function toActivity(r: { a: typeof activityLog.$inferSelect; actorName: string | null; eventName: string | null }, seen: Date, meId: string): ActivityItem {
  return {
    id: r.a.id,
    at: iso(r.a.createdAt),
    actorName: r.actorName ?? "Someone",
    action: r.a.action,
    details: r.a.details,
    eventName: r.eventName ?? undefined,
    unread: r.a.createdAt > seen && r.a.actorId !== meId,
  };
}

/** The dashboard feed. "Unread" = since this staff member last opened the activity log, by someone else. */
export async function getRecentActivity(limit = 5): Promise<{ items: ActivityItem[]; unread: number }> {
  const me = await requireStaff();
  const seen = await seenAt(me.id);
  const [rows, [unread]] = await Promise.all([
    activityQuery().orderBy(desc(activityLog.createdAt)).limit(limit),
    db
      .select({ n: count() })
      .from(activityLog)
      .where(and(gt(activityLog.createdAt, seen), or(isNull(activityLog.actorId), ne(activityLog.actorId, me.id)))),
  ]);
  return { items: rows.map((r) => toActivity(r, seen, me.id)), unread: unread.n };
}

/** The full log. Opening it marks everything as read for this staff member. */
export async function getActivityLog(filters: ActivityFilters): Promise<ActivityPage> {
  const me = await requireStaff();
  const pageSize = 25;
  const page = Math.max(1, filters.page ?? 1);
  const where = and(
    filters.action ? eq(activityLog.action, filters.action) : undefined,
    filters.who ? eq(activityLog.actorId, filters.who) : undefined,
    filters.event && isUuid(filters.event) ? eq(activityLog.eventId, filters.event) : undefined,
  );
  const seen = await seenAt(me.id);
  const [rows, [total]] = await Promise.all([
    activityQuery().where(where).orderBy(desc(activityLog.createdAt)).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ n: count() }).from(activityLog).where(where),
  ]);
  await db.update(members).set({ activitySeenAt: new Date() }).where(eq(members.userId, me.id));
  return { items: rows.map((r) => toActivity(r, seen, me.id)), total: total.n, page, pageSize };
}

export async function getActivityFilterOptions() {
  await requireStaff();
  const [actions, staff, evs] = await Promise.all([
    db.selectDistinct({ action: activityLog.action }).from(activityLog).orderBy(asc(activityLog.action)),
    db.select({ id: user.id, name: user.name }).from(user).innerJoin(members, eq(members.userId, user.id)).where(eq(members.role, "staff")).orderBy(asc(user.name)),
    db.select({ id: events.id, name: events.name }).from(events).orderBy(desc(events.startDate)),
  ]);
  return { actions: actions.map((a) => a.action), staff, events: evs };
}

export async function getEventLinks(eventId: string): Promise<EventLink[]> {
  await requireStaff();
  if (!isUuid(eventId)) return [];
  const [event] = await db.select({ timeZone: events.timeZone }).from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) return [];
  const rows = await db.select().from(eventLinks).where(eq(eventLinks.eventId, eventId)).orderBy(asc(eventLinks.displayOrder));
  return rows.map((l) => ({
    id: l.id, label: l.label, url: l.url, order: l.displayOrder,
    visibleFrom: utcToLocalInput(l.visibleFrom, event.timeZone),
    visibleUntil: utcToLocalInput(l.visibleUntil, event.timeZone),
  }));
}

export async function getTracks(eventId: string): Promise<(Track & { sessionCount: number })[]> {
  await requireStaff();
  if (!isUuid(eventId)) return [];
  const rows = await db
    .select({
      t: tracks,
      sessionCount: sql<number>`(select count(*)::int from ${sessionsAgenda} where ${sessionsAgenda.trackId} = ${tracks.id})`,
    })
    .from(tracks)
    .where(eq(tracks.eventId, eventId))
    .orderBy(asc(tracks.displayOrder), asc(tracks.name));
  return rows.map(({ t, sessionCount }) => ({ ...toTrack(t), sessionCount: Number(sessionCount) }));
}

export async function getEnrollments(eventId: string): Promise<Enrollment[]> {
  await requireStaff();
  if (!isUuid(eventId)) return [];
  const [rows, members] = await Promise.all([
    db.select().from(enrollments).where(eq(enrollments.eventId, eventId)).orderBy(asc(sql`lower(${enrollments.displayName})`)),
    db
      .select({ enrollmentId: subcommitteeMembers.enrollmentId, subcommitteeId: subcommitteeMembers.subcommitteeId })
      .from(subcommitteeMembers)
      .innerJoin(subcommittees, eq(subcommittees.id, subcommitteeMembers.subcommitteeId))
      .where(eq(subcommittees.eventId, eventId)),
  ]);
  return rows.map((r) => ({
    id: r.id,
    userId: opt(r.userId),
    email: r.invitedEmail,
    displayName: r.displayName,
    title: opt(r.title),
    organization: opt(r.organization),
    linkedin: opt(r.linkedin),
    status: r.status,
    subcommitteeIds: members.filter((m) => m.enrollmentId === r.id).map((m) => m.subcommitteeId),
    individualExpiry: dateString(r.individualExpiry),
  }));
}

export async function getSubcommittees(eventId: string): Promise<Subcommittee[]> {
  await requireStaff();
  if (!isUuid(eventId)) return [];
  const rows = await db
    .select({
      s: subcommittees,
      members: sql<number>`(select count(*)::int from ${subcommitteeMembers} m join ${enrollments} e on e.id = m.enrollment_id where m.subcommittee_id = ${subcommittees.id} and e.status <> 'revoked')`,
    })
    .from(subcommittees)
    .where(eq(subcommittees.eventId, eventId))
    .orderBy(asc(subcommittees.name));
  return rows.map(({ s, members }) => ({ id: s.id, name: s.name, groupMeUrl: s.groupmeLink, memberCount: Number(members) }));
}

export async function getStaffAnnouncements(eventId: string): Promise<Announcement[]> {
  await requireStaff();
  if (!isUuid(eventId)) return [];
  const rows = await db
    .select({
      a: announcements,
      sender: user.name,
      reads: sql<number>`(select count(*)::int from ${announcementReads} where ${announcementReads.announcementId} = ${announcements.id})`,
    })
    .from(announcements)
    .leftJoin(user, eq(user.id, announcements.sentBy))
    .where(eq(announcements.eventId, eventId))
    .orderBy(desc(announcements.pinned), desc(announcements.createdAt));
  return rows.map(({ a, sender, reads }) => ({
    id: a.id, title: a.title, body: a.body, pinned: a.pinned,
    postedByName: sender ?? "HERS staff", postedAt: iso(a.createdAt), unread: false, readCount: Number(reads),
  }));
}

export async function getCheckInPoints(eventId: string): Promise<CheckInPoint[]> {
  await requireStaff();
  if (!isUuid(eventId)) return [];
  const rows = await db
    .select({
      p: checkInPoints,
      n: sql<number>`(select count(*)::int from ${checkIns} where ${checkIns.checkInPointId} = ${checkInPoints.id})`,
    })
    .from(checkInPoints)
    .where(eq(checkInPoints.eventId, eventId))
    .orderBy(asc(checkInPoints.displayOrder), asc(checkInPoints.pointDate));
  return rows.map(({ p, n }) => ({ id: p.id, label: p.label, date: dateString(p.pointDate), checkedIn: Number(n) }));
}

/** Everyone on the guest list (invited or signed up), so walk-ups who never signed up can still be checked in. */
export async function getCheckInSheet(eventId: string): Promise<CheckInSheet> {
  await requireStaff();
  const empty = { points: [], attendees: [], checkIns: [] };
  if (!isUuid(eventId)) return empty;
  const by = alias(user, "by");
  const [points, people, records] = await Promise.all([
    getCheckInPoints(eventId),
    db
      .select({ enrollmentId: enrollments.id, displayName: enrollments.displayName, organization: enrollments.organization, email: enrollments.invitedEmail })
      .from(enrollments)
      .where(and(eq(enrollments.eventId, eventId), ne(enrollments.status, "revoked")))
      .orderBy(asc(sql`lower(${enrollments.displayName})`)),
    db
      .select({ pointId: checkIns.checkInPointId, enrollmentId: checkIns.enrollmentId, at: checkIns.checkedInAt, byName: by.name })
      .from(checkIns)
      .innerJoin(checkInPoints, eq(checkInPoints.id, checkIns.checkInPointId))
      .leftJoin(by, eq(by.id, checkIns.checkedInBy))
      .where(eq(checkInPoints.eventId, eventId)),
  ]);
  return {
    points,
    attendees: people.map((p) => ({ ...p, organization: opt(p.organization) })),
    checkIns: records.map((r) => ({ pointId: r.pointId, enrollmentId: r.enrollmentId, at: iso(r.at), byName: r.byName ?? undefined })),
  };
}

/** The full staff sign-up link. Uses APP_URL, or the address this request came in on (deploy previews). */
export async function signUpUrl(token: string) {
  return `${await appUrl()}/staff-signup/${token}`;
}

/** Platform accounts: the Neon Auth user joined to its members row. */
function accountQuery() {
  return db
    .select({
      id: user.id, name: user.name, email: user.email, banned: user.banned, createdAt: user.createdAt,
      role: members.role, passwordCleared: members.passwordCleared,
    })
    .from(user)
    .innerJoin(members, eq(members.userId, user.id));
}

type AccountRow = Awaited<ReturnType<typeof accountQuery>>[number];

function personStatus(u: Pick<AccountRow, "banned" | "passwordCleared">): PersonStatus {
  if (u.banned) return "Deactivated";
  return u.passwordCleared ? "Password cleared" : "Active";
}

export async function getStaffRows(): Promise<StaffRow[]> {
  const me = await requireStaff();
  const inviter = alias(user, "inviter");
  const [staff, invites] = await Promise.all([
    accountQuery().where(eq(members.role, "staff")).orderBy(asc(user.name)),
    db
      .select({ i: staffInvites, inviterName: inviter.name })
      .from(staffInvites)
      .leftJoin(inviter, eq(inviter.id, staffInvites.createdBy))
      .where(and(isNull(staffInvites.usedAt), isNull(staffInvites.cancelledAt), gt(staffInvites.expiresAt, new Date())))
      .orderBy(desc(staffInvites.createdAt)),
  ]);
  return [
    ...staff.map((s): StaffRow => ({
      kind: "staff", id: s.id, name: s.name, email: s.email, status: personStatus(s), isMe: s.id === me.id,
    })),
    ...(await Promise.all(
      invites.map(async ({ i, inviterName }): Promise<StaffRow> => ({
        kind: "invite", id: i.id, email: i.email, signUpUrl: await signUpUrl(i.token), invitedByName: inviterName ?? undefined, createdAt: iso(i.createdAt),
      })),
    )),
  ];
}

async function toPeople(rows: AccountRow[]): Promise<PersonAccount[]> {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const ens = await db
    .select({ userId: enrollments.userId, status: enrollments.status, individualExpiry: enrollments.individualExpiry, e: events })
    .from(enrollments)
    .innerJoin(events, eq(events.id, enrollments.eventId))
    .where(inArray(enrollments.userId, ids))
    .orderBy(desc(events.startDate));
  return rows.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role === "staff" ? "staff" : "attendee",
    status: personStatus(u),
    createdAt: iso(u.createdAt),
    enrollments: ens
      .filter((x) => x.userId === u.id)
      .map((x) => {
        const expiry = dateString(x.individualExpiry) ?? dateString(x.e.accessExpiry)!;
        const expired = x.status === "active" && todayIn(x.e.timeZone) > expiry;
        return { eventId: x.e.id, eventName: x.e.name, status: expired ? "expired" : x.status };
      }),
  }));
}

export async function searchPeople(query: string): Promise<PersonAccount[]> {
  await requireStaff();
  const q = query.trim();
  if (!q) return [];
  const pattern = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const rows = await accountQuery()
    .where(or(ilike(user.name, pattern), ilike(user.email, pattern)))
    .orderBy(asc(user.name))
    .limit(50);
  return toPeople(rows);
}

export async function getPerson(userId: string): Promise<PersonAccount | null> {
  await requireStaff();
  if (!isUuid(userId)) return null;
  const [row] = await accountQuery().where(eq(user.id, userId)).limit(1);
  if (!row) return null;
  return (await toPeople([row]))[0];
}

/** A staff sign-up link that is still usable (public: the sign-up page reads it). */
export async function getStaffInvite(token: string): Promise<StaffInvite | null> {
  if (!token || token.length > 200) return null;
  const inviter = alias(user, "inviter");
  const [row] = await db
    .select({ i: staffInvites, inviterName: inviter.name, existingName: user.name })
    .from(staffInvites)
    .leftJoin(inviter, eq(inviter.id, staffInvites.createdBy))
    .leftJoin(user, eq(user.id, staffInvites.userId))
    .where(and(eq(staffInvites.token, token), isNull(staffInvites.usedAt), isNull(staffInvites.cancelledAt), gt(staffInvites.expiresAt, new Date())))
    .limit(1);
  if (!row) return null;
  return {
    token: row.i.token,
    email: row.i.email,
    invitedByName: row.inviterName ?? undefined,
    createdAt: iso(row.i.createdAt),
    existingName: row.existingName ?? undefined,
  };
}
