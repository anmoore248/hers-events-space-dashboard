import { SpeakersList } from "@/components/attendee/speakers-list";
import { getSpeakers } from "@/lib/data";

export default async function SpeakersPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  return <SpeakersList eventId={eventId} speakers={await getSpeakers(eventId)} />;
}
