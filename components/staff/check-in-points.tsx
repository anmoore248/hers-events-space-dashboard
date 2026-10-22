"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmButton } from "@/components/confirm-button";
import { EmptyState } from "@/components/empty-state";
import { FormError } from "@/components/form-error";
import { useAction } from "@/hooks/use-action";
import { addCheckInPoint, deleteCheckInPoint, renameCheckInPoint } from "@/lib/actions/check-in";
import { formatDate, plural } from "@/lib/format";
import type { CheckInPoint } from "@/lib/types";

function RenamePoint({ eventId, point }: { eventId: string; point: CheckInPoint }) {
  const [label, setLabel] = React.useState(point.label);
  return (
    <ConfirmButton label="Rename" title={`Rename “${point.label}”`} confirmLabel="Save name" onConfirm={() => renameCheckInPoint(eventId, point.id, label)}>
      <Input aria-label="Point name" value={label} onChange={(e) => setLabel(e.target.value)} />
    </ConfirmButton>
  );
}

export function CheckInPoints({ eventId, points }: { eventId: string; points: CheckInPoint[] }) {
  const [label, setLabel] = React.useState("");
  const [date, setDate] = React.useState("");
  const add = useAction();

  return (
    <div className="max-w-2xl">
      <h2 className="text-base font-bold text-primary">Check-in points</h2>
      <p className="mb-4 mt-2 text-sm text-muted-foreground">
        Most events only need &ldquo;Arrival.&rdquo; For programs that meet more than once, like the Weekend HLI, add one point per meeting (for example &ldquo;Month 1&rdquo; to &ldquo;Month 6&rdquo;).
      </p>
      {points.length === 0 ? (
        <EmptyState className="mb-6" title="There are no check-in points at this time." />
      ) : (
        <ul className="mb-6 overflow-hidden rounded-lg border bg-card">
          {points.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 border-b px-4 py-3 last:border-b-0">
              <div className="flex-1">
                <p className="font-bold">{p.label}</p>
                {p.date && <p className="text-xs text-muted-foreground">{formatDate(p.date)}</p>}
              </div>
              <span className="text-xs text-muted-foreground">{p.checkedIn} checked in</span>
              <RenamePoint key={p.label} eventId={eventId} point={p} />
              <ConfirmButton
                label="Delete"
                title={`Delete “${p.label}”?`}
                confirmLabel="Delete point"
                destructive
                disabled={points.length === 1}
                description={p.checkedIn ? <p>Its {plural(p.checkedIn, "check-in")} will be deleted too.</p> : undefined}
                onConfirm={() => deleteCheckInPoint(eventId, p.id)}
              />
            </li>
          ))}
        </ul>
      )}
      <form
        className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!label.trim()) return;
          const res = await add.run(() => addCheckInPoint(eventId, { label, date: date || undefined }));
          if (res.ok) { setLabel(""); setDate(""); }
        }}
      >
        <div className="grid gap-1.5"><Label htmlFor="pt-label">Label</Label><Input id="pt-label" value={label} onChange={(e) => setLabel(e.target.value)} /></div>
        <div className="grid gap-1.5"><Label htmlFor="pt-date">Date (optional)</Label><Input id="pt-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <Button type="submit" disabled={add.pending}>Add point</Button>
      </form>
      <FormError message={add.error} className="mt-2 text-xs font-medium text-destructive" />
    </div>
  );
}
