"use client";

import Link from "next/link";
import { SearchableList } from "./searchable-list";

import type { SpeakerRow } from "@/lib/types";

export function SpeakersList({ eventId, speakers }: { eventId: string; speakers: SpeakerRow[] }) {
  return (
    <SearchableList
      title="Speakers"
      items={speakers}
      getKey={(s) => s.id}
      placeholder="Search speakers"
      noItemsText="There are no speakers at this time."
      searchText={(s) => `${s.name} ${s.title ?? ""} ${s.organization ?? ""}`}
      renderItem={(s) => (
        <Link href={`/events/${eventId}/speakers/${s.id}`} className="flex items-center justify-between gap-3 px-4 py-3 no-underline hover:bg-muted">
          <span>
            <span className="block font-bold text-primary">{s.name}</span>
            <span className="text-xs text-muted-foreground">{[s.title, s.organization].filter(Boolean).join(" · ")}</span>
          </span>
          <span className="whitespace-nowrap text-xs text-primary">
            {s.sessionCount} session{s.sessionCount === 1 ? "" : "s"} ›
          </span>
        </Link>
      )}
    />
  );
}
