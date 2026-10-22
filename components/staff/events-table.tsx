"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateRange } from "@/lib/format";
import type { EventSummary } from "@/lib/types";

const filters = ["Current", "Past", "All"] as const;

export function EventsTable({ events }: { events: EventSummary[] }) {
  const [filter, setFilter] = React.useState<(typeof filters)[number]>("Current");
  const shown = events.filter((e) =>
    filter === "All" ? true : filter === "Past" ? e.status === "Expired" : e.status !== "Expired",
  );

  return (
    <section aria-labelledby="events-heading" className="min-w-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="events-heading" className="text-base font-bold text-primary">Events</h2>
        <div className="flex gap-2" role="group" aria-label="Filter events">
          {filters.map((f) => (
            <Button key={f} size="sm" variant={f === filter ? "default" : "outline"} aria-pressed={f === filter} onClick={() => setFilter(f)}>
              {f}
            </Button>
          ))}
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Attendees</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shown.map((e) => (
            <TableRow key={e.id}>
              <TableCell>
                <Link href={`/admin/events/${e.id}`} className="font-bold text-primary underline">{e.name}</Link>
              </TableCell>
              <TableCell className="whitespace-nowrap">{formatDateRange(e.startDate, e.endDate)}</TableCell>
              <TableCell>{e.attendeeCount}</TableCell>
              <TableCell>
                {e.status === "Expired" && e.groupMeCleanupDue ? (
                  <Badge variant="coral">Expired · GroupMe cleanup due</Badge>
                ) : (
                  <Badge variant={e.status === "Expired" ? "muted" : "default"}>{e.status}</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
          {shown.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                {events.length === 0 ? "There are no events at this time. Select “New event” to create one." : `There are no ${filter.toLowerCase()} events at this time.`}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </section>
  );
}
