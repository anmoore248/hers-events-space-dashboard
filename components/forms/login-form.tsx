"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form-field";
import { FormError } from "@/components/form-error";
import { useAction } from "@/hooks/use-action";
import { signIn } from "@/lib/actions/auth";
import { loginSchema, type LoginInput } from "@/lib/schemas";

export function LoginForm() {
  const router = useRouter();
  const { run, pending, error } = useAction();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    const res = await run(() => signIn(values));
    router.push("/dashboard")
    // if (res.ok) {
    //   router.replace(res.data.redirectTo);
    //   router.refresh();
    // }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <FormField label="Email" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
      </FormField>
      <FormField label="Password" htmlFor="password" error={errors.password?.message}>
        <Input id="password" type="password" autoComplete="current-password" aria-invalid={!!errors.password} {...register("password")} />
      </FormField>
      <FormError message={error} />
      <Button type="submit" className="mt-1 w-full" disabled={pending}>
        {pending ? "Signing in…" : "Log in"}
      </Button>
    </form>
  );
}
