"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmButton } from "@/components/confirm-button";
import { ReorderButtons, move } from "./reorder-buttons";
import type { Track } from "@/lib/mock-data";

export function TracksManager({ initial, sessionCounts }: { initial: Track[]; sessionCounts: Record<string, number> }) {
  const [tracks, setTracks] = React.useState(initial);
  const [name, setName] = React.useState("");
  const [renameTo, setRenameTo] = React.useState("");

  return (
    <div className="max-w-2xl">
      <h2 className="text-base font-bold text-primary">Tracks</h2>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">Parallel session tracks. Order sets the column order on screen.</p>
      <ul className="mb-6 overflow-hidden rounded-lg border bg-card">
        {tracks.map((t, i) => {
          const count = sessionCounts[t.id] ?? 0;
          return (
            <li key={t.id} className="flex flex-wrap items-center gap-3 border-b px-4 py-3 last:border-b-0">
              <ReorderButtons label={t.name} index={i} count={tracks.length} onMove={(f, to) => setTracks((p) => move(p, f, to))} />
              <span className="flex-1 font-bold">{t.name}</span>
              <span className="text-xs text-muted-foreground">{count} session{count === 1 ? "" : "s"}</span>
              <ConfirmButton
                label="Rename"
                title={`Rename “${t.name}”`}
                confirmLabel="Save name"
                onConfirm={() => renameTo.trim() && setTracks((p) => p.map((x) => (x.id === t.id ? { ...x, name: renameTo.trim() } : x)))}
              >
                <Input aria-label="Track name" defaultValue={t.name} onChange={(e) => setRenameTo(e.target.value)} />
              </ConfirmButton>
              <ConfirmButton
                label="Delete"
                title={`Delete the ${t.name} track?`}
                confirmLabel="Delete track"
                destructive
                description={count ? <p>Its {count} sessions will move to no track (shown to everyone).</p> : undefined}
                onConfirm={() => setTracks((p) => p.filter((x) => x.id !== t.id))}
              />
            </li>
          );
        })}
      </ul>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          setTracks((p) => [...p, { id: crypto.randomUUID(), eventId: p[0]?.eventId ?? "", name: name.trim(), order: p.length + 1 }]);
          setName("");
        }}
      >
        <div className="grid min-w-60 flex-1 gap-1.5">
          <Label htmlFor="new-track">New track</Label>
          <Input id="new-track" placeholder="Track name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <Button type="submit">Add track</Button>
      </form>
    </div>
  );
}
