import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { TabNav } from "@/components/layout/tab-nav";
import { getEventAccess } from "@/lib/access";
import { getEvent } from "@/lib/data";
import { formatDateRange, tzLabel } from "@/lib/format";

const tabs = [
  { href: "", label: "Home" },
  { href: "agenda", label: "Agenda" },
  { href: "speakers", label: "Speakers" },
  { href: "directory", label: "Directory" },
  { href: "announcements", label: "Announcements" },
];

export default async function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const [event, access] = await Promise.all([getEvent(eventId), getEventAccess(eventId)]);
  if (!event || access === "none") notFound();

  return (
    <>
      <div className="border-b bg-background px-4 pt-5 sm:px-6 print:hidden">
        <div className="mx-auto max-w-5xl">
          <Breadcrumb items={[{ label: "My events", href: "/dashboard" }, { label: event.name }]} />
          <h1 className="text-2xl font-bold text-primary">{event.name}</h1>
          <p className="mb-3 mt-1 text-xs text-muted-foreground">
            {[formatDateRange(event.startDate, event.endDate), event.location, `Times shown in ${tzLabel(event.timeZone)}`].filter(Boolean).join(" · ")}
          </p>
          <TabNav base={`/events/${event.id}`} tabs={tabs} />
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">{children}</div>
    </>
  );
}
