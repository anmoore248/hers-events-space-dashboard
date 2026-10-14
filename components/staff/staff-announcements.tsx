"use client";

import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmButton } from "@/components/confirm-button";
import { FormField } from "@/components/form-field";
import { announcementSchema } from "@/lib/schemas";
import type { Announcement } from "@/lib/mock-data";

type Values = z.infer<typeof announcementSchema>;

export function StaffAnnouncements({ initial, signedUp }: { initial: Announcement[]; signedUp: number }) {
  const [list, setList] = React.useState(initial);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const formRef = React.useRef<HTMLDivElement>(null);
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { title: "", message: "", pinned: false },
  });

  function onSubmit(v: Values) {
    // TODO: server action — insert/update announcements (sent_by = current staff).
    if (editingId) {
      setList((p) => p.map((a) => (a.id === editingId ? { ...a, title: v.title, body: v.message, pinned: v.pinned } : a)));
    } else {
      setList((p) => [
        { id: crypto.randomUUID(), eventId: p[0]?.eventId ?? "", title: v.title, body: v.message, pinned: v.pinned, postedBy: "Maria Lopez", postedAt: "Just now", unread: true, readCount: 0 },
        ...p,
      ]);
    }
    setEditingId(null);
    reset({ title: "", message: "", pinned: false });
  }

  function edit(a: Announcement) {
    setEditingId(a.id);
    reset({ title: a.title, message: a.body, pinned: a.pinned });
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  const sorted = [...list].sort((a, b) => Number(b.pinned) - Number(a.pinned));

  return (
    <div className="grid max-w-3xl gap-5">
      <h2 className="text-base font-bold text-primary">Announcements</h2>
      <Card ref={formRef}>
        <CardHeader><CardTitle className="text-sm">{editingId ? "Edit announcement" : "Post an announcement"}</CardTitle></CardHeader>
        <CardContent>
          <form noValidate className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
            <FormField label="Title" required htmlFor="an-title" error={errors.title?.message}>
              <Input id="an-title" {...register("title")} />
            </FormField>
            <FormField label="Message" required htmlFor="an-message" error={errors.message?.message}>
              <Textarea id="an-message" rows={4} {...register("message")} />
            </FormField>
            <label className="flex items-center gap-2 text-sm">
              <Controller control={control} name="pinned" render={({ field }) => <Checkbox checked={field.value} onCheckedChange={(c) => field.onChange(c === true)} />} />
              Pin to top of event page
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit">{editingId ? "Save changes" : "Post"}</Button>
              {editingId && <Button type="button" variant="outline" onClick={() => { setEditingId(null); reset({ title: "", message: "", pinned: false }); }}>Cancel</Button>}
              <p className="text-xs text-muted-foreground">Shows in the platform only — no email is sent. For urgent updates, also post in the event GroupMe.</p>
            </div>
          </form>
        </CardContent>
      </Card>

      <ul className="overflow-hidden rounded-lg border bg-card">
        {sorted.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center gap-3 border-b px-4 py-3 last:border-b-0">
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 font-bold">
                {a.pinned && <Badge variant="coral">Pinned</Badge>}
                {a.title}
              </p>
              <p className="text-xs text-muted-foreground">{a.postedBy} · {a.postedAt} · read by {a.readCount} of {signedUp}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setList((p) => p.map((x) => (x.id === a.id ? { ...x, pinned: !x.pinned } : x)))}>
              {a.pinned ? "Unpin" : "Pin"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => edit(a)}>Edit</Button>
            <ConfirmButton label="Delete" title={`Delete “${a.title}”?`} confirmLabel="Delete announcement" destructive onConfirm={() => setList((p) => p.filter((x) => x.id !== a.id))} />
          </li>
        ))}
      </ul>
    </div>
  );
}
