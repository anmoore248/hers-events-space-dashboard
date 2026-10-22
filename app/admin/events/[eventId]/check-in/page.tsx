import { notFound } from "next/navigation";
import { CheckInTable } from "@/components/staff/check-in-table";
import { getCheckInSheet, getEvent, requireStaffPage } from "@/lib/data";

export default async function CheckInPage({ params }: { params: Promise<{ eventId: string }> }) {
  await requireStaffPage();
  const { eventId } = await params;
  const [event, sheet] = await Promise.all([getEvent(eventId), getCheckInSheet(eventId)]);
  if (!event) notFound();
  return <CheckInTable eventId={eventId} timeZone={event.timeZone} sheet={sheet} />;
}
