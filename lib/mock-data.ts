/**
 * Mock data for the v1 interface. Shapes follow the data model in the
 * technical documentation (section 16), so each export can be swapped for a
 * Drizzle query later without changing the pages much.
 */

export type EnrollmentStatus = "invited" | "active" | "revoked";
export type Access = "full" | "read-only" | "none";

export type HersEvent = {
  id: string;
  name: string;
  description: string;
  startDate: string; // ISO date
  endDate: string;
  dateLabel: string; // pre-formatted for display
  location: string;
  virtualDetails?: string;
  timeZone: string; // IANA
  tzLabel: string; // "ET"
  accessExpiry: string;
  accessKey: string;
  status: "Upcoming" | "Active" | "Expired";
  attendeeCount: number;
  invited: number;
  signedUp: number;
  createdBy: string;
  createdOn: string;
  groupMeCleanupDue?: boolean;
};

export type Track = { id: string; eventId: string; name: string; order: number };

export type Speaker = {
  id: string;
  eventId: string;
  name: string;
  title: string;
  organization: string;
  bio: string;
  email?: string;
  linkedin?: string;
  website?: string;
};

export type AgendaSession = {
  id: string;
  eventId: string;
  title: string;
  date: string; // YYYY-MM-DD in the event time zone
  start: string; // HH:mm
  end: string;
  trackId?: string;
  location?: string;
  virtualLink?: string;
  speakerIds: string[];
  description: string;
};

export type EventLink = {
  id: string;
  eventId: string;
  label: string;
  url: string;
  order: number;
  visibleFrom?: string;
  visibleUntil?: string;
  visibilityLabel: string;
};

export type Enrollment = {
  id: string;
  eventId: string;
  userId?: string;
  email: string;
  displayName: string;
  title?: string;
  organization?: string;
  linkedin?: string;
  status: EnrollmentStatus;
  subcommitteeIds: string[];
  individualExpiry?: string;
  checkedInAt?: string;
  checkedInBy?: string;
};

export type Subcommittee = {
  id: string;
  eventId: string;
  name: string;
  groupMeUrl: string;
  memberCount: number;
};

export type Announcement = {
  id: string;
  eventId: string;
  title: string;
  body: string;
  pinned: boolean;
  postedBy: string;
  postedAt: string; // display string
  unread: boolean;
  readCount: number;
};

export type ActivityItem = {
  id: string;
  when: string;
  relative: string;
  who: string;
  action: string;
  summary: string;
  details: string;
  event?: string;
  unread?: boolean;
};

export type StaffMember = {
  id: string;
  name?: string;
  email: string;
  status: "Active" | "Invite pending" | "Deactivated";
};

export type PersonAccount = {
  id: string;
  name: string;
  email: string;
  role: "Attendee" | "Staff";
  eventsSummary: string;
  status: "Active" | "Password cleared" | "Deactivated";
  createdOn: string;
  enrollments: string;
};

export type CheckInPoint = { id: string; eventId: string; label: string; date?: string; checkedIn: number };

/* ------------------------------------------------------------------ */

export const currentAttendee = {
  id: "u-jane",
  name: "Jane Doe",
  email: "jane.doe@university.edu",
  role: "attendee" as const,
};

export const currentStaff = {
  id: "u-maria",
  name: "Maria Lopez",
  email: "maria@hersnetwork.org",
  role: "staff" as const,
};

export const settings = {
  messageStaffGroupMe: "https://groupme.com/join_group/00000000/hers-staff",
  helpEmail: "hers@hersnetwork.org",
  groupMeCleanupDays: 30,
  lastChanged: "Maria Lopez · Oct 1",
};

