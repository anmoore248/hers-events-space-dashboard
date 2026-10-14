import { StaffSpeakersList } from "@/components/staff/staff-speakers-list";
import { byEvent, sessionsForSpeaker, speakers } from "@/lib/mock-data";

export default async function StaffSpeakersPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const rows = byEvent(speakers, eventId).map((s) => ({ ...s, sessionCount: sessionsForSpeaker(s.id).length }));
  return <StaffSpeakersList eventId={eventId} initial={rows} />;
}
