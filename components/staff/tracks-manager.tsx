"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmButton } from "@/components/confirm-button";
import { EmptyState } from "@/components/empty-state";
import { FormError } from "@/components/form-error";
import { useAction } from "@/hooks/use-action";
import { addTrack, deleteTrack, renameTrack, reorderTracks } from "@/lib/actions/tracks";
import { plural } from "@/lib/format";
import type { Track } from "@/lib/types";
import { ReorderButtons, move } from "./reorder-buttons";

type Row = Track & { sessionCount: number };

function RenameTrack({ eventId, track }: { eventId: string; track: Row }) {
  const [name, setName] = React.useState(track.name);
  return (
    <ConfirmButton
      label="Rename"
      title={`Rename “${track.name}”`}
      confirmLabel="Save name"
      onConfirm={() => renameTrack(eventId, track.id, name)}
    >
      <Input aria-label="Track name" value={name} onChange={(e) => setName(e.target.value)} />
    </ConfirmButton>
  );
}

export function TracksManager({ eventId, tracks }: { eventId: string; tracks: Row[] }) {
  const [order, setOrder] = React.useState(tracks);
  React.useEffect(() => setOrder(tracks), [tracks]);
  const [name, setName] = React.useState("");
  const add = useAction();
  const reorder = useAction();

  function onMove(from: number, to: number) {
    const next = move(order, from, to);
    setOrder(next);
    reorder.run(() => reorderTracks(eventId, next.map((t) => t.id)));
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-base font-bold text-primary">Tracks</h2>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">Parallel session tracks. Order sets the column order on screen.</p>
      <FormError message={reorder.error} className="mb-3 text-xs font-medium text-destructive" />
      {order.length === 0 ? (
        <EmptyState className="mb-6" title="There are no tracks at this time.">
          Most events don&rsquo;t need tracks. Add them only when sessions run in parallel.
        </EmptyState>
      ) : (
        <ul className="mb-6 overflow-hidden rounded-lg border bg-card">
          {order.map((t, i) => (
            <li key={t.id} className="flex flex-wrap items-center gap-3 border-b px-4 py-3 last:border-b-0">
              <ReorderButtons label={t.name} index={i} count={order.length} onMove={onMove} disabled={reorder.pending} />
              <span className="flex-1 font-bold">{t.name}</span>
              <span className="text-xs text-muted-foreground">{plural(t.sessionCount, "session")}</span>
              <RenameTrack key={t.name} eventId={eventId} track={t} />
              <ConfirmButton
                label="Delete"
                title={`Delete the ${t.name} track?`}
                confirmLabel="Delete track"
                destructive
                description={t.sessionCount ? <p>Its {plural(t.sessionCount, "session")} will move to no track (shown to everyone).</p> : undefined}
                onConfirm={() => deleteTrack(eventId, t.id)}
              />
            </li>
          ))}
        </ul>
      )}
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim()) return;
          const res = await add.run(() => addTrack(eventId, name));
          if (res.ok) setName("");
        }}
      >
        <div className="grid min-w-60 flex-1 gap-1.5">
          <Label htmlFor="new-track">New track</Label>
          <Input id="new-track" placeholder="Track name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <Button type="submit" disabled={add.pending}>Add track</Button>
      </form>
      <FormError message={add.error} className="mt-2 text-xs font-medium text-destructive" />
    </div>
  );
}
