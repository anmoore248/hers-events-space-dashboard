import { TracksManager } from "@/components/staff/tracks-manager";
import { agendaSessions, byEvent, tracks } from "@/lib/mock-data";

export default async function TracksPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const counts = Object.fromEntries(
    byEvent(tracks, eventId).map((t) => [t.id, agendaSessions.filter((s) => s.trackId === t.id).length]),
  );
  return <TracksManager initial={byEvent(tracks, eventId)} sessionCounts={counts} />;
}
