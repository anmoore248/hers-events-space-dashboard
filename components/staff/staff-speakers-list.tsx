"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmButton } from "@/components/confirm-button";
import { EmptyState } from "@/components/empty-state";
import { deleteSpeaker } from "@/lib/actions/speakers";
import { plural } from "@/lib/format";
import type { SpeakerRow } from "@/lib/types";

export function StaffSpeakersList({ eventId, speakers }: { eventId: string; speakers: SpeakerRow[] }) {
  const [q, setQ] = React.useState("");
  const base = `/admin/events/${eventId}/speakers`;
  const query = q.trim().toLowerCase();
  const shown = speakers.filter((s) => `${s.name} ${s.title ?? ""} ${s.organization ?? ""}`.toLowerCase().includes(query));

  return (
    <div className="max-w-4xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold text-primary">Speakers ({speakers.length})</h2>
        <div className="flex flex-wrap gap-2">
          {speakers.length > 0 && (
            <div className="relative w-60">
              <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="search" aria-label="Search speakers" placeholder="Search speakers" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
            </div>
          )}
          <Button asChild><Link href={`${base}/new`} className="no-underline"><Plus /> Add speaker</Link></Button>
        </div>
      </div>
      {speakers.length === 0 ? (
        <EmptyState title="There are no speakers at this time." />
      ) : (
        <ul className="overflow-hidden rounded-lg border bg-card">
          {shown.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-3 border-b px-4 py-3 last:border-b-0">
              <div className="flex-1">
                <Link href={`${base}/${s.id}`} className="font-bold text-primary underline">{s.name}</Link>
                <p className="text-xs text-muted-foreground">{[s.title, s.organization].filter(Boolean).join(" · ")}</p>
              </div>
              <span className="text-xs text-muted-foreground">{plural(s.sessionCount, "session")}</span>
              <Button asChild variant="outline" size="sm"><Link href={`${base}/${s.id}`} className="no-underline">Edit</Link></Button>
              <ConfirmButton
                label="Delete"
                title={`Delete ${s.name}?`}
                confirmLabel="Delete speaker"
                destructive
                description={s.sessionCount ? <p>They&rsquo;ll be removed from {plural(s.sessionCount, "session")}.</p> : undefined}
                onConfirm={() => deleteSpeaker(eventId, s.id)}
              />
            </li>
          ))}
          {shown.length === 0 && <li className="p-6 text-sm text-muted-foreground">No matches. Try a different search.</li>}
        </ul>
      )}
    </div>
  );
}
