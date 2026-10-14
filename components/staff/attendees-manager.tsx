"use client";

import * as React from "react";
import Link from "next/link";
import { Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmButton } from "@/components/confirm-button";
import type { Enrollment, Subcommittee } from "@/lib/mock-data";

const statusVariant = { active: "default", invited: "muted", revoked: "coral" } as const;

export function AttendeesManager({ eventId, initial, subcommittees, total }: { eventId: string; initial: Enrollment[]; subcommittees: Subcommittee[]; total: number }) {
  const [rows, setRows] = React.useState(initial);
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [sub, setSub] = React.useState("");
  const [editing, setEditing] = React.useState<Enrollment | null>(null);
  const [subIds, setSubIds] = React.useState<string[]>([]);

  const query = q.trim().toLowerCase();
  const shown = rows.filter(
    (r) =>
      (!query || `${r.displayName} ${r.email} ${r.organization ?? ""}`.toLowerCase().includes(query)) &&
      (!status || r.status === status) &&
      (!sub || r.subcommitteeIds.includes(sub)),
  );
  const subName = (ids: string[]) => ids.map((id) => subcommittees.find((s) => s.id === id)?.name).join(", ") || "—";

  function openEdit(r: Enrollment) {
    setEditing(r);
    setSubIds(r.subcommitteeIds);
  }

  function saveEdit(form: HTMLFormElement) {
    const d = new FormData(form);
    // TODO: server action — staff can edit any profile at any time. Removing a subcommittee should remind about GroupMe.
    setRows((p) =>
      p.map((r) =>
        r.id === editing!.id
          ? { ...r, displayName: String(d.get("displayName")), email: String(d.get("email")), title: String(d.get("title")), organization: String(d.get("organization")), linkedin: String(d.get("linkedin")), subcommitteeIds: subIds }
          : r,
      ),
    );
    setEditing(null);
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-primary">Attendees ({total})</h2>
        <Button asChild variant="outline"><Link href={`/admin/events/${eventId}/attendees/import`} className="no-underline"><Upload /> Import CSV</Link></Button>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_11rem_13rem]">
        <Input type="search" aria-label="Search attendees" placeholder="Search name, email, organization" value={q} onChange={(e) => setQ(e.target.value)} />
        <NativeSelect aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="invited">Invited</option>
          <option value="revoked">Revoked</option>
        </NativeSelect>
        <NativeSelect aria-label="Subcommittee" value={sub} onChange={(e) => setSub(e.target.value)}>
          <option value="">All subcommittees</option>
          {subcommittees.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </NativeSelect>
      </div>

      <ul className="overflow-hidden rounded-lg border bg-card">
        {shown.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-3 border-b px-4 py-3 last:border-b-0">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 font-bold">
                {r.displayName}
                <Badge variant={statusVariant[r.status]} className="capitalize">{r.status}</Badge>
              </p>
              <p className="text-xs text-muted-foreground">{[r.title, r.organization].filter(Boolean).join(" · ")}</p>
              <p className="text-xs text-muted-foreground">{r.email} · Subcommittees: {subName(r.subcommitteeIds)}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => openEdit(r)}>Edit</Button>
            {r.status !== "revoked" && (
              <ConfirmButton
                label="Revoke"
                title={`Revoke ${r.displayName}?`}
                confirmLabel="Revoke enrollment"
                destructive
                description={
                  <>
                    <p>The event disappears from their dashboard. This is logged.</p>
                    <p><strong>Reminder:</strong> also remove them from this event&rsquo;s GroupMe groups.</p>
                  </>
                }
                onConfirm={() => setRows((p) => p.map((x) => (x.id === r.id ? { ...x, status: "revoked" } : x)))}
              />
            )}
          </li>
        ))}
        {shown.length === 0 && <li className="p-6 text-sm text-muted-foreground">No attendees match these filters.</li>}
      </ul>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Edit attendee — {editing?.displayName}</DialogTitle></DialogHeader>
          {editing && (
            <form id="attendee-form" className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); saveEdit(e.currentTarget); }}>
              <div className="grid gap-1.5"><Label htmlFor="a-name">Display name *</Label><Input id="a-name" name="displayName" required defaultValue={editing.displayName} /></div>
              <div className="grid gap-1.5"><Label htmlFor="a-email">Invitation email</Label><Input id="a-email" name="email" type="email" defaultValue={editing.email} /></div>
              <div className="grid gap-1.5"><Label htmlFor="a-title">Title</Label><Input id="a-title" name="title" defaultValue={editing.title} /></div>
              <div className="grid gap-1.5"><Label htmlFor="a-org">Organization</Label><Input id="a-org" name="organization" defaultValue={editing.organization} /></div>
              <div className="grid gap-1.5"><Label htmlFor="a-li">LinkedIn</Label><Input id="a-li" name="linkedin" defaultValue={editing.linkedin} /></div>
              <div className="grid gap-1.5"><Label htmlFor="a-exp">Individual access expiry</Label><Input id="a-exp" name="individualExpiry" type="date" defaultValue={editing.individualExpiry} /></div>
              <fieldset className="grid gap-2 sm:col-span-2">
                <legend className="mb-1 text-xs font-semibold">Subcommittees</legend>
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  {subcommittees.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={subIds.includes(s.id)}
                        onCheckedChange={(c) => setSubIds((p) => (c ? [...p, s.id] : p.filter((x) => x !== s.id)))}
                      />
                      {s.name}
                    </label>
                  ))}
                </div>
                {editing.subcommitteeIds.some((id) => !subIds.includes(id)) && (
                  <p className="text-xs text-destructive"><strong>Reminder:</strong> also remove them from that subcommittee&rsquo;s GroupMe group.</p>
                )}
              </fieldset>
            </form>
          )}
          <DialogFooter>
            <Button type="submit" form="attendee-form">Save</Button>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