export const events: HersEvent[] = [
  {
    id: "summer-2027",
    name: "2027 Summer Institute",
    description:
      "Five days of leadership development for women in higher education, with parallel tracks in finance, program design, and leadership.\n\nMornings open with a shared keynote; afternoons split into track workshops and subcommittee time.",
    startDate: "2027-06-14",
    endDate: "2027-06-18",
    dateLabel: "June 14–18, 2027",
    location: "Inn at Penn, 3600 Sansom St, Philadelphia, PA",
    virtualDetails: "https://zoom.us/j/0000000000",
    timeZone: "America/New_York",
    tzLabel: "ET",
    accessExpiry: "2027-06-18",
    accessKey: "SUMMER-7K4Q",
    status: "Upcoming",
    attendeeCount: 68,
    invited: 68,
    signedUp: 52,
    createdBy: "Maria Lopez",
    createdOn: "Sep 2, 2026",
  },
  {
    id: "whli-2027",
    name: "Weekend HLI 2027",
    description:
      "The Weekend HERS Leadership Institute meets one weekend a month from January to June.",
    startDate: "2027-01-09",
    endDate: "2027-06-06",
    dateLabel: "Jan–Jun 2027",
    location: "Monthly",
    timeZone: "America/New_York",
    tzLabel: "ET",
    accessExpiry: "2027-06-06",
    accessKey: "WHLI-3MBP",
    status: "Active",
    attendeeCount: 42,
    invited: 42,
    signedUp: 40,
    createdBy: "Dana Kim",
    createdOn: "Aug 14, 2026",
  },
  {
    id: "reunion-2026",
    name: "2026 Leadership Reunion",
    description: "Alumnae reunion weekend for HERS Institute graduates.",
    startDate: "2026-10-02",
    endDate: "2026-10-04",
    dateLabel: "Oct 2–4, 2026",
    location: "Denver, CO",
    timeZone: "America/Denver",
    tzLabel: "MT",
    accessExpiry: "2026-10-04",
    accessKey: "REUNION-9TXD",
    status: "Expired",
    attendeeCount: 187,
    invited: 190,
    signedUp: 187,
    createdBy: "Maria Lopez",
    createdOn: "Jun 3, 2026",
    groupMeCleanupDue: true,
  },
];

export const tracks: Track[] = [
  { id: "t-fin", eventId: "summer-2027", name: "Finance", order: 1 },
  { id: "t-prog", eventId: "summer-2027", name: "Programs", order: 2 },
  { id: "t-lead", eventId: "summer-2027", name: "Leadership", order: 3 },
];

export const speakers: Speaker[] = [
  {
    id: "sp-1",
    eventId: "summer-2027",
    name: "Renée Okafor",
    title: "Chief Financial Officer",
    organization: "Lakeshore University",
    bio: "Renée has led finance at three institutions, most recently guiding Lakeshore through a multi-year budget redesign.\n\nShe teaches budget modeling for academic leaders and serves on a regional finance officers' board.",
    email: "rokafor@lakeshore.edu",
    linkedin: "https://www.linkedin.com/in/example-rokafor",
    website: "https://example.org/rokafor",
  },
  {
    id: "sp-2",
    eventId: "summer-2027",
    name: "Dr. Priya Raman",
    title: "Provost",
    organization: "Northfield College",
    bio: "Priya oversees academic affairs at Northfield and writes about shared governance.",
    linkedin: "https://www.linkedin.com/in/example-praman",
  },
  {
    id: "sp-3",
    eventId: "summer-2027",
    name: "Dr. Helen Marsh",
    title: "President",
    organization: "Eastbrook Community College",
    bio: "Helen became Eastbrook's first woman president in 2021.",
  },
  {
    id: "sp-4",
    eventId: "summer-2027",
    name: "Carmen Ruiz",
    title: "Director of Assessment",
    organization: "Ridgeview University",
    bio: "Carmen builds assessment programs that faculty actually use.",
    email: "cruiz@ridgeview.edu",
  },
  {
    id: "sp-5",
    eventId: "summer-2027",
    name: "Lauren Whitfield",
    title: "Consultant",
    organization: "Whitfield Advisory",
    bio: "Lauren coaches leaders through negotiation and organizational change.",
    website: "https://example.org/whitfield",
  },
  {
    id: "sp-6",
    eventId: "summer-2027",
    name: "Dr. Simone Achebe",
    title: "Dean",
    organization: "Harbor State University",
    bio: "Simone is dean of the College of Arts and Sciences at Harbor State.",
  },
];

