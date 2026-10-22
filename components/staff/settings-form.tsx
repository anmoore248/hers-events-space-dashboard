"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/form-error";
import { FormField } from "@/components/form-field";
import { useAction } from "@/hooks/use-action";
import { saveSettings } from "@/lib/actions/settings";
import { settingsSchema } from "@/lib/schemas";

type In = z.input<typeof settingsSchema>;
type Out = z.output<typeof settingsSchema>;

export function SettingsForm({ defaultValues, lastChanged }: { defaultValues: In; lastChanged?: string }) {
  const [saved, setSaved] = React.useState(false);
  const { run, pending, error } = useAction();
  const { register, handleSubmit, formState: { errors } } = useForm<In, unknown, Out>({ resolver: zodResolver(settingsSchema), defaultValues });

  const onSubmit = handleSubmit(async (values) => {
    const res = await run(() => saveSettings(values));
    if (res.ok) setSaved(true);
  });

  return (
    <form noValidate className="grid gap-4" onChange={() => setSaved(false)} onSubmit={onSubmit}>
      <FormField label="“Message HERS staff” GroupMe link" htmlFor="gm" hint="Shown on every event home page. Use the shared HERS GroupMe account." error={errors.messageStaffGroupMe?.message}>
        <Input id="gm" placeholder="https://groupme.com/…" {...register("messageStaffGroupMe")} />
      </FormField>
      <FormField label="Help email" htmlFor="help" hint="Used on the Forgot password, Profile and Account pages." error={errors.helpEmail?.message}>
        <Input id="help" type="email" {...register("helpEmail")} />
      </FormField>
      <FormField label="GroupMe cleanup reminder (days after event ends)" htmlFor="days" error={errors.groupMeCleanupDays?.message}>
        <Input id="days" type="number" min={1} className="w-28" {...register("groupMeCleanupDays")} />
      </FormField>
      <FormError message={error} />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save settings"}</Button>
        <span aria-live="polite" className="text-xs text-muted-foreground">
          {saved ? "Saved." : lastChanged ? `Last changed by ${lastChanged}` : ""}
        </span>
      </div>
    </form>
  );
}
