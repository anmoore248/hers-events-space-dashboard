import { notFound } from "next/navigation";
import { AgendaView } from "@/components/attendee/agenda-view";
import { getAgenda, getEvent } from "@/lib/data";
import { agendaDays, tzLabel, tzLong } from "@/lib/format";

export default async function AgendaPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const [event, agenda] = await Promise.all([getEvent(eventId), getAgenda(eventId)]);
  if (!event) notFound();

  return (
    <AgendaView
      eventId={eventId}
      days={agendaDays(event.startDate, event.endDate, agenda.sessions.map((s) => s.date))}
      sessions={agenda.sessions}
      tracks={agenda.tracks}
      speakers={agenda.speakers}
      tzLabel={tzLabel(event.timeZone)}
      tzLong={tzLong(event.timeZone)}
    />
  );
}