export const agendaSessions: AgendaSession[] = [
  { id: "s-1", eventId: "summer-2027", title: "Breakfast", date: "2027-06-14", start: "07:30", end: "08:30", location: "Atrium", speakerIds: [], description: "" },
  { id: "s-2", eventId: "summer-2027", title: "Opening Keynote", date: "2027-06-14", start: "09:00", end: "10:00", location: "Hall B", speakerIds: ["sp-3"], description: "Welcome from HERS and an opening keynote on leading institutions through change." },
  { id: "s-3", eventId: "summer-2027", title: "Finance for Leaders", date: "2027-06-14", start: "10:30", end: "12:00", trackId: "t-fin", location: "Rm 204", speakerIds: ["sp-1"], description: "How institutional budgets are built, read, and defended." },
  { id: "s-4", eventId: "summer-2027", title: "Program Design 101", date: "2027-06-14", start: "10:30", end: "12:00", trackId: "t-prog", location: "Rm 210", speakerIds: ["sp-2"], description: "From idea to approved program." },
  { id: "s-5", eventId: "summer-2027", title: "Leading Through Change", date: "2027-06-14", start: "10:30", end: "12:00", trackId: "t-lead", location: "Rm 118", speakerIds: ["sp-5"], description: "Practical tools for leading teams through reorganization." },
  { id: "s-6", eventId: "summer-2027", title: "Lunch", date: "2027-06-14", start: "12:00", end: "13:00", location: "Atrium", speakerIds: [], description: "" },
  { id: "s-7", eventId: "summer-2027", title: "Budget Modeling Lab", date: "2027-06-14", start: "13:15", end: "14:45", trackId: "t-fin", location: "Rm 204", virtualLink: "https://zoom.us/j/0000000001", speakerIds: ["sp-1", "sp-2"], description: "Bring a laptop. We'll build a three-year budget model from a sample department's figures.\n\nVirtual attendees can follow along with the shared spreadsheet." },
  { id: "s-8", eventId: "summer-2027", title: "Assessment Basics", date: "2027-06-14", start: "13:15", end: "14:45", trackId: "t-prog", location: "Rm 210", speakerIds: ["sp-4"], description: "Designing outcomes and measuring them." },
  { id: "s-9", eventId: "summer-2027", title: "Negotiation", date: "2027-06-14", start: "13:15", end: "14:45", trackId: "t-lead", location: "Rm 118", speakerIds: ["sp-5"], description: "Negotiating for resources, roles, and salary." },
  { id: "s-10", eventId: "summer-2027", title: "Breakfast", date: "2027-06-15", start: "07:30", end: "08:30", location: "Atrium", speakerIds: [], description: "" },
  { id: "s-11", eventId: "summer-2027", title: "Shared Governance in Practice", date: "2027-06-15", start: "09:00", end: "10:00", location: "Hall B", speakerIds: ["sp-2", "sp-6"], description: "A conversation between a provost and a dean." },
  { id: "s-12", eventId: "summer-2027", title: "Finance Office Hours", date: "2027-06-15", start: "10:30", end: "11:30", trackId: "t-fin", location: "Rm 204", speakerIds: ["sp-1"], description: "Bring your questions." },
];

export const eventLinks: EventLink[] = [
  { id: "l-1", eventId: "summer-2027", label: "Share your photos (Dropbox)", url: "https://www.dropbox.com/request/[id]", order: 1, visibilityLabel: "Always" },
  { id: "l-2", eventId: "summer-2027", label: "View event photos (Dropbox)", url: "https://www.dropbox.com/sh/[id]", order: 2, visibilityLabel: "Always" },
  { id: "l-3", eventId: "summer-2027", label: "Event GroupMe", url: "https://groupme.com/join_group/[id]", order: 3, visibilityLabel: "Always" },
  { id: "l-4", eventId: "summer-2027", label: "Hotel booking", url: "https://[hotel link]", order: 4, visibleUntil: "2027-06-01", visibilityLabel: "Until Jun 1" },
  { id: "l-5", eventId: "summer-2027", label: "Post-event survey", url: "https://[survey link]", order: 5, visibleFrom: "2027-06-18T15:00", visibilityLabel: "From Jun 18, 3:00 PM" },
];

export const subcommittees: Subcommittee[] = [
  { id: "sc-fin", eventId: "summer-2027", name: "Finance", groupMeUrl: "https://groupme.com/join_group/[id]", memberCount: 14 },
  { id: "sc-prog", eventId: "summer-2027", name: "Programs", groupMeUrl: "https://groupme.com/join_group/[id]", memberCount: 12 },
  { id: "sc-ment", eventId: "summer-2027", name: "Mentoring", groupMeUrl: "https://groupme.com/join_group/[id]", memberCount: 11 },
  { id: "sc-comm", eventId: "summer-2027", name: "Community", groupMeUrl: "https://groupme.com/join_group/[id]", memberCount: 10 },
  { id: "sc-log", eventId: "summer-2027", name: "Logistics", groupMeUrl: "https://groupme.com/join_group/[id]", memberCount: 9 },
];

