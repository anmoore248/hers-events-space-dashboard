import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { getMyEvents } from "@/lib/data";
import { formatDateRange } from "@/lib/format";
import type { MyEvent } from "@/lib/types";

export const metadata: Metadata = { title: "My events" };

function EventCard({ event }: { event: MyEvent }) {
  const dates = formatDateRange(event.startDate, event.endDate);
  return (
    <Link
      href={`/events/${event.id}`}
      className="group block rounded-lg border bg-card p-3 no-underline shadow-xs hover:border-hers-blue-light focus-visible:border-primary"
    >
      <div className="flex h-20 items-end rounded-md bg-hers-panel px-4 pb-3">
        <span className="text-xs font-semibold text-primary/70">{dates}</span>
      </div>
      <div className="px-2 pb-1 pt-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-bold text-primary group-hover:underline">{event.name}</h3>
          {event.unread > 0 && !event.readOnly && <Badge variant="coral">{event.unread} unread</Badge>}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {[dates, event.location].filter(Boolean).join(" · ")}
        </p>
        <Badge className="mt-3" variant={event.readOnly ? "muted" : "default"}>
          {event.readOnly ? "Read-only" : "Active"}
        </Badge>
      </div>
    </Link>
  );
}

export default async function DashboardPage() {
  const events = await getMyEvents();
  const current = events.filter((e) => !e.readOnly);
  const past = events.filter((e) => e.readOnly);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-primary">My events</h1>
        <Button asChild>
          <Link href="/dashboard/add-event" className="no-underline">
            <Plus /> Add an event
          </Link>
        </Button>
      </div>

      {events.length === 0 ? (
        <EmptyState title="There are no events at this time.">
          When you receive a HERS invitation, select &ldquo;Add an event&rdquo; and enter the access key from that email.
        </EmptyState>
      ) : (
        <>
          <section aria-labelledby="current-heading" className="mb-8">
            <h2 id="current-heading" className="mb-3 text-sm font-bold text-primary">Current &amp; upcoming</h2>
            {current.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {current.map((e) => <EventCard key={e.id} event={e} />)}
              </div>
            ) : (
              <EmptyState title="There are no current or upcoming events." />
            )}
          </section>

          {past.length > 0 && (
            <section aria-labelledby="past-heading">
              <h2 id="past-heading" className="mb-3 text-sm font-bold text-primary">Past events</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {past.map((e) => <EventCard key={e.id} event={e} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
