"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/form-field";
import { FormError } from "@/components/form-error";
import { useAction } from "@/hooks/use-action";
import { changePassword } from "@/lib/actions/auth";
import { changePasswordSchema, type ChangePasswordInput } from "@/lib/schemas";

/** Used by /account (attendees) and /admin/account (staff). Signs out every other device. */
export function ChangePasswordForm() {
  const [done, setDone] = React.useState(false);
  const { run, pending, error } = useAction();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setDone(false);
    const res = await run(() => changePassword(values));
    if (res.ok) {
      reset();
      setDone(true);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change password</CardTitle>
      </CardHeader>
      <CardContent>
        <form noValidate className="grid gap-4" onSubmit={onSubmit}>
          <FormField label="Current password" htmlFor="currentPassword" error={errors.currentPassword?.message}>
            <Input id="currentPassword" type="password" autoComplete="current-password" {...register("currentPassword")} />
          </FormField>
          <FormField label="New password" htmlFor="newPassword" hint="At least 10 characters." error={errors.newPassword?.message}>
            <Input id="newPassword" type="password" autoComplete="new-password" {...register("newPassword")} />
          </FormField>
          <FormField label="Confirm new password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
            <Input id="confirmPassword" type="password" autoComplete="new-password" {...register("confirmPassword")} />
          </FormField>
          <FormError message={error} />
          <Button type="submit" className="w-full" disabled={pending}>{pending ? "Updating…" : "Update password"}</Button>
          <p aria-live="polite" className="text-center text-xs text-muted-foreground">
            {done && "Password updated. Other devices have been signed out."}
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