export const enrollments: Enrollment[] = [
  { id: "e-1", eventId: "summer-2027", userId: "u-jane", email: "jane.doe@university.edu", displayName: "Jane Doe", title: "Associate Dean", organization: "State University", linkedin: "https://linkedin.com/in/janedoe", status: "active", subcommitteeIds: ["sc-fin", "sc-prog"] },
  { id: "e-2", eventId: "summer-2027", email: "abrooks@northfield.edu", displayName: "Angela Brooks", title: "Provost", organization: "Northfield College", status: "invited", subcommitteeIds: ["sc-fin"] },
  { id: "e-3", eventId: "summer-2027", userId: "u-3", email: "mtan@ridgeview.edu", displayName: "Mei Tan", title: "Registrar", organization: "Ridgeview University", linkedin: "https://linkedin.com/in/example-mtan", status: "active", subcommitteeIds: [], checkedInAt: "8:42 AM", checkedInBy: "Dana Kim" },
  { id: "e-4", eventId: "summer-2027", userId: "u-4", email: "kpatel@harbor.edu", displayName: "Kavita Patel", title: "Dean of Students", organization: "Harbor State University", status: "revoked", subcommitteeIds: [] },
  { id: "e-5", eventId: "summer-2027", userId: "u-5", email: "lgreene@eastbrook.edu", displayName: "Lisa Greene", title: "Director of Advising", organization: "Eastbrook Community College", linkedin: "https://linkedin.com/in/example-lgreene", status: "active", subcommitteeIds: ["sc-ment"], checkedInAt: "8:31 AM", checkedInBy: "Dana Kim" },
  { id: "e-6", eventId: "summer-2027", userId: "u-6", email: "ofolarin@lakeshore.edu", displayName: "Ola Folarin", organization: "Lakeshore University", status: "active", subcommitteeIds: ["sc-comm"] },
  { id: "e-7", eventId: "summer-2027", userId: "u-7", email: "rsilva@westvale.edu", displayName: "Rosa Silva", title: "Chair, Biology", organization: "Westvale College", linkedin: "https://linkedin.com/in/example-rsilva", status: "active", subcommitteeIds: ["sc-prog"], checkedInAt: "8:15 AM", checkedInBy: "Maria Lopez" },
  { id: "e-8", eventId: "summer-2027", userId: "u-8", email: "nadams@pinecrest.edu", displayName: "Nora Adams", title: "Assistant VP, Enrollment", organization: "Pinecrest University", linkedin: "https://linkedin.com/in/example-nadams", status: "active", subcommitteeIds: ["sc-log"] },
  { id: "e-9", eventId: "summer-2027", userId: "u-9", email: "ewu@gmail.com", displayName: "Evelyn Wu", title: "Retired", status: "active", subcommitteeIds: ["sc-ment"] },
];

export const announcements: Announcement[] = [
  { id: "a-1", eventId: "summer-2027", title: "Room change: Opening keynote moves to Hall B", body: "The opening keynote is now in Hall B, on the ground floor next to the Atrium. Breakfast is unchanged.", pinned: true, postedBy: "Maria Lopez", postedAt: "Jun 14, 8:05 AM ET", unread: true, readCount: 41 },
  { id: "a-2", eventId: "summer-2027", title: "Shuttle schedule for Tuesday", body: "Shuttles leave the hotel lobby at 7:00, 7:20, and 7:40 AM. The last return shuttle leaves campus at 6:00 PM.", pinned: false, postedBy: "Maria Lopez", postedAt: "Jun 14, 7:40 AM ET", unread: true, readCount: 30 },
  { id: "a-3", eventId: "summer-2027", title: "Share your photos!", body: "Upload photos from the week with the Dropbox link on the event home page. You don't need a Dropbox account.", pinned: false, postedBy: "Dana Kim", postedAt: "Jun 13, 5:00 PM ET", unread: true, readCount: 47 },
  { id: "a-4", eventId: "summer-2027", title: "Welcome to the Summer Institute", body: "We're glad you're here. Check the agenda, find your subcommittee's GroupMe, and say hello in the directory.", pinned: false, postedBy: "Dana Kim", postedAt: "Jun 10, 9:00 AM ET", unread: false, readCount: 52 },
];

