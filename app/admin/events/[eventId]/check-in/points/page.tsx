import { Breadcrumb } from "@/components/breadcrumb";
import { CheckInPoints } from "@/components/staff/check-in-points";
import { getCheckInPoints, requireStaffPage } from "@/lib/data";

export default async function CheckInPointsPage({ params }: { params: Promise<{ eventId: string }> }) {
  await requireStaffPage();
  const { eventId } = await params;
  return (
    <>
      <Breadcrumb items={[{ label: "Check-in", href: `/admin/events/${eventId}/check-in` }, { label: "Check-in points" }]} />
      <CheckInPoints eventId={eventId} points={await getCheckInPoints(eventId)} />
    </>
  );
}
