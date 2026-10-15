import { SpeakersList } from "@/components/attendee/speakers-list";
import { byEvent, sessionsForSpeaker, speakers } from "@/lib/mock-data";

export default async function SpeakersPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const rows = byEvent(speakers, eventId).map((s) => ({
    id: s.id,
    name: s.name,
    title: s.title,
    organization: s.organization,
    sessionCount: sessionsForSpeaker(s.id).length,
  }));
  return <SpeakersList eventId={eventId} speakers={rows} />;
}
