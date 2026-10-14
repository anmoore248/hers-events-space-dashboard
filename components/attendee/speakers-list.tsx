"use client";

import Link from "next/link";
import { SearchableList } from "./searchable-list";

type Row = { id: string; name: string; title: string; organization: string; sessionCount: number };

export function SpeakersList({ eventId, speakers }: { eventId: string; speakers: Row[] }) {
  return (
    <SearchableList
      title="Speakers"
      items={speakers}
      getKey={(s) => s.id}
      placeholder="Search speakers"
      searchText={(s) => `${s.name} ${s.title} ${s.organization}`}
      renderItem={(s) => (
        <Link href={`/events/${eventId}/speakers/${s.id}`} className="flex items-center justify-between gap-3 px-4 py-3 no-underline hover:bg-muted">
          <span>
            <span className="block font-bold text-primary">{s.name}</span>
            <span className="text-xs text-muted-foreground">{s.title} · {s.organization}</span>
          </span>
          <span className="whitespace-nowrap text-xs text-primary">
            {s.sessionCount} session{s.sessionCount === 1 ? "" : "s"} ›
          </span>
        </Link>
      )}
    />
  );
}
