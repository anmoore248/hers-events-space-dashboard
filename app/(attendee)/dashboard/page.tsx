import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMyEvents } from "@/lib/mock-data";

export const metadata: Metadata = { title: "My events" };

type MyEvent = ReturnType<typeof getMyEvents>[number];

function EventCard({ event }: { event: MyEvent }) {
  const expired = event.status === "Expired";
  return (
    <Link
      href={`/events/${event.id}`}
      className="group bg-card hover:border-hers-blue-light focus-visible:border-primary block rounded-lg border p-3 no-underline shadow-xs"
    >
      <div className="bg-hers-panel flex h-20 items-end rounded-md px-4 pb-3">
        <span className="text-primary/70 text-xs font-semibold">
          {event.dateLabel}
        </span>
      </div>
      <div className="px-2 pt-3 pb-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-primary text-base font-bold group-hover:underline">
            {event.name}
          </h3>
          {event.unread > 0 && !expired && (
            <Badge variant="coral">{event.unread} unread</Badge>
          )}
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          {event.dateLabel} ·{" "}
          {event.location.split(",").at(-2)?.trim() ?? event.location}
        </p>
        <Badge className="mt-3" variant={expired ? "muted" : "default"}>
          {expired ? "Read-only" : "Active"}
        </Badge>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const events = getMyEvents();
  const current = events.filter((e) => e.status !== "Expired");
  const past = events.filter((e) => e.status === "Expired");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-primary text-2xl font-bold">My events</h1>
        <Button asChild>
          <Link href="/dashboard/add-event" className="no-underline">
            <Plus /> Add an event
          </Link>
        </Button>
      </div>

      <section aria-labelledby="current-heading" className="mb-8">
        <h2
          id="current-heading"
          className="text-primary mb-3 text-sm font-bold"
        >
          Current &amp; upcoming
        </h2>
        {current.length ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {current.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            No upcoming events. Add one with the access key from your
            invitation.
          </p>
        )}
      </section>

      {past.length > 0 && (
        <section aria-labelledby="past-heading">
          <h2 id="past-heading" className="text-primary mb-3 text-sm font-bold">
            Past events
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {past.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
