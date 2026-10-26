/**
 * The shapes the interface works with. They follow the data model in the
 * technical documentation (section 16), already joined and formatted for the
 * screens that show them. `lib/data.ts` returns these.
 *
 * Dates are "YYYY-MM-DD" and times "HH:mm" in the event's own time zone.
 * Timestamps (postedAt, at, …) are ISO strings in UTC.
 */

export type Role = "staff" | "attendee";
export type EnrollmentStatus = "invited" | "active" | "revoked";
export type Access = "full" | "read-only" | "none";
export type EventStatus = "Upcoming" | "Active" | "Expired";

export type CurrentUser = { id: string; name: string; email: string; role: Role };

export type Settings = {
  messageStaffGroupMe: string;
  helpEmail: string;
  groupMeCleanupDays: number;
  updatedByName?: string;
  updatedAt?: string;
};

export type HersEvent = {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  virtualDetails?: string;
  timeZone: string; // IANA, e.g. America/New_York
  accessExpiry: string;
  accessKey: string;
  status: EventStatus;
  createdByName?: string;
  createdAt: string;
};

/** A row in the staff events table. */
export type EventSummary = HersEvent & { attendeeCount: number; groupMeCleanupDue: boolean };

/** A card on the attendee dashboard. */
export type MyEvent = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  readOnly: boolean;
  unread: number;
};

export type EventStats = {
  invited: number;
  signedUp: number;
  revoked: number;
  subcommittees: number;
  sessions: number;
  speakers: number;
};

export type Track = { id: string; name: string; order: number };

export type Speaker = {
  id: string;
  name: string;
  title?: string;
  organization?: string;
  bio: string;
  email?: string;
  linkedin?: string;
  website?: string;
};

export type SpeakerRow = Speaker & { sessionCount: number };

export type AgendaSession = {
  id: string;
  title: string;
  date: string;
  start: string;
  end: string;
  trackId?: string;
  location?: string;
  virtualLink?: string;
  speakerIds: string[];
  description: string;
};

export type Agenda = { sessions: AgendaSession[]; tracks: Track[]; speakers: Speaker[] };

export type EventLink = {
  id: string;
  label: string;
  url: string;
  order: number;
  visibleFrom?: string; // "YYYY-MM-DDTHH:mm" in the event time zone
  visibleUntil?: string;
};

export type Enrollment = {
  id: string;
  userId?: string;
  email: string;
  displayName: string;
  title?: string;
  organization?: string;
  linkedin?: string;
  status: EnrollmentStatus;
  subcommitteeIds: string[];
  individualExpiry?: string;
};

export type DirectoryPerson = {
  id: string;
  displayName: string;
  title?: string;
  organization?: string;
  linkedin?: string;
};

export type Subcommittee = { id: string; name: string; groupMeUrl: string; memberCount: number };

export type Announcement = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  postedByName: string;
  postedAt: string;
  unread: boolean; // attendee view
  readCount: number; // staff view
};

export type EventHome = {
  pinned?: Announcement;
  unreadCount: number;
  upNext: AgendaSession[];
  tracks: Track[];
  links: EventLink[];
  laterLinks: EventLink[]; // scheduled to appear later
  mySubcommittees: Subcommittee[];
};

export type ActivityItem = {
  id: string;
  at: string;
  actorName: string;
  action: string;
  details: string;
  eventName?: string;
  unread: boolean;
};

export type ActivityPage = { items: ActivityItem[]; total: number; page: number; pageSize: number };

export type ActivityFilters = { action?: string; who?: string; event?: string; page?: number };

export type StaffRow =
  | { kind: "staff"; id: string; name: string; email: string; status: "Active" | "Password cleared" | "Deactivated"; isMe: boolean }
  | { kind: "invite"; id: string; email: string; signUpUrl: string; invitedByName?: string; createdAt: string };

export type PersonStatus = "Active" | "Password cleared" | "Deactivated";

export type PersonEnrollment = { eventId: string; eventName: string; status: EnrollmentStatus | "expired" };

export type PersonAccount = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: PersonStatus;
  createdAt: string;
  enrollments: PersonEnrollment[];
};

export type CheckInPoint = { id: string; label: string; date?: string; checkedIn: number };

export type CheckInAttendee = { enrollmentId: string; displayName: string; organization?: string; email: string };

export type CheckIn = { pointId: string; enrollmentId: string; at: string; byName?: string };

export type CheckInSheet = { points: CheckInPoint[]; attendees: CheckInAttendee[]; checkIns: CheckIn[] };

export type MyProfile = {
  displayName: string;
  title: string;
  organization: string;
  linkedin: string;
  events: { id: string; name: string; frozen: boolean }[];
};

/** existingName is set when the link resets a locked-out staff member's password. */
export type StaffInvite = { token: string; email: string; invitedByName?: string; createdAt: string; existingName?: string };

export type SessionDetail = { session: AgendaSession; track?: Track; speakers: Speaker[] };

export type GroupMeCleanup = { due: boolean; closedAt?: string; dueDate: string };

export type SpeakerDetail = { speaker: Speaker; sessions: AgendaSession[] };
