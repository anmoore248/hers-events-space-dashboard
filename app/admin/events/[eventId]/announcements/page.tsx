import { notFound } from "next/navigation";
import { StaffAnnouncements } from "@/components/staff/staff-announcements";
import { getEvent, getEventStats, getStaffAnnouncements, requireStaffPage } from "@/lib/data";

export default async function StaffAnnouncementsPage({ params }: { params: Promise<{ eventId: string }> }) {
  await requireStaffPage();
  const { eventId } = await params;
  const [event, list, stats] = await Promise.all([getEvent(eventId), getStaffAnnouncements(eventId), getEventStats(eventId)]);
  if (!event) notFound();
  return <StaffAnnouncements eventId={eventId} timeZone={event.timeZone} announcements={list} signedUp={stats.signedUp} />;
}
