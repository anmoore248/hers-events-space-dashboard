import { EventLinksManager } from "@/components/staff/event-links-manager";
import { byEvent, eventLinks } from "@/lib/mock-data";

export default async function LinksPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  return <EventLinksManager initial={byEvent(eventLinks, eventId)} />;
}
