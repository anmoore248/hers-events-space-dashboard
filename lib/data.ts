import "server-only";
import type {
  ActivityFilters,
  ActivityItem,
  ActivityPage,
  Agenda,
  Announcement,
  CheckInPoint,
  CheckInSheet,
  CurrentUser,
  DirectoryPerson,
  Enrollment,
  GroupMeCleanup,
  EventHome,
  EventLink,
  EventStats,
  EventSummary,
  HersEvent,
  MyEvent,
  MyProfile,
  PersonAccount,
  SessionDetail,
  Settings,
  SpeakerDetail,
  SpeakerRow,
  StaffInvite,
  StaffRow,
  Subcommittee,
  Track,
} from "./types";
import { auth } from "@/lib/auth/server";
import { db } from "@/app";

/**
 * Every read the interface makes goes through this file. Nothing is connected
 * yet, so each function returns an empty result and every page shows its
 * empty state. Connecting the database means replacing these bodies with
 * Drizzle queries; the pages don't need to change.
 */

export const DEFAULT_SETTINGS: Settings = {
  messageStaffGroupMe: "",
  helpEmail: "hers@hersnetwork.org",
  groupMeCleanupDays: 30,
};

/* ----------------------------- everyone ----------------------------- */
// FIXME: Get's the current user; similar to localStorage -- DONE
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    return null;
  }

  const user = await db.query.user.findFirst({
    where: {
      id: session.user.id,
    },
  });

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role:
      user && user.role === session.user.role && session.user.role === "admin"
        ? "staff"
        : "attendee",
  };
}

export async function getSettings(): Promise<Settings> {
  return DEFAULT_SETTINGS;
}

export async function getEvent(eventId: string): Promise<HersEvent | null> {
  void eventId;
  return null;
}

/* ----------------------------- attendee ----------------------------- */

export async function getMyEvents(): Promise<MyEvent[]> {
  return [];
}

export async function getMyProfile(): Promise<MyProfile | null> {
  return null;
}

export async function getEventHome(eventId: string): Promise<EventHome> {
  void eventId;
  return {
    unreadCount: 0,
    upNext: [],
    tracks: [],
    links: [],
    laterLinks: [],
    mySubcommittees: [],
  };
}

export async function getAgenda(eventId: string): Promise<Agenda> {
  void eventId;
  return { sessions: [], tracks: [], speakers: [] };
}

export async function getSessionDetail(
  eventId: string,
  sessionId: string,
): Promise<SessionDetail | null> {
  void eventId;
  void sessionId;
  return null;
}

export async function getSpeakers(eventId: string): Promise<SpeakerRow[]> {
  void eventId;
  return [];
}

export async function getSpeakerDetail(
  eventId: string,
  speakerId: string,
): Promise<SpeakerDetail | null> {
  void eventId;
  void speakerId;
  return null;
}

export async function getDirectory(
  eventId: string,
): Promise<DirectoryPerson[]> {
  void eventId;
  return [];
}

export async function getAnnouncements(
  eventId: string,
): Promise<Announcement[]> {
  void eventId;
  return [];
}

/* ------------------------------- staff ------------------------------ */

/** Every /admin page calls this. TODO: send anyone who isn't staff away (Better Auth session). */
export async function requireStaffPage(): Promise<void> {}

export async function getStaffEvents(): Promise<EventSummary[]> {
  return [];
}

export async function getGroupMeCleanup(
  eventId: string,
): Promise<GroupMeCleanup | null> {
  void eventId;
  return null;
}

export async function getEventStats(eventId: string): Promise<EventStats> {
  void eventId;
  return {
    invited: 0,
    signedUp: 0,
    revoked: 0,
    subcommittees: 0,
    sessions: 0,
    speakers: 0,
  };
}

export async function getRecentActivity(
  limit = 5,
): Promise<{ items: ActivityItem[]; unread: number }> {
  void limit;
  return { items: [], unread: 0 };
}

export async function getActivityLog(
  filters: ActivityFilters,
): Promise<ActivityPage> {
  return { items: [], total: 0, page: filters.page ?? 1, pageSize: 25 };
}

export async function getActivityFilterOptions(): Promise<{
  actions: string[];
  staff: { id: string; name: string }[];
  events: { id: string; name: string }[];
}> {
  return { actions: [], staff: [], events: [] };
}

export async function getEventLinks(eventId: string): Promise<EventLink[]> {
  void eventId;
  return [];
}

export async function getTracks(
  eventId: string,
): Promise<(Track & { sessionCount: number })[]> {
  void eventId;
  return [];
}

export async function getEnrollments(eventId: string): Promise<Enrollment[]> {
  void eventId;
  return [];
}

export async function getSubcommittees(
  eventId: string,
): Promise<Subcommittee[]> {
  void eventId;
  return [];
}

export async function getStaffAnnouncements(
  eventId: string,
): Promise<Announcement[]> {
  void eventId;
  return [];
}

export async function getCheckInPoints(
  eventId: string,
): Promise<CheckInPoint[]> {
  void eventId;
  return [];
}

export async function getCheckInSheet(eventId: string): Promise<CheckInSheet> {
  void eventId;
  return { points: [], attendees: [], checkIns: [] };
}

export async function getStaffRows(): Promise<StaffRow[]> {
  return [];
}

export async function searchPeople(query: string): Promise<PersonAccount[]> {
  void query;
  return [];
}

export async function getPerson(userId: string): Promise<PersonAccount | null> {
  void userId;
  return null;
}

export async function getStaffInvite(
  token: string,
): Promise<StaffInvite | null> {
  void token;
  return null;

  // TODO: remove once implemented
  // Local preview only: /staff-signup/preview shows the new-staff form,
  // /staff-signup/preview-reset shows the "set your staff password" version.
  // NODE_ENV is "development" only under `npm run dev`, so this never appears on the live site.
  // if (process.env.NODE_ENV === "development" && token.startsWith("preview")) {
  //   return {
  //     token,
  //     email: "you@hersnetwork.org",
  //     createdAt: new Date().toISOString(),
  //     invitedByName: "A staff member",
  //     existingName: token === "preview-reset" ? "Your Name" : undefined,
  //   };
  // }
  // return null;
}
