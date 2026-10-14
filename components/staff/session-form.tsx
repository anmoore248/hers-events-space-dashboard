"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmButton } from "@/components/confirm-button";
import { FormField } from "@/components/form-field";
import { ReorderButtons, move } from "./reorder-buttons";
import { sessionSchema } from "@/lib/schemas";
import type { Speaker, Track } from "@/lib/mock-data";

type Values = z.infer<typeof sessionSchema>;

export function SessionForm({
  eventId, tzLabel, tracks, speakers, defaultValues, initialSpeakerIds = [], isNew,
}: {
  eventId: string; tzLabel: string; tracks: Track[]; speakers: Speaker[];
  defaultValues: Partial<Values>; initialSpeakerIds?: string[]; isNew: boolean;
}) {
  const router = useRouter();
  const back = `/admin/events/${eventId}/agenda`;
  const [speakerIds, setSpeakerIds] = React.useState(initialSpeakerIds);
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({ resolver: zodResolver(sessionSchema), defaultValues });

  const save = (andDuplicate: boolean) =>
    handleSubmit((values) => {
      // TODO: server action — save session + session_speakers (in this order). Times stored in UTC.
      console.info({ ...values, speakerIds, andDuplicate });
      router.push(back);
    });

  const available = speakers.filter((s) => !speakerIds.includes(s.id));

  return (
    <Card className="max-w-3xl">
      <CardContent className="pt-5">
        <form noValidate className="grid gap-4" onSubmit={save(false)}>
          <FormField label="Title" required htmlFor="title" error={errors.title?.message}>
            <Input id="title" {...register("title")} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Date" required htmlFor="date" error={errors.date?.message}>
              <Input id="date" type="date" {...register("date")} />
            </FormField>
            <FormField label="Track" htmlFor="trackId" hint="Leave empty for keynotes, meals and breaks.">
              <NativeSelect id="trackId" {...register("trackId")}>
                <option value="">None (everyone)</option>
                {tracks.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </NativeSelect>
            </FormField>
            <FormField label={`Start time (${tzLabel})`} required htmlFor="start" error={errors.start?.message}>
              <Input id="start" type="time" {...register("start")} />
            </FormField>
            <FormField label={`End time (${tzLabel})`} required htmlFor="end" error={errors.end?.message}>
              <Input id="end" type="time" {...register("end")} />
            </FormField>
            <FormField label="Location" htmlFor="location">
              <Input id="location" {...register("location")} />
            </FormField>
            <FormField label="Virtual link" htmlFor="virtualLink" error={errors.virtualLink?.message}>
              <Input id="virtualLink" placeholder="https://zoom.us/j/…" {...register("virtualLink")} />
            </FormField>
          </div>

          <fieldset className="grid gap-2">
            <Label asChild><legend>Speakers (in display order)</legend></Label>
            {speakerIds.length > 0 && (
              <ol className="overflow-hidden rounded-md border">
                {speakerIds.map((id, i) => {
                  const sp = speakers.find((s) => s.id === id)!;
                  return (
                    <li key={id} className="flex items-center gap-3 border-b px-3 py-2 last:border-b-0">
                      <span className="flex-1 text-sm">{i + 1}. {sp.name} · {sp.title}</span>
                      <ReorderButtons label={sp.name} index={i} count={speakerIds.length} onMove={(f, t) => setSpeakerIds((p) => move(p, f, t))} />
                      <Button type="button" variant="outline" size="sm" onClick={() => setSpeakerIds((p) => p.filter((x) => x !== id))}>Remove</Button>
                    </li>
                  );
                })}
              </ol>
            )}
            <NativeSelect aria-label="Add a speaker" value="" onChange={(e) => e.target.value && setSpeakerIds((p) => [...p, e.target.value])} disabled={!available.length}>
              <option value="">+ Add a speaker from this event…</option>
              {available.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.organization}</option>)}
            </NativeSelect>
          </fieldset>

          <FormField label="Description (plain text)" htmlFor="description">
            <Textarea id="description" rows={5} {...register("description")} />
          </FormField>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button type="submit">Save session</Button>
            <Button type="button" variant="outline" onClick={save(true)}>Save &amp; duplicate</Button>
            <Button type="button" variant="outline" onClick={() => router.push(back)}>Cancel</Button>
            {!isNew && (
              <div className="ml-auto">
                <ConfirmButton label="Delete session" size="default" variant="destructive" destructive title="Delete this session?" confirmLabel="Delete session" onConfirm={() => router.push(back)} />
              </div>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
