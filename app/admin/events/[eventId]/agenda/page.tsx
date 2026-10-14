import { StaffAgenda } from "@/components/staff/staff-agenda";
import { eventDays } from "@/lib/format";
import { agendaSessions, byEvent, getEvent, speakers, tracks } from "@/lib/mock-data";

export default async function StaffAgendaPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const event = getEvent(eventId)!;
  return (
    <StaffAgenda
      eventId={eventId}
      days={eventDays(event.startDate, event.endDate).slice(0, 7)}
      initial={byEvent(agendaSessions, eventId)}
      tracks={byEvent(tracks, eventId)}
      speakers={byEvent(speakers, eventId)}
    />
  );
}
