import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { SessionForm } from "@/components/staff/session-form";
import { getAgenda, getEvent, requireStaffPage } from "@/lib/data";
import { tzLabel } from "@/lib/format";

export default async function NewSessionPage({
  params, searchParams,
}: { params: Promise<{ eventId: string }>; searchParams: Promise<{ date?: string; from?: string }> }) {
  await requireStaffPage();
  const { eventId } = await params;
  const { date, from } = await searchParams;
  const [event, agenda] = await Promise.all([getEvent(eventId), getAgenda(eventId)]);
  if (!event) notFound();

  // "Save & duplicate" and "Duplicate" open this page pre-filled from another session.
  const source = from ? agenda.sessions.find((s) => s.id === from) : undefined;

  return (
    <>
      <Breadcrumb items={[{ label: "Agenda", href: `/admin/events/${eventId}/agenda` }, { label: "New session" }]} />
      <SessionForm
        isNew
        eventId={eventId}
        tzLabel={tzLabel(event.timeZone)}
        tracks={agenda.tracks}
        speakers={agenda.speakers}
        initialSpeakerIds={source?.speakerIds}
        defaultValues={
          source
            ? { title: source.title, date: source.date, trackId: source.trackId ?? "", start: source.start, end: source.end, location: source.location ?? "", virtualLink: source.virtualLink ?? "", description: source.description }
            : { date: date ?? event.startDate, trackId: "" }
        }
      />
    </>
  );
}
