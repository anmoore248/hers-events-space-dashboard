"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmButton } from "@/components/confirm-button";
import type { CheckInPoint } from "@/lib/mock-data";

export function CheckInPoints({ initial }: { initial: CheckInPoint[] }) {
  const [points, setPoints] = React.useState(initial);
  const [label, setLabel] = React.useState("");
  const [date, setDate] = React.useState("");
  const [rename, setRename] = React.useState("");

  return (
    <div className="max-w-2xl">
      <h2 className="text-base font-bold text-primary">Check-in points</h2>
      <p className="mb-4 mt-2 text-sm text-muted-foreground">
        Most events only need &ldquo;Arrival.&rdquo; Add one point per meeting for multi-session programs (example below: Weekend HLI 2027).
      </p>
      <ul className="mb-6 overflow-hidden rounded-lg border bg-card">
        {points.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-3 border-b px-4 py-3 last:border-b-0">
            <div className="flex-1">
              <p className="font-bold">{p.label}</p>
              {p.date && <p className="text-xs text-muted-foreground">{p.date}</p>}
            </div>
            <span className="text-xs text-muted-foreground">{p.checkedIn} checked in</span>
            <ConfirmButton label="Rename" title={`Rename “${p.label}”`} confirmLabel="Save name" onConfirm={() => rename.trim() && setPoints((l) => l.map((x) => (x.id === p.id ? { ...x, label: rename.trim() } : x)))}>
              <Input aria-label="Point name" defaultValue={p.label} onChange={(e) => setRename(e.target.value)} />
            </ConfirmButton>
            <ConfirmButton
              label="Delete"
              title={`Delete “${p.label}”?`}
              confirmLabel="Delete point"
              destructive
              description={p.checkedIn ? <p>Its {p.checkedIn} check-ins will be deleted too.</p> : undefined}
              onConfirm={() => setPoints((l) => l.filter((x) => x.id !== p.id))}
            />
          </li>
        ))}
      </ul>
      <form
        className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          if (!label.trim()) return;
          const d = date ? new Date(`${date}T12:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : undefined;
          setPoints((l) => [...l, { id: crypto.randomUUID(), eventId: l[0]?.eventId ?? "", label: label.trim(), date: d, checkedIn: 0 }]);
          setLabel("");
          setDate("");
        }}
      >
        <div className="grid gap-1.5"><Label htmlFor="pt-label">Label</Label><Input id="pt-label" placeholder="e.g. Month 7" value={label} onChange={(e) => setLabel(e.target.value)} /></div>
        <div className="grid gap-1.5"><Label htmlFor="pt-date">Date (optional)</Label><Input id="pt-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <Button type="submit">Add point</Button>
      </form>
    </div>
  );
}
