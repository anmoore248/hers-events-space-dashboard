/** Display helpers. Real times are stored in UTC and shown in the event's time zone (doc §8.1). */

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

/** All dates from start to end inclusive, as YYYY-MM-DD. */
export function eventDays(startIso: string, endIso: string) {
  const days: string[] = [];
  const d = parse(startIso);
  const end = parse(endIso);
  while (d <= end && days.length < 14) {
    days.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return days;
}
