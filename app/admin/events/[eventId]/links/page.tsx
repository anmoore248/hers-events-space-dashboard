import { notFound } from "next/navigation";
import { EventLinksManager } from "@/components/staff/event-links-manager";
import { getEvent, getEventLinks, requireStaffPage } from "@/lib/data";
import { tzLabel } from "@/lib/format";

export default async function LinksPage({ params }: { params: Promise<{ eventId: string }> }) {
  await requireStaffPage();
  const { eventId } = await params;
  const [event, links] = await Promise.all([getEvent(eventId), getEventLinks(eventId)]);
  if (!event) notFound();
  return <EventLinksManager eventId={eventId} tzLabel={tzLabel(event.timeZone)} links={links} />;
}
