import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { TabNav } from "@/components/layout/tab-nav";
import { getEventAccess } from "@/lib/access";
import { getEvent } from "@/lib/mock-data";

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
  const event = getEvent(eventId);
  if (!event || (await getEventAccess(eventId)) === "none") notFound();

  const city = event.location.split(",").slice(-2).join(",").trim();

  return (
    <>
      <div className="bg-background border-b px-4 pt-5 sm:px-6 print:hidden">
        <div className="mx-auto max-w-5xl">
          <Breadcrumb
            items={[
              { label: "My events", href: "/dashboard" },
              { label: event.name },
            ]}
          />
          <h1 className="text-primary text-2xl font-bold">{event.name}</h1>
          <p className="text-muted-foreground mt-1 mb-3 text-xs">
            {event.dateLabel} · {city} · Times shown in {event.tzLabel}
          </p>
          <TabNav base={`/events/${event.id}`} tabs={tabs} />
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">{children}</div>
    </>
  );
}
