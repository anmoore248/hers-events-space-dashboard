import { SubcommitteesManager } from "@/components/staff/subcommittees-manager";
import { byEvent, enrollments, getEvent, subcommittees } from "@/lib/mock-data";

export default async function SubcommitteesPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const event = getEvent(eventId)!;
  return (
    <SubcommitteesManager
      eventName={event.name}
      initial={byEvent(subcommittees, eventId)}
      attendees={byEvent(enrollments, eventId).filter((e) => e.status !== "revoked")}
    />
  );
}
