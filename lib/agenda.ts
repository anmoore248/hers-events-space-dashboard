import type { AgendaSession } from "./mock-data";

export type TimeSlot = { start: string; end: string; sessions: AgendaSession[] };

/** Groups a day's sessions by start time, so parallel tracks sit together. */
export function groupByTimeSlot(sessions: AgendaSession[]): TimeSlot[] {
  const sorted = [...sessions].sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end));
  const slots: TimeSlot[] = [];
  for (const s of sorted) {
    const last = slots.at(-1);
    if (last && last.start === s.start) {
      last.sessions.push(s);
      if (s.end > last.end) last.end = s.end;
    } else {
      slots.push({ start: s.start, end: s.end, sessions: [s] });
    }
  }
  return slots;
}

/** Sessions in the same track whose times overlap (doc §11.1 warning). */
export function findOverlap(session: AgendaSession, all: AgendaSession[]) {
  if (!session.trackId) return undefined;
  return all.find(
    (o) =>
      o.id !== session.id &&
      o.trackId === session.trackId &&
      o.date === session.date &&
      o.start < session.end &&
      session.start < o.end,
  );
}
