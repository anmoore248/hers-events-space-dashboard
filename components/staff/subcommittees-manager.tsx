"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmButton } from "@/components/confirm-button";
import { FormField } from "@/components/form-field";
import type { Enrollment, Subcommittee } from "@/lib/mock-data";

export function SubcommitteesManager({ eventName, initial, attendees }: { eventName: string; initial: Subcommittee[]; attendees: Enrollment[] }) {
  const [subs, setSubs] = React.useState(initial);
  const [members, setMembers] = React.useState<Record<string, string[]>>(() =>
    Object.fromEntries(initial.map((s) => [s.id, attendees.filter((a) => a.subcommitteeIds.includes(s.id)).map((a) => a.id)])),
  );
  const [viewing, setViewing] = React.useState<string | null>(initial[0]?.id ?? null);
  const [editing, setEditing] = React.useState<Subcommittee | "new" | null>(null);
  const [draft, setDraft] = React.useState({ name: "", groupMeUrl: "" });
  const [toAdd, setToAdd] = React.useState("");

  const current = subs.find((s) => s.id === viewing);
  const currentMembers = current ? (members[current.id] ?? []).map((id) => attendees.find((a) => a.id === id)!).filter(Boolean) : [];
  const nonMembers = attendees.filter((a) => current && !members[current.id]?.includes(a.id));

  function openEditor(s: Subcommittee | "new") {
    setDraft(s === "new" ? { name: "", groupMeUrl: "" } : { name: s.name, groupMeUrl: s.groupMeUrl });
    setEditing(s);
  }

  function save() {
    if (!draft.name.trim() || !draft.groupMeUrl.trim()) return;
    if (editing === "new") {
      const id = crypto.randomUUID();
      setSubs((p) => [...p, { id, eventId: p[0]?.eventId ?? "", name: draft.name.trim(), groupMeUrl: draft.groupMeUrl.trim(), memberCount: 0 }]);
      setMembers((m) => ({ ...m, [id]: [] }));
    } else if (editing) {
      setSubs((p) => p.map((s) => (s.id === editing.id ? { ...s, ...draft } : s)));
    }
    setEditing(null);
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-primary">Subcommittees</h2>
        <Button onClick={() => openEditor("new")}><Plus /> New subcommittee</Button>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[3fr_2fr]">
        <ul className="overflow-hidden rounded-lg border bg-card">
          {subs.map((s) => (
            <li key={s.id} className={`flex flex-wrap items-center gap-3 border-b px-4 py-3 last:border-b-0 ${s.id === viewing ? "bg-hers-panel/60" : ""}`}>
              <div className="min-w-0 flex-1">
                <p className="font-bold">{s.name}</p>
                <p className="truncate text-xs text-muted-foreground">{members[s.id]?.length ?? 0} members · GroupMe: {s.groupMeUrl}</p>
              </div>
              <Button variant="outline" size="sm" aria-pressed={s.id === viewing} onClick={() => setViewing(s.id)}>Members</Button>
              <Button variant="outline" size="sm" onClick={() => openEditor(s)}>Edit</Button>
              <ConfirmButton
                label="Delete"
                title={`Delete ${s.name}?`}
                confirmLabel="Delete subcommittee"
                destructive
                description={<p>Members lose the link in the platform. Close the GroupMe group separately.</p>}
                onConfirm={() => { setSubs((p) => p.filter((x) => x.id !== s.id)); if (viewing === s.id) setViewing(null); }}
              />
            </li>
          ))}
          {subs.length === 0 && <li className="p-6 text-sm text-muted-foreground">No subcommittees yet.</li>}
        </ul>

        {current && (
          <Card>
            <CardHeader><CardTitle>Members — {current.name} ({currentMembers.length})</CardTitle></CardHeader>
            <CardContent className="grid gap-3">
              <div className="flex gap-2">
                <NativeSelect aria-label="Add attendee" value={toAdd} onChange={(e) => setToAdd(e.target.value)}>
                  <option value="">Add attendee…</option>
                  {nonMembers.map((a) => <option key={a.id} value={a.id}>{a.displayName}</option>)}
                </NativeSelect>
                <Button size="default" disabled={!toAdd} onClick={() => { setMembers((m) => ({ ...m, [current.id]: [...(m[current.id] ?? []), toAdd] })); setToAdd(""); }}>Add</Button>
              </div>
              <ul className="overflow-hidden rounded-md border">
                {currentMembers.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 border-b px-3 py-2 last:border-b-0">
                    <span>
                      <span className="block text-sm font-bold">{a.displayName}</span>
                      <span className="text-xs text-muted-foreground">{a.organization}</span>
                    </span>
                    <ConfirmButton
                      label="Remove"
                      title={`Remove ${a.displayName} from ${current.name}?`}
                      confirmLabel="Remove"
                      description={<p><strong>Reminder:</strong> also remove them from the {current.name} GroupMe group.</p>}
                      onConfirm={() => setMembers((m) => ({ ...m, [current.id]: m[current.id].filter((x) => x !== a.id) }))}
                    />
                  </li>
                ))}
                {currentMembers.length === 0 && <li className="p-3 text-xs text-muted-foreground">No members yet.</li>}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing === "new" ? "New subcommittee" : "Edit subcommittee"}</DialogTitle></DialogHeader>
          <FormField label="Name" required htmlFor="sc-name">
            <Input id="sc-name" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
          </FormField>
          <FormField
            label="Private GroupMe link"
            required
            htmlFor="sc-url"
            hint={`Suggested group name: “HERS · ${eventName} · ${draft.name || "Name"}”`}
          >
            <Input id="sc-url" placeholder="https://groupme.com/join_group/…" value={draft.groupMeUrl} onChange={(e) => setDraft((d) => ({ ...d, groupMeUrl: e.target.value }))} />
          </FormField>
          <DialogFooter>
            <Button onClick={save}>Save</Button>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
