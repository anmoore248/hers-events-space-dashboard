"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form-field";
import { loginSchema } from "@/lib/schemas";

import { authClient } from "@/lib/auth-client";

type Values = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const { register, handleSubmit, setError, formState } = useForm<Values>({
    resolver: zodResolver(loginSchema),
  });
  const { errors, isSubmitting } = formState;

  async function onSubmit(values: Values) {
    const { data, error } = await authClient.signIn.email(values);
    if (error) {
      // Same message whether the email or the password is wrong, so it can't be used to test emails.
      setError("root", {
        message:
          "That email and password don't match. Check both and try again.",
      });
      return;
    }
    router.push(data.user.role === "staff" ? "/admin" : "/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
      <FormField label="Email" htmlFor="email" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@university.edu"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
      </FormField>
      <FormField
        label="Password"
        htmlFor="password"
        error={errors.password?.message}
      >
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
      </FormField>
      {errors.root && (
        <p role="alert" className="text-destructive text-sm font-medium">
          {errors.root.message}
        </p>
      )}
      <Button type="submit" className="mt-1 w-full" disabled={isSubmitting}>
        Log in
      </Button>
    </form>
  );
}
