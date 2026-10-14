"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmButton } from "@/components/confirm-button";
import { FormField } from "@/components/form-field";
import { ReorderButtons, move } from "./reorder-buttons";
import { eventLinkSchema } from "@/lib/schemas";
import type { EventLink } from "@/lib/mock-data";

type Values = z.infer<typeof eventLinkSchema>;

function visibility(v: Values) {
  if (v.visibleFrom && v.visibleUntil) return "Scheduled";
  if (v.visibleFrom) return `From ${v.visibleFrom.replace("T", " ")}`;
  if (v.visibleUntil) return `Until ${v.visibleUntil.replace("T", " ")}`;
  return "Always";
}

export function EventLinksManager({ initial }: { initial: EventLink[] }) {
  const [links, setLinks] = React.useState(initial);
  const [editing, setEditing] = React.useState<EventLink | "new" | null>(null);
  const form = useForm<Values>({ resolver: zodResolver(eventLinkSchema) });

  function open(link: EventLink | "new") {
    form.reset(link === "new" ? { label: "", url: "", visibleFrom: "", visibleUntil: "" } : link);
    setEditing(link);
  }

  function save(values: Values) {
    // TODO: server action — upsert event_links.
    setLinks((prev) =>
      editing === "new"
        ? [...prev, { ...values, id: crypto.randomUUID(), eventId: prev[0]?.eventId ?? "", order: prev.length + 1, visibilityLabel: visibility(values) }]
        : prev.map((l) => (l.id === (editing as EventLink).id ? { ...l, ...values, visibilityLabel: visibility(values) } : l)),
    );
    setEditing(null);
  }

  const { errors } = form.formState;

  return (
    <div className="max-w-3xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-primary">Event links</h2>
        <Button onClick={() => open("new")}><Plus /> Add link</Button>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">Attendees see these on the event home page, in this order.</p>

      <ul className="overflow-hidden rounded-lg border bg-card">
        {links.map((l, i) => (
          <li key={l.id} className="flex flex-wrap items-center gap-3 border-b px-4 py-3 last:border-b-0">
            <ReorderButtons label={l.label} index={i} count={links.length} onMove={(f, t) => setLinks((p) => move(p, f, t))} />
            <div className="min-w-0 flex-1">
              <p className="font-bold">{l.label}</p>
              <p className="truncate text-xs text-muted-foreground">{l.url}</p>
            </div>
            <Badge variant={l.visibilityLabel === "Always" ? "muted" : "default"}>{l.visibilityLabel}</Badge>
            <Button variant="outline" size="sm" onClick={() => open(l)}>Edit</Button>
            <ConfirmButton label="Delete" title={`Delete “${l.label}”?`} confirmLabel="Delete link" destructive onConfirm={() => setLinks((p) => p.filter((x) => x.id !== l.id))} />
          </li>
        ))}
        {links.length === 0 && <li className="p-6 text-sm text-muted-foreground">No links yet. Add the Dropbox photo request, the event GroupMe, and anything else attendees need.</li>}
      </ul>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing === "new" ? "Add link" : "Edit link"}</DialogTitle></DialogHeader>
          <form id="link-form" noValidate className="grid gap-4" onSubmit={form.handleSubmit(save)}>
            <FormField label="Label" required htmlFor="label" error={errors.label?.message}>
              <Input id="label" placeholder="Post-event survey" {...form.register("label")} />
            </FormField>
            <FormField label="URL" required htmlFor="url" error={errors.url?.message}>
              <Input id="url" placeholder="https://" {...form.register("url")} />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Visible from (optional)" htmlFor="from">
                <Input id="from" type="datetime-local" {...form.register("visibleFrom")} />
              </FormField>
              <FormField label="Visible until (optional)" htmlFor="until">
                <Input id="until" type="datetime-local" {...form.register("visibleUntil")} />
              </FormField>
            </div>
          </form>
          <DialogFooter>
            <Button type="submit" form="link-form">Save link</Button>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
