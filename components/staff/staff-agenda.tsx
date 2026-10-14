"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/confirm-button";
import { findOverlap } from "@/lib/agenda";
import { formatDayTab, formatDayShort, formatTimeRange } from "@/lib/format";
import type { AgendaSession, Speaker, Track } from "@/lib/mock-data";

export function StaffAgenda({
  eventId, days, initial, tracks, speakers,
}: { eventId: string; days: string[]; initial: AgendaSession[]; tracks: Track[]; speakers: Speaker[] }) {
  const [sessions, setSessions] = React.useState(initial);
  const [day, setDay] = React.useState(days[0]);
  const base = `/admin/events/${eventId}/agenda`;

  const list = sessions
    .filter((s) => s.date === day)
    .sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end));

  const duplicate = (s: AgendaSession) =>
    // TODO: server action — copy the session, then open the copy's edit page.
    setSessions((prev) => [...prev, { ...s, id: crypto.randomUUID(), title: `${s.title} (copy)` }]);

  return (
    <div className="max-w-4xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Day" className="flex flex-wrap gap-2">
          {days.map((d, i) => (
            <Button key={d} role="tab" aria-selected={d === day} size="sm" variant={d === day ? "default" : "outline"} onClick={() => setDay(d)}>
              {i === 0 ? formatDayShort(d) : formatDayTab(d)}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/events/${eventId}/agenda/print`} className="no-underline">Print preview</Link>
          </Button>
          <Button asChild>
            <Link href={`${base}/new?date=${day}`} className="no-underline"><Plus /> Add session</Link>
          </Button>
        </div>
      </div>

      <ul className="overflow-hidden rounded-lg border bg-card">
        {list.map((s) => {
          const overlap = findOverlap(s, sessions);
          const track = tracks.find((t) => t.id === s.trackId);
          const names = s.speakerIds.map((id) => speakers.find((sp) => sp.id === id)?.name).filter(Boolean).join(", ");
          return (
            <li key={s.id} className="grid gap-3 border-b px-4 py-3 last:border-b-0 sm:grid-cols-[9rem_1fr_auto] sm:items-center">
              <span className="text-xs font-bold">{formatTimeRange(s.start, s.end)}</span>
              <div>
                <Link href={`${base}/${s.id}`} className="font-bold text-primary underline">{s.title}</Link>
                <p className="text-xs text-muted-foreground">{[s.location, names].filter(Boolean).join(" · ")}</p>
                {overlap && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-destructive">
                    <AlertTriangle className="size-3.5" aria-hidden /> Overlaps &ldquo;{overlap.title}&rdquo; in the {track?.name} track
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={track ? "default" : "muted"}>{track?.name ?? "All"}</Badge>
                <Button asChild variant="outline" size="sm"><Link href={`${base}/${s.id}`} className="no-underline">Edit</Link></Button>
                <Button variant="outline" size="sm" onClick={() => duplicate(s)}>Duplicate</Button>
                <ConfirmButton label="Delete" title={`Delete “${s.title}”?`} confirmLabel="Delete session" destructive onConfirm={() => setSessions((p) => p.filter((x) => x.id !== s.id))} />
              </div>
            </li>
          );
        })}
        {list.length === 0 && <li className="p-6 text-sm text-muted-foreground">Nothing scheduled for this day. Add a session to start.</li>}
      </ul>
    </div>
  );
}
