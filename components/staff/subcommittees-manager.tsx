"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmButton } from "@/components/confirm-button";
import { EmptyState } from "@/components/empty-state";
import { FormError } from "@/components/form-error";
import { FormField } from "@/components/form-field";
import { useAction } from "@/hooks/use-action";
import {
  addSubcommitteeMember, deleteSubcommittee, removeSubcommitteeMember, saveSubcommittee,
} from "@/lib/actions/subcommittees";
import { plural } from "@/lib/format";
import { subcommitteeSchema, type SubcommitteeInput } from "@/lib/schemas";
import type { Enrollment, Subcommittee } from "@/lib/types";

export function SubcommitteesManager({
  eventId, eventName, subcommittees, attendees,
}: { eventId: string; eventName: string; subcommittees: Subcommittee[]; attendees: Enrollment[] }) {
  const [viewing, setViewing] = React.useState<string | null>(subcommittees[0]?.id ?? null);
  const [editing, setEditing] = React.useState<Subcommittee | "new" | null>(null);
  const [toAdd, setToAdd] = React.useState("");
  const save = useAction();
  const members = useAction();
  const form = useForm<SubcommitteeInput>({ resolver: zodResolver(subcommitteeSchema) });
  const draftName = form.watch("name");

  const current = subcommittees.find((s) => s.id === viewing);
  const currentMembers = current ? attendees.filter((a) => a.subcommitteeIds.includes(current.id)) : [];
  const nonMembers = current ? attendees.filter((a) => !a.subcommitteeIds.includes(current.id)) : [];

  function openEditor(s: Subcommittee | "new") {
    save.setError(null);
    form.reset(s === "new" ? { name: "", groupMeUrl: "" } : { name: s.name, groupMeUrl: s.groupMeUrl });
    setEditing(s);
  }

  const onSave = form.handleSubmit(async (values) => {
    const res = await save.run(() => saveSubcommittee(eventId, editing === "new" || !editing ? null : editing.id, values));
    if (res.ok) setEditing(null);
  });

  return (
    <div className="max-w-5xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-primary">Subcommittees</h2>
        <Button onClick={() => openEditor("new")}><Plus /> New subcommittee</Button>
      </div>

      {subcommittees.length === 0 ? (
        <EmptyState title="There are no subcommittees at this time.">
          Create one per private GroupMe group. Attendees only see the links for their own subcommittees.
        </EmptyState>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[3fr_2fr]">
          <ul className="overflow-hidden rounded-lg border bg-card">
            {subcommittees.map((s) => (
              <li key={s.id} className={`flex flex-wrap items-center gap-3 border-b px-4 py-3 last:border-b-0 ${s.id === viewing ? "bg-hers-panel/60" : ""}`}>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{s.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {plural(s.memberCount, "member")} · {s.groupMeUrl ? `GroupMe: ${s.groupMeUrl}` : "No GroupMe link yet"}
                  </p>
                </div>
                <Button variant="outline" size="sm" aria-pressed={s.id === viewing} onClick={() => setViewing(s.id)}>Members</Button>
                <Button variant="outline" size="sm" onClick={() => openEditor(s)}>Edit</Button>
                <ConfirmButton
                  label="Delete"
                  title={`Delete ${s.name}?`}
                  confirmLabel="Delete subcommittee"
                  destructive
                  description={<p>Members lose the link in the platform. Close the GroupMe group separately.</p>}
                  onConfirm={async () => {
                    const res = await deleteSubcommittee(eventId, s.id);
                    if (res.ok && viewing === s.id) setViewing(null);
                    return res;
                  }}
                />
              </li>
            ))}
          </ul>

          {current && (
            <Card>
              <CardHeader><CardTitle>Members — {current.name} ({currentMembers.length})</CardTitle></CardHeader>
              <CardContent className="grid gap-3">
                <div className="flex gap-2">
                  <NativeSelect aria-label="Add attendee" value={toAdd} onChange={(e) => setToAdd(e.target.value)} disabled={!nonMembers.length}>
                    <option value="">{nonMembers.length ? "Add attendee…" : "Everyone is already a member"}</option>
                    {nonMembers.map((a) => <option key={a.id} value={a.id}>{a.displayName}</option>)}
                  </NativeSelect>
                  <Button
                    disabled={!toAdd || members.pending}
                    onClick={async () => {
                      const res = await members.run(() => addSubcommitteeMember(eventId, current.id, toAdd));
                      if (res.ok) setToAdd("");
                    }}
                  >
                    Add
                  </Button>
                </div>
                <FormError message={members.error} className="text-xs font-medium text-destructive" />
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
                        onConfirm={() => removeSubcommitteeMember(eventId, current.id, a.id)}
                      />
                    </li>
                  ))}
                  {currentMembers.length === 0 && <li className="p-3 text-xs text-muted-foreground">There are no members at this time.</li>}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing === "new" ? "New subcommittee" : "Edit subcommittee"}</DialogTitle></DialogHeader>
          <form id="sc-form" noValidate className="grid gap-4" onSubmit={onSave}>
            <FormField label="Name" required htmlFor="sc-name" error={form.formState.errors.name?.message}>
              <Input id="sc-name" {...form.register("name")} />
            </FormField>
            <FormField
              label="Private GroupMe link"
              htmlFor="sc-url"
              error={form.formState.errors.groupMeUrl?.message}
              hint={`Suggested group name: “HERS · ${eventName} · ${draftName || "Name"}”`}
            >
              <Input id="sc-url" placeholder="https://groupme.com/join_group/…" {...form.register("groupMeUrl")} />
            </FormField>
            <FormError message={save.error} />
          </form>
          <DialogFooter>
            <Button type="submit" form="sc-form" disabled={save.pending}>{save.pending ? "Saving…" : "Save"}</Button>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
