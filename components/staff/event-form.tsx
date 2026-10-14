"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { FormField } from "@/components/form-field";
import { eventSchema } from "@/lib/schemas";

type Values = z.infer<typeof eventSchema>;

export const timeZones = [
  { value: "America/New_York", label: "Eastern (ET)" },
  { value: "America/Chicago", label: "Central (CT)" },
  { value: "America/Denver", label: "Mountain (MT)" },
  { value: "America/Phoenix", label: "Arizona (MST)" },
  { value: "America/Los_Angeles", label: "Pacific (PT)" },
];

/** Create event (/admin/events/new) and edit event details (/admin/events/[eventId]). */
export function EventForm({ defaultValues, mode }: { defaultValues?: Partial<Values>; mode: "create" | "edit" }) {
  const router = useRouter();
  const [saved, setSaved] = React.useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(eventSchema),
    defaultValues: { timeZone: "America/New_York", ...defaultValues },
  });

  return (
    <form
      noValidate
      className="grid gap-4"
      onChange={() => setSaved(false)}
      onSubmit={handleSubmit((values) => {
        // TODO: server action — Zod again on the server, convert to UTC, write with Drizzle.
        // Access expiry defaults to the end date when left empty.
        console.info(mode, values);
        if (mode === "create") router.push("/admin/events/summer-2027");
        else setSaved(true);
      })}
    >
      <FormField label="Event name" required htmlFor="name" error={errors.name?.message}>
        <Input id="name" placeholder="2027 Summer Institute" {...register("name")} />
      </FormField>
      <FormField label="Description" htmlFor="description">
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
        <FormField label="Access expiry" htmlFor="accessExpiry" hint="Defaults to the end date.">
          <Input id="accessExpiry" type="date" {...register("accessExpiry")} />
        </FormField>
      </div>
      <FormField label="Location" htmlFor="location">
        <Input id="location" placeholder="Venue, address" {...register("location")} />
      </FormField>
      <FormField label="Virtual details" htmlFor="virtualDetails">
        <Input id="virtualDetails" placeholder="Link or instructions (optional)" {...register("virtualDetails")} />
      </FormField>
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Button type="submit">{mode === "create" ? "Create event" : "Save changes"}</Button>
        {mode === "create" ? (
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        ) : (
          <span aria-live="polite" className="text-xs text-muted-foreground">{saved && "Saved."}</span>
        )}
      </div>
    </form>
  );
}
