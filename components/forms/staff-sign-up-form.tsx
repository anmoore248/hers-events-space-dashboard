"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/form-field";
import { staffSignUpSchema } from "@/lib/schemas";

type Values = z.infer<typeof staffSignUpSchema>;

export function StaffSignUpForm({ email }: { email: string }) {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({ resolver: zodResolver(staffSignUpSchema) });

  return (
    <Card>
      <CardContent className="pt-5">
        <form
          noValidate
          className="grid gap-4"
          onSubmit={handleSubmit(() => {
            // TODO: server action — consume the one-time invite, create a staff account.
            router.push("/admin");
          })}
        >
          <FormField label="Email" htmlFor="email" hint="Set by the invite. Another staff member can change it later.">
            <Input id="email" value={email} readOnly disabled />
          </FormField>
          <FormField label="Your name" htmlFor="name" error={errors.name?.message}>
            <Input id="name" autoComplete="name" {...register("name")} />
          </FormField>
          <FormField label="Create password" htmlFor="password" error={errors.password?.message}>
            <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
          </FormField>
          <FormField label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
            <Input id="confirmPassword" type="password" autoComplete="new-password" {...register("confirmPassword")} />
          </FormField>
          <Button type="submit" className="w-full">Create staff account</Button>
        </form>
      </CardContent>
    </Card>
  );
}
