import { Breadcrumb } from "@/components/breadcrumb";
import { AttendeeImport } from "@/components/staff/attendee-import";
import { getEnrollments, getSubcommittees, requireStaffPage } from "@/lib/data";

export default async function ImportPage({ params }: { params: Promise<{ eventId: string }> }) {
  await requireStaffPage();
  const { eventId } = await params;
  const [enrollments, subcommittees] = await Promise.all([getEnrollments(eventId), getSubcommittees(eventId)]);
  return (
    <>
      <Breadcrumb items={[{ label: "Attendees", href: `/admin/events/${eventId}/attendees` }, { label: "Import" }]} />
      <AttendeeImport
        eventId={eventId}
        existingEmails={enrollments.map((e) => e.email.toLowerCase())}
        subcommitteeNames={subcommittees.map((s) => s.name)}
      />
    </>
  );
}