export const activity: ActivityItem[] = [
  { id: "ac-1", when: "Oct 10, 2:14 PM", relative: "2h ago", who: "Maria Lopez", action: "Password reset", summary: "reset the password for jane.doe@university.edu", details: "jane.doe@university.edu", unread: true },
  { id: "ac-2", when: "Oct 9, 4:02 PM", relative: "Yesterday", who: "Dana Kim", action: "Enrollment revoked", summary: "revoked Kavita Patel from 2027 Summer Institute", details: "Kavita Patel", event: "2027 Summer Institute", unread: true },
  { id: "ac-3", when: "Oct 8, 11:30 AM", relative: "Oct 8", who: "Maria Lopez", action: "Email changed", summary: "changed email old@college.edu → new@univ.edu", details: "old@college.edu → new@univ.edu", unread: true },
  { id: "ac-4", when: "Oct 8, 9:12 AM", relative: "Oct 8", who: "Dana Kim", action: "Staff invited", summary: "invited new.staff@hersnetwork.org", details: "new.staff@hersnetwork.org", unread: true },
  { id: "ac-5", when: "Oct 7, 3:45 PM", relative: "Oct 7", who: "Maria Lopez", action: "Account deactivated", summary: "deactivated retired-1042@invalid", details: "retired-1042@invalid" },
  { id: "ac-6", when: "Oct 7, 3:40 PM", relative: "Oct 7", who: "Evelyn Wu", action: "New password set", summary: "set a new password after a reset", details: "ewu@gmail.com" },
];

export const staffMembers: StaffMember[] = [
  { id: "st-1", name: "Maria Lopez", email: "maria@hersnetwork.org", status: "Active" },
  { id: "st-2", name: "Dana Kim", email: "dana@hersnetwork.org", status: "Active" },
  { id: "st-3", email: "new.staff@hersnetwork.org", status: "Invite pending" },
];

export const people: PersonAccount[] = [
  { id: "u-jane", name: "Jane Doe", email: "jane.doe@university.edu", role: "Attendee", eventsSummary: "2 active · 1 past", status: "Active", createdOn: "Mar 2026", enrollments: "2027 Summer Institute (active) · Weekend HLI 2027 (active) · 2026 Leadership Reunion (expired)" },
  { id: "u-jane2", name: "Jane Doe", email: "jdoe@newuniv.edu", role: "Attendee", eventsSummary: "1 active", status: "Password cleared", createdOn: "Sep 2026", enrollments: "Weekend HLI 2027 (active)" },
  { id: "u-ret", name: "Janet Doerr", email: "retired-1042@invalid", role: "Attendee", eventsSummary: "—", status: "Deactivated", createdOn: "Jan 2025", enrollments: "—" },
  { id: "u-maria", name: "Maria Lopez", email: "maria@hersnetwork.org", role: "Staff", eventsSummary: "—", status: "Active", createdOn: "Jan 2026", enrollments: "—" },
];

export const checkInPoints: CheckInPoint[] = [
  { id: "cp-arrival", eventId: "summer-2027", label: "Arrival", checkedIn: 42 },
  { id: "cp-m1", eventId: "whli-2027", label: "Month 1", date: "Jan 9, 2027", checkedIn: 38 },
  { id: "cp-m2", eventId: "whli-2027", label: "Month 2", date: "Feb 6, 2027", checkedIn: 40 },
  { id: "cp-m3", eventId: "whli-2027", label: "Month 3", date: "Mar 6, 2027", checkedIn: 0 },
  { id: "cp-m4", eventId: "whli-2027", label: "Month 4", date: "Apr 10, 2027", checkedIn: 0 },
  { id: "cp-m5", eventId: "whli-2027", label: "Month 5", date: "May 8, 2027", checkedIn: 0 },
  { id: "cp-m6", eventId: "whli-2027", label: "Month 6", date: "Jun 5, 2027", checkedIn: 0 },
];

/* ---------------------------- lookups ------------------------------ */

export function getEvent(id: string) {
  return events.find((e) => e.id === id);
}

/** Events the current attendee is enrolled in. */
export function getMyEvents() {
  return events.map((e) => ({
    ...e,
    unread: e.id === "summer-2027" ? announcements.filter((a) => a.unread).length : 0,
  }));
}

export const byEvent = <T extends { eventId: string }>(list: T[], eventId: string) =>
  list.filter((x) => x.eventId === eventId);

export function getTrack(id?: string) {
  return tracks.find((t) => t.id === id);
}

export function getSpeaker(id: string) {
  return speakers.find((s) => s.id === id);
}

export function getSession(id: string) {
  return agendaSessions.find((s) => s.id === id);
}

export function sessionsForSpeaker(speakerId: string) {
  return agendaSessions.filter((s) => s.speakerIds.includes(speakerId));
}
