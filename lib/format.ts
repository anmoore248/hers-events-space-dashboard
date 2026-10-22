/**
 * Display helpers. Event dates and session times are shown in the event's own
 * time zone with a label such as "ET" (doc §8.1).
 */

export const timeZones = [
  { value: "America/New_York", label: "Eastern (ET)", short: "ET", long: "Eastern" },
  { value: "America/Chicago", label: "Central (CT)", short: "CT", long: "Central" },
  { value: "America/Denver", label: "Mountain (MT)", short: "MT", long: "Mountain" },
  { value: "America/Phoenix", label: "Arizona (MST)", short: "MST", long: "Arizona" },
  { value: "America/Los_Angeles", label: "Pacific (PT)", short: "PT", long: "Pacific" },
  { value: "America/Anchorage", label: "Alaska (AKT)", short: "AKT", long: "Alaska" },
  { value: "Pacific/Honolulu", label: "Hawaii (HT)", short: "HT", long: "Hawaii" },
];

/**
 * HERS's own time zone, for timestamps that don't belong to one event
 * (activity log, staff dashboard). The server runs in UTC, so this must be explicit.
 */
export const ORG_TIME_ZONE = "America/New_York";

export function tzLabel(timeZone: string) {
  return timeZones.find((t) => t.value === timeZone)?.short ?? timeZone;
}

export function tzLong(timeZone: string) {
  return timeZones.find((t) => t.value === timeZone)?.long ?? timeZone;
}

export function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function formatTimeRange(start: string, end: string) {
  const s = formatTime(start);
  const e = formatTime(end);
  // "9:00–10:00 AM" when both share AM/PM
  if (s.slice(-2) === e.slice(-2)) return `${s.slice(0, -3)}–${e}`;
  return `${s}–${e}`;
}

const parse = (iso: string) => new Date(`${iso}T12:00:00`);

export function formatDayLong(iso: string) {
  return parse(iso).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export function formatDayShort(iso: string) {
  return parse(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).replace(",", "");
}

export function formatDayTab(iso: string) {
  return parse(iso).toLocaleDateString("en-US", { weekday: "short" });
}

export function formatDayFull(iso: string) {
  return parse(iso).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

/** "Jun 14, 2027". A date ("YYYY-MM-DD") as written; a timestamp in HERS's time zone. */
export function formatDate(iso: string) {
  if (iso.length <= 10) return parse(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: ORG_TIME_ZONE });
}

/** "June 14–18, 2027", "Jun 30 – Jul 2, 2027", "Jan 2027 – Jun 2027" */
export function formatDateRange(startIso: string, endIso: string) {
  const s = parse(startIso);
  const e = parse(endIso);
  const sameYear = s.getFullYear() === e.getFullYear();
  const sameMonth = sameYear && s.getMonth() === e.getMonth();
  if (startIso === endIso) return s.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  if (sameMonth) return `${s.toLocaleDateString("en-US", { month: "long" })} ${s.getDate()}–${e.getDate()}, ${e.getFullYear()}`;
  if (sameYear) {
    return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${e.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${e.getFullYear()}`;
  }
  return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} – ${e.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

/** An ISO timestamp shown in a given time zone, e.g. "Jun 14, 8:05 AM". */
export function formatDateTime(iso: string, timeZone: string = ORG_TIME_ZONE) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone });
}

export function formatClock(iso: string, timeZone: string = ORG_TIME_ZONE) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone });
}

/** "Just now", "12m ago", "3h ago", "Yesterday", "Oct 8" */
export function formatRelative(iso: string, now = new Date()) {
  const then = new Date(iso);
  const mins = Math.round((now.getTime() - then.getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  if (hours < 48) return "Yesterday";
  return then.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: ORG_TIME_ZONE });
}

/** A "YYYY-MM-DDTHH:mm" value from a datetime-local input, shown as "Jun 18, 3:00 PM". */
export function formatLocalDateTime(value: string) {
  const [d, t] = value.split("T");
  return `${parse(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })}${t ? `, ${formatTime(t)}` : ""}`;
}

/** "Always", "From Jun 18, 3:00 PM", "Until Jun 1", "Jun 1 – Jun 18" */
export function visibilityLabel(from?: string, until?: string) {
  if (from && until) return `${formatLocalDateTime(from)} – ${formatLocalDateTime(until)}`;
  if (from) return `From ${formatLocalDateTime(from)}`;
  if (until) return `Until ${formatLocalDateTime(until)}`;
  return "Always";
}

/** All dates from start to end inclusive, as YYYY-MM-DD (capped at 14). */
export function eventDays(startIso: string, endIso: string) {
  const days: string[] = [];
  const d = parse(startIso);
  const end = parse(endIso);
  while (d <= end && days.length < 14) {
    days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
    d.setDate(d.getDate() + 1);
  }
  return days;
}

/** Agenda day tabs: the days that have sessions, or the event's days if none do yet. */
export function agendaDays(startIso: string, endIso: string, sessionDates: string[]) {
  const withSessions = [...new Set(sessionDates)].sort();
  if (withSessions.length) return withSessions;
  return eventDays(startIso, endIso).slice(0, 7);
}

export const plural = (n: number, word: string, many = `${word}s`) => `${n} ${n === 1 ? word : many}`;
