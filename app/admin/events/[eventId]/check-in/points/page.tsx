import { Breadcrumb } from "@/components/breadcrumb";
import { CheckInPoints } from "@/components/staff/check-in-points";
import { byEvent, checkInPoints } from "@/lib/mock-data";

export default async function CheckInPointsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const own = byEvent(checkInPoints, eventId);
  // Demo: events with only "Arrival" show the Weekend HLI example, as in the prototype.
  const example = own.length > 1 ? own : byEvent(checkInPoints, "whli-2027");
  return (
    <>
      <Breadcrumb items={[{ label: "Check-in", href: `/admin/events/${eventId}/check-in` }, { label: "Check-in points" }]} />
      <CheckInPoints initial={example} />
    </>
  );
}
