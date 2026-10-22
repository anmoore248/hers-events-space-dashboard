import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { SessionForm } from "@/components/staff/session-form";
import { getAgenda, getEvent, requireStaffPage } from "@/lib/data";
import { tzLabel } from "@/lib/format";

export default async function EditSessionPage({ params }: { params: Promise<{ eventId: string; sessionId: string }> }) {
  await requireStaffPage();
  const { eventId, sessionId } = await params;
  const [event, agenda] = await Promise.all([getEvent(eventId), getAgenda(eventId)]);
  const s = agenda.sessions.find((x) => x.id === sessionId);
  if (!event || !s) notFound();

  return (
    <>
      <Breadcrumb items={[{ label: "Agenda", href: `/admin/events/${eventId}/agenda` }, { label: "Edit session" }]} />
      <SessionForm
        isNew={false}
        eventId={eventId}
        sessionId={s.id}
        tzLabel={tzLabel(event.timeZone)}
        tracks={agenda.tracks}
        speakers={agenda.speakers}
        initialSpeakerIds={s.speakerIds}
        defaultValues={{
          title: s.title, date: s.date, trackId: s.trackId ?? "", start: s.start, end: s.end,
          location: s.location ?? "", virtualLink: s.virtualLink ?? "", description: s.description,
        }}
      />
    </>
  );
}
