import { Breadcrumb } from "@/components/breadcrumb";
import { SessionForm } from "@/components/staff/session-form";
import { byEvent, getEvent, speakers, tracks } from "@/lib/mock-data";

export default async function NewSessionPage({
  params, searchParams,
}: { params: Promise<{ eventId: string }>; searchParams: Promise<{ date?: string }> }) {
  const { eventId } = await params;
  const { date } = await searchParams;
  const event = getEvent(eventId)!;
  return (
    <>
      <Breadcrumb items={[{ label: "Agenda", href: `/admin/events/${eventId}/agenda` }, { label: "New session" }]} />
      <SessionForm
        isNew
        eventId={eventId}
        tzLabel={event.tzLabel}
        tracks={byEvent(tracks, eventId)}
        speakers={byEvent(speakers, eventId)}
        defaultValues={{ date: date ?? event.startDate, trackId: "" }}
      />
    </>
  );
}
