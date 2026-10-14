import { AttendeesManager } from "@/components/staff/attendees-manager";
import { byEvent, enrollments, subcommittees } from "@/lib/mock-data";

export default async function AttendeesPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  return <AttendeesManager eventId={eventId} initial={byEvent(enrollments, eventId)} subcommittees={byEvent(subcommittees, eventId)} total={68} />;
}
