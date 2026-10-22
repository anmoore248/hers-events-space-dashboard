"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/form-field";
import { FormError } from "@/components/form-error";
import { useAction } from "@/hooks/use-action";
import { saveProfile } from "@/lib/actions/profile";
import { profileSchema } from "@/lib/schemas";

type Input_ = z.input<typeof profileSchema>;
type Output = z.output<typeof profileSchema>;

export function ProfileForm({
  defaultValues,
  loginEmail,
  helpEmail,
  editable = true,
}: {
  defaultValues: Input_;
  loginEmail: string;
  helpEmail: string;
  /** False when every event has ended: the profile is frozen. */
  editable?: boolean;
}) {
  const [saved, setSaved] = React.useState(false);
  const { run, pending, error } = useAction();
  const { register, handleSubmit, formState: { errors } } = useForm<Input_, unknown, Output>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  async function onSubmit(values: Output) {
    const res = await run(() => saveProfile(values));
    if (res.ok) setSaved(true);
  }

  return (
    <Card>
      <CardContent className="pt-5">
        {!editable && (
          <p className="mb-4 rounded-md bg-hers-panel px-3 py-2 text-xs text-primary">
            All your events have ended, so your profile can no longer be changed.
          </p>
        )}
        <form noValidate onChange={() => setSaved(false)} onSubmit={handleSubmit(onSubmit)}>
          <fieldset disabled={!editable || pending} className="grid gap-4">
            <FormField label="Display name" required htmlFor="displayName" error={errors.displayName?.message}>
              <Input id="displayName" autoComplete="name" {...register("displayName")} />
            </FormField>
            <FormField label="Title" htmlFor="title">
              <Input id="title" autoComplete="organization-title" {...register("title")} />
            </FormField>
            <FormField label="Organization" htmlFor="organization">
              <Input id="organization" autoComplete="organization" {...register("organization")} />
            </FormField>
            <FormField label="LinkedIn" htmlFor="linkedin" hint="Must be a linkedin.com address" error={errors.linkedin?.message}>
              <Input id="linkedin" placeholder="linkedin.com/in/yourname" {...register("linkedin")} />
            </FormField>
            {loginEmail && (
              <FormField label="Login email" htmlFor="loginEmail" hint={`To change it, email ${helpEmail}.`}>
                <Input id="loginEmail" value={loginEmail} readOnly disabled />
              </FormField>
            )}
            <FormError message={error} />
            <div className="flex items-center gap-3">
              <Button type="submit">{pending ? "Saving…" : "Save changes"}</Button>
              <span aria-live="polite" className="text-xs text-muted-foreground">{saved && "Saved to your active events."}</span>
            </div>
          </fieldset>
        </form>
      </CardContent>
    </Card>
  );
}
