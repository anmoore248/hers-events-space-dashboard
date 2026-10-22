import { AttendeesManager } from "@/components/staff/attendees-manager";
import { getEnrollments, getSubcommittees, requireStaffPage } from "@/lib/data";

export default async function AttendeesPage({ params }: { params: Promise<{ eventId: string }> }) {
  await requireStaffPage();
  const { eventId } = await params;
  const [enrollments, subcommittees] = await Promise.all([getEnrollments(eventId), getSubcommittees(eventId)]);
  return <AttendeesManager eventId={eventId} enrollments={enrollments} subcommittees={subcommittees} />;
}
