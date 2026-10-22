"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmButton } from "@/components/confirm-button";
import { EmptyState } from "@/components/empty-state";
import { FormError } from "@/components/form-error";
import { FormField } from "@/components/form-field";
import { useAction } from "@/hooks/use-action";
import { deleteEventLink, reorderEventLinks, saveEventLink } from "@/lib/actions/links";
import { visibilityLabel } from "@/lib/format";
import { eventLinkSchema, type EventLinkInput } from "@/lib/schemas";
import type { EventLink } from "@/lib/types";
import { ReorderButtons, move } from "./reorder-buttons";

export function EventLinksManager({ eventId, tzLabel, links }: { eventId: string; tzLabel: string; links: EventLink[] }) {
  const [order, setOrder] = React.useState(links);
  React.useEffect(() => setOrder(links), [links]);
  const [editing, setEditing] = React.useState<EventLink | "new" | null>(null);
  const form = useForm<EventLinkInput>({ resolver: zodResolver(eventLinkSchema) });
  const save = useAction();
  const reorder = useAction();

  function open(link: EventLink | "new") {
    save.setError(null);
    form.reset(
      link === "new"
        ? { label: "", url: "", visibleFrom: "", visibleUntil: "" }
        : { label: link.label, url: link.url, visibleFrom: link.visibleFrom ?? "", visibleUntil: link.visibleUntil ?? "" },
    );
    setEditing(link);
  }

  const onSave = form.handleSubmit(async (values) => {
    const res = await save.run(() => saveEventLink(eventId, editing === "new" || !editing ? null : editing.id, values));
    if (res.ok) setEditing(null);
  });

  function onMove(from: number, to: number) {
    const next = move(order, from, to);
    setOrder(next);
    reorder.run(() => reorderEventLinks(eventId, next.map((l) => l.id)));
  }

  const { errors } = form.formState;

  return (
    <div className="max-w-3xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-primary">Event links</h2>
        <Button onClick={() => open("new")}><Plus /> Add link</Button>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">Attendees see these on the event home page, in this order. Times are {tzLabel}.</p>
      <FormError message={reorder.error} className="mb-3 text-xs font-medium text-destructive" />

      {order.length === 0 ? (
        <EmptyState title="There are no links at this time.">
          Add the Dropbox photo request, the event GroupMe, the survey, and anything else attendees need.
        </EmptyState>
      ) : (
        <ul className="overflow-hidden rounded-lg border bg-card">
          {order.map((l, i) => {
            const vis = visibilityLabel(l.visibleFrom, l.visibleUntil);
            return (
              <li key={l.id} className="flex flex-wrap items-center gap-3 border-b px-4 py-3 last:border-b-0">
                <ReorderButtons label={l.label} index={i} count={order.length} onMove={onMove} disabled={reorder.pending} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{l.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{l.url}</p>
                </div>
                <Badge variant={vis === "Always" ? "muted" : "default"}>{vis}</Badge>
                <Button variant="outline" size="sm" onClick={() => open(l)}>Edit</Button>
                <ConfirmButton label="Delete" title={`Delete “${l.label}”?`} confirmLabel="Delete link" destructive onConfirm={() => deleteEventLink(eventId, l.id)} />
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing === "new" ? "Add link" : "Edit link"}</DialogTitle></DialogHeader>
          <form id="link-form" noValidate className="grid gap-4" onSubmit={onSave}>
            <FormField label="Label" required htmlFor="label" error={errors.label?.message}>
              <Input id="label" placeholder="Post-event survey" {...form.register("label")} />
            </FormField>
            <FormField label="URL" required htmlFor="url" error={errors.url?.message}>
              <Input id="url" placeholder="https://" {...form.register("url")} />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label={`Visible from (optional, ${tzLabel})`} htmlFor="from">
                <Input id="from" type="datetime-local" {...form.register("visibleFrom")} />
              </FormField>
              <FormField label={`Visible until (optional, ${tzLabel})`} htmlFor="until" error={errors.visibleUntil?.message}>
                <Input id="until" type="datetime-local" {...form.register("visibleUntil")} />
              </FormField>
            </div>
            <FormError message={save.error} />
          </form>
          <DialogFooter>
            <Button type="submit" form="link-form" disabled={save.pending}>{save.pending ? "Saving…" : "Save link"}</Button>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
