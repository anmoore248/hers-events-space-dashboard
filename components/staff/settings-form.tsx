"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form-field";
import { settingsSchema } from "@/lib/schemas";

type In = z.input<typeof settingsSchema>;
type Out = z.output<typeof settingsSchema>;

export function SettingsForm({ defaultValues, lastChanged }: { defaultValues: In; lastChanged: string }) {
  const [saved, setSaved] = React.useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<In, unknown, Out>({ resolver: zodResolver(settingsSchema), defaultValues });

  return (
    <form noValidate className="grid gap-4" onChange={() => setSaved(false)} onSubmit={handleSubmit(() => setSaved(true))}>
      <FormField label="“Message HERS staff” GroupMe link" htmlFor="gm" hint="Shown on every event home page." error={errors.messageStaffGroupMe?.message}>
        <Input id="gm" {...register("messageStaffGroupMe")} />
      </FormField>
      <FormField label="Help email" htmlFor="help" hint="Used on the Forgot password, Profile and Account pages." error={errors.helpEmail?.message}>
        <Input id="help" type="email" {...register("helpEmail")} />
      </FormField>
      <FormField label="GroupMe cleanup reminder (days after event ends)" htmlFor="days" error={errors.groupMeCleanupDays?.message}>
        <Input id="days" type="number" min={1} className="w-28" {...register("groupMeCleanupDays")} />
      </FormField>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit">Save settings</Button>
        <span aria-live="polite" className="text-xs text-muted-foreground">{saved ? "Saved." : `Last changed by ${lastChanged}`}</span>
      </div>
    </form>
  );
}
