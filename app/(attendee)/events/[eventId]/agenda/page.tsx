import { AgendaView } from "@/components/attendee/agenda-view";
import { eventDays } from "@/lib/format";
import { agendaSessions, byEvent, getEvent, speakers, tracks } from "@/lib/mock-data";

const tzNames: Record<string, string> = { ET: "Eastern", CT: "Central", MT: "Mountain", PT: "Pacific" };

export default async function AgendaPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const event = getEvent(eventId)!;
  const days = eventDays(event.startDate, event.endDate);

  return (
    <AgendaView
      eventId={eventId}
      days={days.length > 7 ? days.slice(0, 7) : days}
      sessions={byEvent(agendaSessions, eventId)}
      tracks={byEvent(tracks, eventId)}
      speakers={byEvent(speakers, eventId)}
      tzLabel={event.tzLabel}
      tzLong={tzNames[event.tzLabel] ?? event.tzLabel}
    />
  );
}
