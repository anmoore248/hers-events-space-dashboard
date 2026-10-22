import { TracksManager } from "@/components/staff/tracks-manager";
import { getTracks, requireStaffPage } from "@/lib/data";

export default async function TracksPage({ params }: { params: Promise<{ eventId: string }> }) {
  await requireStaffPage();
  const { eventId } = await params;
  return <TracksManager eventId={eventId} tracks={await getTracks(eventId)} />;
}
