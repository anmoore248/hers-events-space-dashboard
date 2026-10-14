"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form-field";
import { loginSchema } from "@/lib/schemas";

type Values = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const { register, handleSubmit, formState } = useForm<Values>({ resolver: zodResolver(loginSchema) });
  const { errors, isSubmitting } = formState;

  async function onSubmit(values: Values) {
    // TODO: await authClient.signIn.email(values) (Better Auth), then route by role.
    console.info("sign in", values.email);
    router.push("/dashboard");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
      <FormField label="Email" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" placeholder="you@university.edu" aria-invalid={!!errors.email} {...register("email")} />
      </FormField>
      <FormField label="Password" htmlFor="password" error={errors.password?.message}>
        <Input id="password" type="password" autoComplete="current-password" aria-invalid={!!errors.password} {...register("password")} />
      </FormField>
      <Button type="submit" className="mt-1 w-full" disabled={isSubmitting}>
        Log in
      </Button>
    </form>
  );
}
