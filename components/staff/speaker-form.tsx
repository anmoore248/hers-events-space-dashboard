"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/form-field";
import { speakerSchema } from "@/lib/schemas";

type In = z.input<typeof speakerSchema>;
type Out = z.output<typeof speakerSchema>;

export function SpeakerForm({ eventId, defaultValues, sessionTitles }: { eventId: string; defaultValues: In; sessionTitles: string[] }) {
  const router = useRouter();
  const back = `/admin/events/${eventId}/speakers`;
  const { register, handleSubmit, formState: { errors } } = useForm<In, unknown, Out>({ resolver: zodResolver(speakerSchema), defaultValues });

  return (
    <Card className="max-w-3xl">
      <CardContent className="pt-5">
        <form
          noValidate
          className="grid gap-4"
          onSubmit={handleSubmit((v) => {
            // TODO: server action — upsert speakers.
            console.info(v);
            router.push(back);
          })}
        >
          <FormField label="Name" required htmlFor="name" error={errors.name?.message}>
            <Input id="name" {...register("name")} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Job title" htmlFor="title"><Input id="title" {...register("title")} /></FormField>
            <FormField label="Organization" htmlFor="organization"><Input id="organization" {...register("organization")} /></FormField>
          </div>
          <FormField label="Bio (plain text)" htmlFor="bio">
            <Textarea id="bio" rows={6} {...register("bio")} />
          </FormField>
          <p className="rounded-md bg-hers-panel px-3 py-2 text-xs text-primary">
            Only enter contact details the speaker agreed to share. Empty fields aren&rsquo;t shown to attendees.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Email (optional)" htmlFor="email" error={errors.email?.message}><Input id="email" type="email" {...register("email")} /></FormField>
            <FormField label="LinkedIn (optional)" htmlFor="linkedin" error={errors.linkedin?.message}><Input id="linkedin" {...register("linkedin")} /></FormField>
          </div>
          <FormField label="Website (optional)" htmlFor="website" error={errors.website?.message}>
            <Input id="website" placeholder="https://" {...register("website")} />
          </FormField>
          {sessionTitles.length > 0 && (
            <p className="text-xs">
              <strong>Sessions:</strong> {sessionTitles.join(" · ")}{" "}
              <span className="text-muted-foreground">(assign speakers from the session form)</span>
            </p>
          )}
          <div className="flex gap-3 pt-1">
            <Button type="submit">Save speaker</Button>
            <Button type="button" variant="outline" onClick={() => router.push(back)}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
