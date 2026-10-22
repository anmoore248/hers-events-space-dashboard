"use client";

import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmButton } from "@/components/confirm-button";
import { EmptyState } from "@/components/empty-state";
import { FormError } from "@/components/form-error";
import { FormField } from "@/components/form-field";
import { useAction } from "@/hooks/use-action";
import { deleteAnnouncement, saveAnnouncement, setAnnouncementPinned } from "@/lib/actions/announcements";
import { formatDateTime, tzLabel } from "@/lib/format";
import { announcementSchema, type AnnouncementInput } from "@/lib/schemas";
import type { Announcement } from "@/lib/types";

const empty: AnnouncementInput = { title: "", message: "", pinned: false };

export function StaffAnnouncements({
  eventId, timeZone, announcements, signedUp,
}: { eventId: string; timeZone: string; announcements: Announcement[]; signedUp: number }) {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const formRef = React.useRef<HTMLDivElement>(null);
  const post = useAction();
  const pin = useAction();
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<AnnouncementInput>({
    resolver: zodResolver(announcementSchema),
    defaultValues: empty,
  });

  const onSubmit = handleSubmit(async (v) => {
    const res = await post.run(() => saveAnnouncement(eventId, editingId, v));
    if (res.ok) {
      setEditingId(null);
      reset(empty);
    }
  });

  function edit(a: Announcement) {
    setEditingId(a.id);
    reset({ title: a.title, message: a.body, pinned: a.pinned });
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="grid max-w-3xl gap-5">
      <h2 className="text-base font-bold text-primary">Announcements</h2>
      <Card ref={formRef}>
        <CardHeader><CardTitle className="text-sm">{editingId ? "Edit announcement" : "Post an announcement"}</CardTitle></CardHeader>
        <CardContent>
          <form noValidate className="grid gap-4" onSubmit={onSubmit}>
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
            <FormError message={post.error} />
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={post.pending}>{post.pending ? "Saving…" : editingId ? "Save changes" : "Post"}</Button>
              {editingId && <Button type="button" variant="outline" onClick={() => { setEditingId(null); reset(empty); }}>Cancel</Button>}
              <p className="text-xs text-muted-foreground">Shows in the platform only — no email is sent. For urgent updates, also post in the event GroupMe.</p>
            </div>
          </form>
        </CardContent>
      </Card>

      <FormError message={pin.error} className="text-xs font-medium text-destructive" />
      {announcements.length === 0 ? (
        <EmptyState title="There are no announcements at this time." />
      ) : (
        <ul className="overflow-hidden rounded-lg border bg-card">
          {announcements.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-3 border-b px-4 py-3 last:border-b-0">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-bold">
                  {a.pinned && <Badge variant="coral">Pinned</Badge>}
                  {a.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {a.postedByName} · {formatDateTime(a.postedAt, timeZone)} {tzLabel(timeZone)} · read by {a.readCount} of {signedUp}
                </p>
              </div>
              <Button variant="outline" size="sm" disabled={pin.pending} onClick={() => pin.run(() => setAnnouncementPinned(eventId, a.id, !a.pinned))}>
                {a.pinned ? "Unpin" : "Pin"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => edit(a)}>Edit</Button>
              <ConfirmButton
                label="Delete"
                title={`Delete “${a.title}”?`}
                confirmLabel="Delete announcement"
                destructive
                onConfirm={async () => {
                  const res = await deleteAnnouncement(eventId, a.id);
                  if (res.ok && editingId === a.id) { setEditingId(null); reset(empty); }
                  return res;
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
