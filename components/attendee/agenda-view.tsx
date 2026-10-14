"use client";

import * as React from "react";
import Link from "next/link";
import { Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { groupByTimeSlot } from "@/lib/agenda";
import { formatDayLong, formatDayShort, formatTimeRange } from "@/lib/format";
import type { AgendaSession, Speaker, Track } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function AgendaView({
  eventId,
  days,
  sessions,
  tracks,
  speakers,
  tzLabel,
  tzLong,
}: {
  eventId: string;
  days: string[];
  sessions: AgendaSession[];
  tracks: Track[];
  speakers: Speaker[];
  tzLabel: string;
  tzLong: string;
}) {
  const [day, setDay] = React.useState(days[0]);
  const [track, setTrack] = React.useState("all");

  const visible = sessions.filter(
    (s) => s.date === day && (track === "all" || !s.trackId || s.trackId === track),
  );
  const slots = groupByTimeSlot(visible);
  const trackName = (id?: string) => tracks.find((t) => t.id === id)?.name;
  const speakerNames = (ids: string[]) =>
    ids.map((id) => speakers.find((s) => s.id === id)?.name).filter(Boolean).join(", ");

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Day" className="flex flex-wrap gap-2">
          {days.map((d) => (
            <Button
              key={d}
              role="tab"
              aria-selected={d === day}
              size="sm"
              variant={d === day ? "default" : "outline"}
              onClick={() => setDay(d)}
            >
              {formatDayShort(d)}
            </Button>
          ))}
        </div>
        <Button asChild variant="outline">
          <Link href={`/events/${eventId}/agenda/print`} className="no-underline">
            <Printer /> Print agenda
          </Link>
        </Button>
      </div>

      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-primary">{formatDayLong(day)}</h2>
          <p className="mt-1 text-xs text-muted-foreground">All times {tzLong} ({tzLabel})</p>
        </div>
        <div className="w-44">
          <label htmlFor="track-filter" className="sr-only">Filter by track</label>
          <NativeSelect id="track-filter" value={track} onChange={(e) => setTrack(e.target.value)}>
            <option value="all">All tracks</option>
            {tracks.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </NativeSelect>
        </div>
      </div>

      {slots.length === 0 ? (
        <p className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">Nothing scheduled for this day yet.</p>
      ) : (
        <ol className="overflow-hidden rounded-lg border bg-card">
          {slots.map((slot) => (
            <li key={slot.start} className="grid border-b last:border-b-0 sm:grid-cols-[9.5rem_1fr]">
              <div className="bg-muted px-4 py-3 text-xs font-bold sm:text-[13px]">
                {formatTimeRange(slot.start, slot.end)}
              </div>
              <ul>
                {slot.sessions.map((s) => {
                  const tName = trackName(s.trackId);
                  const names = speakerNames(s.speakerIds);
                  return (
                    <li key={s.id} className={cn("flex items-start justify-between gap-3 border-b px-4 py-3 last:border-b-0")}>
                      <div>
                        <Link href={`/events/${eventId}/sessions/${s.id}`} className="font-bold text-primary no-underline hover:underline">
                          {s.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {s.location}
                          {!s.trackId && names && ` · ${names}`}
                        </p>
                      </div>
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {s.virtualLink && <Badge variant="muted">In person + virtual</Badge>}
                        {tName && <Badge>{tName}</Badge>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
