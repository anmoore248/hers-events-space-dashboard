import { notFound } from "next/navigation";
import { SubcommitteesManager } from "@/components/staff/subcommittees-manager";
import { getEnrollments, getEvent, getSubcommittees, requireStaffPage } from "@/lib/data";

export default async function SubcommitteesPage({ params }: { params: Promise<{ eventId: string }> }) {
  await requireStaffPage();
  const { eventId } = await params;
  const [event, subcommittees, enrollments] = await Promise.all([getEvent(eventId), getSubcommittees(eventId), getEnrollments(eventId)]);
  if (!event) notFound();
  return (
    <SubcommitteesManager
      eventId={eventId}
      eventName={event.name}
      subcommittees={subcommittees}
      attendees={enrollments.filter((e) => e.status !== "revoked")}
    />
  );
}
