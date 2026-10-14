import { StaffAnnouncements } from "@/components/staff/staff-announcements";
import { announcements, byEvent, getEvent } from "@/lib/mock-data";

export default async function StaffAnnouncementsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const event = getEvent(eventId)!;
  return <StaffAnnouncements initial={byEvent(announcements, eventId)} signedUp={event.signedUp} />;
}
