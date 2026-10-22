import { StaffSpeakersList } from "@/components/staff/staff-speakers-list";
import { getSpeakers, requireStaffPage } from "@/lib/data";

export default async function StaffSpeakersPage({ params }: { params: Promise<{ eventId: string }> }) {
  await requireStaffPage();
  const { eventId } = await params;
  return <StaffSpeakersList eventId={eventId} speakers={await getSpeakers(eventId)} />;
}
