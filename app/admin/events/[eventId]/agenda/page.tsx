import { notFound } from "next/navigation";
import { StaffAgenda } from "@/components/staff/staff-agenda";
import { getAgenda, getEvent, requireStaffPage } from "@/lib/data";
import { eventDays } from "@/lib/format";

export default async function StaffAgendaPage({ params }: { params: Promise<{ eventId: string }> }) {
  await requireStaffPage();
  const { eventId } = await params;
  const [event, agenda] = await Promise.all([getEvent(eventId), getAgenda(eventId)]);
  if (!event) notFound();

  // Every day of a short event, plus any day that already has sessions (multi-month programs).
  const span = eventDays(event.startDate, event.endDate);
  const short = span.at(-1) === event.endDate;
  const days = [...new Set([...(short ? span : [event.startDate]), ...agenda.sessions.map((s) => s.date)])].sort();

  return <StaffAgenda eventId={eventId} days={days} sessions={agenda.sessions} tracks={agenda.tracks} speakers={agenda.speakers} />;
}
