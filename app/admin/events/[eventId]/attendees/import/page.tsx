import { Breadcrumb } from "@/components/breadcrumb";
import { AttendeeImport } from "@/components/staff/attendee-import";
import { byEvent, enrollments, subcommittees } from "@/lib/mock-data";

export default async function ImportPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  return (
    <>
      <Breadcrumb items={[{ label: "Attendees", href: `/admin/events/${eventId}/attendees` }, { label: "Import" }]} />
      <AttendeeImport
        eventId={eventId}
        existingEmails={byEvent(enrollments, eventId).map((e) => e.email.toLowerCase())}
        subcommitteeNames={byEvent(subcommittees, eventId).map((s) => s.name)}
      />
    </>
  );
}
