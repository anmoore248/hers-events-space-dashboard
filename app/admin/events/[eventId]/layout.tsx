import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/breadcrumb";
import { TabNav } from "@/components/layout/tab-nav";
import { getEvent } from "@/lib/mock-data";

const tabs = [
  { href: "", label: "Details" },
  { href: "links", label: "Links" },
  { href: "agenda", label: "Agenda" },
  { href: "tracks", label: "Tracks" },
  { href: "speakers", label: "Speakers" },
  { href: "attendees", label: "Attendees" },
  { href: "subcommittees", label: "Subcommittees" },
  { href: "announcements", label: "Announcements" },
  { href: "check-in", label: "Check-in" },
];

export default async function AdminEventLayout({ children, params }: { children: React.ReactNode; params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const event = getEvent(eventId);
  if (!event) notFound();

  return (
    <div className="max-w-6xl">
      <Breadcrumb items={[{ label: "Events", href: "/admin" }, { label: event.name }]} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-primary">{event.name}</h1>
        <div className="flex gap-2">
          <Badge variant={event.status === "Expired" ? "muted" : "default"}>{event.status}</Badge>
          <Badge>{event.attendeeCount} attendees</Badge>
        </div>
      </div>
      <div className="mb-6 mt-3 border-b">
        <TabNav base={`/admin/events/${event.id}`} tabs={tabs} />
      </div>
      {children}
    </div>
  );
}
