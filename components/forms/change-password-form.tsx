"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/form-field";
import { changePasswordSchema } from "@/lib/schemas";

type Values = z.infer<typeof changePasswordSchema>;

/** Used by /account (attendees) and /admin/account (staff). */
export function ChangePasswordForm() {
  const [done, setDone] = React.useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(changePasswordSchema) });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change password</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          noValidate
          className="grid gap-4"
          onSubmit={handleSubmit(() => {
            // TODO: authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true })
            reset();
            setDone(true);
          })}
        >
          <FormField
            label="Current password"
            htmlFor="currentPassword"
            error={errors.currentPassword?.message}
          >
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              {...register("currentPassword")}
            />
          </FormField>
          <FormField
            label="New password"
            htmlFor="newPassword"
            hint="At least 10 characters."
            error={errors.newPassword?.message}
          >
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              {...register("newPassword")}
            />
          </FormField>
          <FormField
            label="Confirm new password"
            htmlFor="confirmPassword"
            error={errors.confirmPassword?.message}
          >
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
          </FormField>
          <Button type="submit" className="w-full">
            Update password
          </Button>
          <p
            aria-live="polite"
            className="text-muted-foreground text-center text-xs"
          >
            {done && "Password updated."}
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
