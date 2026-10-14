"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { ConfirmButton } from "@/components/confirm-button";
import type { CheckInPoint, Enrollment } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type Filter = "all" | "not-arrived" | "checked-in";

/**
 * Check-in (doc §14.1). In the real version:
 *  - "Check in" calls a server action that inserts into check_ins with ON CONFLICT DO NOTHING,
 *    so a second tap by another staff member does nothing;
 *  - router.refresh() runs on an interval (every ~5s) so several staff stay in sync.
 */
export function CheckInTable({
  eventId, points, initial, total, demoCheckedIn,
}: { eventId: string; points: CheckInPoint[]; initial: Enrollment[]; total: number; demoCheckedIn: number }) {
  const [rows, setRows] = React.useState(initial);
  const [pointId, setPointId] = React.useState(points[0].id);
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState<Filter>("all");

  const checkedInHere = rows.filter((r) => r.checkedInAt).length;
  // Demo figure from the prototype plus anything checked in during this session.
  const count = demoCheckedIn - initial.filter((r) => r.checkedInAt).length + checkedInHere;

  const query = q.trim().toLowerCase();
  const shown = rows.filter(
    (r) =>
      (!query || `${r.displayName} ${r.organization ?? ""} ${r.email}`.toLowerCase().includes(query)) &&
      (filter === "all" || (filter === "checked-in" ? !!r.checkedInAt : !r.checkedInAt)),
  );

  const checkIn = (id: string) => {
    const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    setRows((p) => p.map((r) => (r.id === id && !r.checkedInAt ? { ...r, checkedInAt: time, checkedInBy: "Maria Lopez" } : r)));
  };

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "not-arrived", label: `Not yet arrived (${total - count})` },
    { id: "checked-in", label: `Checked in (${count})` },
  ];

  return (
    <div className="grid max-w-4xl gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-2">
          {points.length > 1 || points[0].label !== "Arrival" ? (
            <div className="grid gap-1.5">
              <Label htmlFor="point">Check-in point</Label>
              <NativeSelect id="point" value={pointId} onChange={(e) => setPointId(e.target.value)} className="w-48">
                {points.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </NativeSelect>
            </div>
          ) : (
            <p className="text-xs"><span className="font-semibold">Check-in point:</span> Arrival</p>
          )}
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/events/${eventId}/check-in/points`} className="no-underline">Manage points</Link>
          </Button>
        </div>
        {/* TODO: route handler that streams CSV — one column per check-in point — for Salesforce. */}
        <Button variant="outline"><Download /> Export CSV</Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-5 py-4">
        <p aria-live="polite" className="text-sm">
          <span className="text-3xl font-bold tabular-nums text-foreground">{count}</span>
          <span className="ml-2 text-muted-foreground">of {total} checked in</span>
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter">
          {filters.map((f) => (
            <Button key={f.id} size="sm" variant={filter === f.id ? "default" : "outline"} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="relative">
        <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input type="search" aria-label="Search attendees" placeholder="Type a name, organization or email…" value={q} onChange={(e) => setQ(e.target.value)} className="h-12 pl-9 text-base" autoFocus />
      </div>

      <ul className="overflow-hidden rounded-lg border bg-card">
        {shown.map((r) => (
          <li key={r.id} className={cn("flex flex-wrap items-center gap-3 border-b px-4 py-3 last:border-b-0", r.checkedInAt && "bg-hers-panel/50")}>
            <div className="min-w-0 flex-1">
              <p className="font-bold">{r.displayName}</p>
              <p className="text-xs text-muted-foreground">{r.organization}</p>
            </div>
            {r.checkedInAt ? (
              <>
                <span className="flex items-center gap-1 text-xs">
                  <Check className="size-4 text-primary" aria-hidden />
                  <strong>Checked in {r.checkedInAt}</strong>
                  <span className="text-muted-foreground">· by {r.checkedInBy}</span>
                </span>
                <ConfirmButton
                  label="Undo"
                  title={`Undo check-in for ${r.displayName}?`}
                  confirmLabel="Undo check-in"
                  onConfirm={() => setRows((p) => p.map((x) => (x.id === r.id ? { ...x, checkedInAt: undefined, checkedInBy: undefined } : x)))}
                />
              </>
            ) : (
              <Button className="min-w-28" onClick={() => checkIn(r.id)}>Check in</Button>
            )}
          </li>
        ))}
        {shown.length === 0 && <li className="p-6 text-sm text-muted-foreground">No one matches. Check the spelling, or search by organization or email.</li>}
      </ul>
    </div>
  );
}
