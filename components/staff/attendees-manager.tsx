"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmButton } from "@/components/confirm-button";
import { EmptyState } from "@/components/empty-state";
import { FormError } from "@/components/form-error";
import { FormField } from "@/components/form-field";
import { useAction } from "@/hooks/use-action";
import { addAttendee, restoreEnrollment, revokeEnrollment, updateAttendee } from "@/lib/actions/attendees";
import { addAttendeeSchema, attendeeSchema, type AddAttendeeInput, type AttendeeInput } from "@/lib/schemas";
import type { Enrollment, Subcommittee } from "@/lib/types";

const statusVariant = { active: "default", invited: "muted", revoked: "coral" } as const;

function EditAttendeeDialog({
  eventId, enrollment, subcommittees, onClose,
}: { eventId: string; enrollment: Enrollment; subcommittees: Subcommittee[]; onClose: () => void }) {
  const { run, pending, error } = useAction();
  const form = useForm<AttendeeInput>({
    resolver: zodResolver(attendeeSchema),
    defaultValues: {
      displayName: enrollment.displayName,
      email: enrollment.email,
      title: enrollment.title ?? "",
      organization: enrollment.organization ?? "",
      linkedin: enrollment.linkedin ?? "",
      individualExpiry: enrollment.individualExpiry ?? "",
      subcommitteeIds: enrollment.subcommitteeIds,
    },
  });
  const subIds = form.watch("subcommitteeIds");
  const removed = enrollment.subcommitteeIds.filter((id) => !subIds.includes(id));
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    const res = await run(() => updateAttendee(eventId, enrollment.id, values));
    if (res.ok) onClose();
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Edit attendee — {enrollment.displayName}</DialogTitle></DialogHeader>
        <form id="attendee-form" noValidate className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
          <FormField label="Display name" required htmlFor="a-name" error={errors.displayName?.message}>
            <Input id="a-name" {...form.register("displayName")} />
          </FormField>
          <FormField
            label="Invitation email"
            htmlFor="a-email"
            error={errors.email?.message}
            hint={enrollment.userId ? "Signed up: change the login email from People." : "Must match the address the attendee signs up with."}
          >
            <Input id="a-email" type="email" disabled={!!enrollment.userId} {...form.register("email")} />
          </FormField>
          <FormField label="Title" htmlFor="a-title"><Input id="a-title" {...form.register("title")} /></FormField>
          <FormField label="Organization" htmlFor="a-org"><Input id="a-org" {...form.register("organization")} /></FormField>
          <FormField label="LinkedIn" htmlFor="a-li" error={errors.linkedin?.message}><Input id="a-li" {...form.register("linkedin")} /></FormField>
          <FormField label="Individual access expiry" htmlFor="a-exp" hint="Leave empty to use the event's expiry.">
            <Input id="a-exp" type="date" {...form.register("individualExpiry")} />
          </FormField>
          {subcommittees.length > 0 && (
            <fieldset className="grid gap-2 sm:col-span-2">
              <legend className="mb-1 text-xs font-semibold">Subcommittees</legend>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {subcommittees.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={subIds.includes(s.id)}
                      onCheckedChange={(c) =>
                        form.setValue("subcommitteeIds", c ? [...subIds, s.id] : subIds.filter((x) => x !== s.id), { shouldDirty: true })
                      }
                    />
                    {s.name}
                  </label>
                ))}
              </div>
              {removed.length > 0 && (
                <p className="text-xs text-destructive">
                  <strong>Reminder:</strong> also remove them from the {removed.map((id) => subcommittees.find((s) => s.id === id)?.name).join(", ")} GroupMe group.
                </p>
              )}
            </fieldset>
          )}
          <div className="sm:col-span-2"><FormError message={error} /></div>
        </form>
        <DialogFooter>
          <Button type="submit" form="attendee-form" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddAttendeeDialog({ eventId }: { eventId: string }) {
  const [open, setOpen] = React.useState(false);
  const { run, pending, error, setError } = useAction();
  const form = useForm<AddAttendeeInput>({ resolver: zodResolver(addAttendeeSchema), defaultValues: { email: "", displayName: "", title: "", organization: "" } });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    const res = await run(() => addAttendee(eventId, values));
    if (res.ok) { form.reset(); setOpen(false); }
  });

  return (
    <>
      <Button variant="outline" onClick={() => { setError(null); setOpen(true); }}><Plus /> Add one</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add an attendee</DialogTitle></DialogHeader>
          <form id="add-attendee-form" noValidate className="grid gap-4" onSubmit={onSubmit}>
            <FormField label="Email" required htmlFor="n-email" error={errors.email?.message} hint="The same address used in Salesforce.">
              <Input id="n-email" type="email" {...form.register("email")} />
            </FormField>
            <FormField label="Display name" required htmlFor="n-name" error={errors.displayName?.message}>
              <Input id="n-name" {...form.register("displayName")} />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Title" htmlFor="n-title"><Input id="n-title" {...form.register("title")} /></FormField>
              <FormField label="Organization" htmlFor="n-org"><Input id="n-org" {...form.register("organization")} /></FormField>
            </div>
            <p className="text-xs text-muted-foreground">If they already have an account, they join by entering this event&rsquo;s access key under &ldquo;Add an event.&rdquo;</p>
            <FormError message={error} />
          </form>
          <DialogFooter>
            <Button type="submit" form="add-attendee-form" disabled={pending}>{pending ? "Adding…" : "Add to guest list"}</Button>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function AttendeesManager({ eventId, enrollments, subcommittees }: { eventId: string; enrollments: Enrollment[]; subcommittees: Subcommittee[] }) {
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [sub, setSub] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const editing = enrollments.find((e) => e.id === editingId);

  const query = q.trim().toLowerCase();
  const shown = enrollments.filter(
    (r) =>
      (!query || `${r.displayName} ${r.email} ${r.organization ?? ""}`.toLowerCase().includes(query)) &&
      (!status || r.status === status) &&
      (!sub || r.subcommitteeIds.includes(sub)),
  );
  const subNames = (ids: string[]) => ids.map((id) => subcommittees.find((s) => s.id === id)?.name).filter(Boolean).join(", ") || "—";
  const listed = enrollments.filter((e) => e.status !== "revoked").length;

  return (
    <div className="max-w-5xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold text-primary">Attendees ({listed})</h2>
        <div className="flex flex-wrap gap-2">
          <AddAttendeeDialog eventId={eventId} />
          <Button asChild><Link href={`/admin/events/${eventId}/attendees/import`} className="no-underline"><Upload /> Import CSV</Link></Button>
        </div>
      </div>

      {enrollments.length === 0 ? (
        <EmptyState title="There are no attendees at this time.">
          Import the guest list exported from Salesforce, or add people one at a time.
        </EmptyState>
      ) : (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_11rem_13rem]">
            <Input type="search" aria-label="Search attendees" placeholder="Search name, email, organization" value={q} onChange={(e) => setQ(e.target.value)} />
            <NativeSelect aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="invited">Invited</option>
              <option value="revoked">Revoked</option>
            </NativeSelect>
            <NativeSelect aria-label="Subcommittee" value={sub} onChange={(e) => setSub(e.target.value)} disabled={!subcommittees.length}>
              <option value="">All subcommittees</option>
              {subcommittees.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </NativeSelect>
          </div>

          <ul className="overflow-hidden rounded-lg border bg-card">
            {shown.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 border-b px-4 py-3 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-bold">
                    {r.displayName}
                    <Badge variant={statusVariant[r.status]} className="capitalize">{r.status}</Badge>
                    {r.individualExpiry && <Badge variant="muted">Access until {r.individualExpiry}</Badge>}
                  </p>
                  <p className="text-xs text-muted-foreground">{[r.title, r.organization].filter(Boolean).join(" · ")}</p>
                  <p className="text-xs text-muted-foreground">{r.email}{subcommittees.length > 0 && ` · Subcommittees: ${subNames(r.subcommitteeIds)}`}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditingId(r.id)}>Edit</Button>
                {r.status !== "revoked" ? (
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
                    onConfirm={() => revokeEnrollment(eventId, r.id)}
                  />
                ) : (
                  <ConfirmButton
                    label="Restore"
                    title={`Restore ${r.displayName}?`}
                    confirmLabel="Restore enrollment"
                    description={<p>The event reappears on their dashboard. Add them back to any GroupMe groups by hand.</p>}
                    onConfirm={() => restoreEnrollment(eventId, r.id)}
                  />
                )}
              </li>
            ))}
            {shown.length === 0 && <li className="p-6 text-sm text-muted-foreground">No attendees match these filters.</li>}
          </ul>
        </>
      )}

      {editing && <EditAttendeeDialog key={editing.id} eventId={eventId} enrollment={editing} subcommittees={subcommittees} onClose={() => setEditingId(null)} />}
    </div>
  );
}
