import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { SessionForm } from "@/components/staff/session-form";
import { byEvent, getEvent, getSession, speakers, tracks } from "@/lib/mock-data";

export default async function EditSessionPage({ params }: { params: Promise<{ eventId: string; sessionId: string }> }) {
  const { eventId, sessionId } = await params;
  const event = getEvent(eventId)!;
  const s = getSession(sessionId);
  if (!s) notFound();
  return (
    <>
      <Breadcrumb items={[{ label: "Agenda", href: `/admin/events/${eventId}/agenda` }, { label: "Edit session" }]} />
      <SessionForm
        isNew={false}
        eventId={eventId}
        tzLabel={event.tzLabel}
        tracks={byEvent(tracks, eventId)}
        speakers={byEvent(speakers, eventId)}
        initialSpeakerIds={s.speakerIds}
        defaultValues={{
          title: s.title, date: s.date, trackId: s.trackId ?? "", start: s.start, end: s.end,
          location: s.location ?? "", virtualLink: s.virtualLink ?? "", description: s.description,
        }}
      />
    </>
  );
}
