"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { ConfirmButton } from "@/components/confirm-button";
import { EmptyState } from "@/components/empty-state";
import { FormError } from "@/components/form-error";
import { useAction } from "@/hooks/use-action";
import { checkIn, undoCheckIn } from "@/lib/actions/check-in";
import { formatClock } from "@/lib/format";
import type { CheckIn, CheckInSheet } from "@/lib/types";
import { cn } from "@/lib/utils";

type Filter = "all" | "not-arrived" | "checked-in";
const REFRESH_MS = 5000;

/**
 * Check-in (doc §14.1). Safe for several staff at once: checking in someone
 * who is already checked in does nothing, and the table refreshes every few
 * seconds while the tab is visible.
 */
export function CheckInTable({ eventId, timeZone, sheet }: { eventId: string; timeZone: string; sheet: CheckInSheet }) {
  const router = useRouter();
  const { points, attendees, checkIns } = sheet;
  const [pointId, setPointId] = React.useState(points[0]?.id ?? "");
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState<Filter>("all");
  const [optimistic, setOptimistic] = React.useState<Record<string, CheckIn | null>>({});
  const { run, error } = useAction();

  // Server data wins once it arrives.
  React.useEffect(() => setOptimistic({}), [checkIns]);

  React.useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [router]);

  if (!points.length) {
    return <EmptyState title="There are no check-in points at this time." />;
  }

  const point = points.find((p) => p.id === pointId) ?? points[0];
  const key = (enrollmentId: string) => `${point.id}:${enrollmentId}`;
  const record = (enrollmentId: string): CheckIn | undefined => {
    const k = key(enrollmentId);
    if (k in optimistic) return optimistic[k] ?? undefined;
    return checkIns.find((c) => c.pointId === point.id && c.enrollmentId === enrollmentId);
  };

  const count = attendees.filter((a) => record(a.enrollmentId)).length;
  const total = attendees.length;
  const query = q.trim().toLowerCase();
  const shown = attendees.filter((a) => {
    const done = !!record(a.enrollmentId);
    return (
      (!query || `${a.displayName} ${a.organization ?? ""} ${a.email}`.toLowerCase().includes(query)) &&
      (filter === "all" || (filter === "checked-in" ? done : !done))
    );
  });

  async function doCheckIn(enrollmentId: string) {
    setOptimistic((o) => ({ ...o, [key(enrollmentId)]: { pointId: point.id, enrollmentId, at: new Date().toISOString() } }));
    const res = await run(() => checkIn(eventId, point.id, enrollmentId));
    if (!res.ok) setOptimistic((o) => { const n = { ...o }; delete n[key(enrollmentId)]; return n; });
  }

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "not-arrived", label: `Not yet arrived (${total - count})` },
    { id: "checked-in", label: `Checked in (${count})` },
  ];

  return (
    <div className="grid max-w-4xl gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-2">
          {points.length > 1 ? (
            <div className="grid gap-1.5">
              <Label htmlFor="point">Check-in point</Label>
              <NativeSelect id="point" value={point.id} onChange={(e) => setPointId(e.target.value)} className="w-48">
                {points.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </NativeSelect>
            </div>
          ) : (
            <p className="text-xs"><span className="font-semibold">Check-in point:</span> {point.label}</p>
          )}
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/events/${eventId}/check-in/points`} className="no-underline">Manage points</Link>
          </Button>
        </div>
        <Button asChild variant="outline">
          <a href={`/admin/events/${eventId}/check-in/export`} className="no-underline" download><Download /> Export CSV</a>
        </Button>
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

      {total === 0 ? (
        <EmptyState title="There are no attendees to check in at this time.">Add people to the guest list on the Attendees tab first.</EmptyState>
      ) : (
        <>
          <div className="relative">
            <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="search" aria-label="Search attendees" placeholder="Type a name, organization or email…" value={q} onChange={(e) => setQ(e.target.value)} className="h-12 pl-9 text-base" autoFocus />
          </div>
          <FormError message={error} />

          <ul className="overflow-hidden rounded-lg border bg-card">
            {shown.map((a) => {
              const r = record(a.enrollmentId);
              return (
                <li key={a.enrollmentId} className={cn("flex flex-wrap items-center gap-3 border-b px-4 py-3 last:border-b-0", r && "bg-hers-panel/50")}>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{a.displayName}</p>
                    <p className="text-xs text-muted-foreground">{a.organization}</p>
                  </div>
                  {r ? (
                    <>
                      <span className="flex items-center gap-1 text-xs">
                        <Check className="size-4 text-primary" aria-hidden />
                        <strong>Checked in {formatClock(r.at, timeZone)}</strong>
                        {r.byName && <span className="text-muted-foreground">· by {r.byName}</span>}
                      </span>
                      <ConfirmButton
                        label="Undo"
                        title={`Undo check-in for ${a.displayName}?`}
                        confirmLabel="Undo check-in"
                        onConfirm={async () => {
                          const res = await undoCheckIn(eventId, point.id, a.enrollmentId);
                          if (res.ok) setOptimistic((o) => ({ ...o, [key(a.enrollmentId)]: null }));
                          return res;
                        }}
                      />
                    </>
                  ) : (
                    <Button className="min-w-28" onClick={() => doCheckIn(a.enrollmentId)}>Check in</Button>
                  )}
                </li>
              );
            })}
            {shown.length === 0 && <li className="p-6 text-sm text-muted-foreground">No one matches. Check the spelling, or search by organization or email.</li>}
          </ul>
        </>
      )}
    </div>
  );
}
