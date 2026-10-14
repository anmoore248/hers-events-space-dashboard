import { CheckInTable } from "@/components/staff/check-in-table";
import { byEvent, checkInPoints, enrollments } from "@/lib/mock-data";

export default async function CheckInPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const points = byEvent(checkInPoints, eventId);
  return (
    <CheckInTable
      eventId={eventId}
      points={points.length ? points : [{ id: "arrival", eventId, label: "Arrival", checkedIn: 0 }]}
      initial={byEvent(enrollments, eventId).filter((e) => e.status === "active")}
      total={68}
      demoCheckedIn={42}
    />
  );
}
