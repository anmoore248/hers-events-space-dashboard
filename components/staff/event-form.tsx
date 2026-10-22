"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { FormField } from "@/components/form-field";
import { FormError } from "@/components/form-error";
import { useAction } from "@/hooks/use-action";
import { createEvent, updateEvent } from "@/lib/actions/events";
import { timeZones } from "@/lib/format";
import { eventSchema, type EventInput } from "@/lib/schemas";

/** Create event (/admin/events/new) and edit event details (/admin/events/[eventId]). */
export function EventForm({ defaultValues, mode, eventId }: { defaultValues?: Partial<EventInput>; mode: "create" | "edit"; eventId?: string }) {
  const router = useRouter();
  const [saved, setSaved] = React.useState(false);
  const { run, pending, error } = useAction();
  const { register, handleSubmit, formState: { errors } } = useForm<EventInput>({
    resolver: zodResolver(eventSchema),
    defaultValues: { timeZone: "America/New_York", ...defaultValues },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (mode === "create") {
      const res = await run(() => createEvent(values));
      if (res.ok) router.push(`/admin/events/${res.data.id}`);
    } else if (eventId) {
      const res = await run(() => updateEvent(eventId, values));
      if (res.ok) setSaved(true);
    }
  });

  return (
    <form noValidate className="grid gap-4" onChange={() => setSaved(false)} onSubmit={onSubmit}>
      <FormField label="Event name" required htmlFor="name" error={errors.name?.message}>
        <Input id="name" {...register("name")} />
      </FormField>
      <FormField label="Description" htmlFor="description" hint="Plain text. Leave a blank line between paragraphs.">
        <Textarea id="description" rows={4} {...register("description")} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Start date" required htmlFor="startDate" error={errors.startDate?.message}>
          <Input id="startDate" type="date" {...register("startDate")} />
        </FormField>
        <FormField label="End date" required htmlFor="endDate" error={errors.endDate?.message}>
          <Input id="endDate" type="date" {...register("endDate")} />
        </FormField>
        <FormField label="Time zone" required htmlFor="timeZone">
          <NativeSelect id="timeZone" {...register("timeZone")}>
            {timeZones.map((tz) => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
          </NativeSelect>
        </FormField>
        <FormField label="Access expiry" htmlFor="accessExpiry" hint="Defaults to the end date. After it, attendees can view but not change anything.">
          <Input id="accessExpiry" type="date" {...register("accessExpiry")} />
        </FormField>
      </div>
      <FormField label="Location" htmlFor="location">
        <Input id="location" placeholder="Venue, address" {...register("location")} />
      </FormField>
      <FormField label="Virtual details" htmlFor="virtualDetails">
        <Input id="virtualDetails" placeholder="Link or instructions (optional)" {...register("virtualDetails")} />
      </FormField>
      <FormError message={error} />
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : mode === "create" ? "Create event" : "Save changes"}
        </Button>
        {mode === "create" ? (
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        ) : (
          <span aria-live="polite" className="text-xs text-muted-foreground">{saved && "Saved."}</span>
        )}
      </div>
    </form>
  );
}
