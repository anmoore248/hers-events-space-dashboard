"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/form-field";
import { profileSchema } from "@/lib/schemas";

type Input_ = z.input<typeof profileSchema>;
type Output = z.output<typeof profileSchema>;

export function ProfileForm({
  defaultValues,
  loginEmail,
  helpEmail,
}: {
  defaultValues: Input_;
  loginEmail: string;
  helpEmail: string;
}) {
  const [saved, setSaved] = React.useState(false);
  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<Input_, unknown, Output>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  return (
    <Card>
      <CardContent className="pt-5">
        <form
          noValidate
          className="grid gap-4"
          onChange={() => setSaved(false)}
          onSubmit={handleSubmit((values) => {
            // TODO: server action — update every ACTIVE enrollment for this user.
            console.info("save profile", values);
            setSaved(true);
          })}
        >
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
          <FormField label="Login email" htmlFor="loginEmail" hint={`To change it, email ${helpEmail}.`}>
            <Input id="loginEmail" value={loginEmail} readOnly disabled />
          </FormField>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={!isDirty && saved}>Save changes</Button>
            <span aria-live="polite" className="text-xs text-muted-foreground">{saved && "Saved to your active events."}</span>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
