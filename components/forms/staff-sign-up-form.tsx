"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/form-field";
import { FormError } from "@/components/form-error";
import { useAction } from "@/hooks/use-action";
import { staffSignUp } from "@/lib/actions/auth";
import { staffSignUpSchema, type StaffSignUpInput } from "@/lib/schemas";

export function StaffSignUpForm({
  token,
  email,
  name,
}: {
  token: string;
  email: string;
  name?: string;
}) {
  const router = useRouter();
  const { run, pending, error } = useAction();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StaffSignUpInput>({
    resolver: zodResolver(staffSignUpSchema),
    defaultValues: { name: name ?? "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    const res = await run(() => staffSignUp(token, values));
    if (res.ok) {
      router.replace(res.data.redirectTo);
      router.refresh();
    }
  });

  return (
    <Card>
      <CardContent className="pt-5">
        <form noValidate className="grid gap-4" onSubmit={onSubmit}>
          <FormField
            label="Email"
            htmlFor="email"
            hint="Set by the invite. Another staff member can change it later."
          >
            <Input id="email" value={email} readOnly disabled />
          </FormField>
          <FormField
            label="Your name"
            htmlFor="name"
            error={errors.name?.message}
          >
            <Input id="name" autoComplete="name" {...register("name")} />
          </FormField>
          <FormField
            label="Create password"
            htmlFor="password"
            hint="At least 10 characters."
            error={errors.password?.message}
          >
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register("password")}
            />
          </FormField>
          <FormField
            label="Confirm password"
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
          <FormError message={error} />
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating…" : "Create staff account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
