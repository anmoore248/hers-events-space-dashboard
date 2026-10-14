"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/form-field";
import { setPasswordSchema, signUpVerifySchema } from "@/lib/schemas";
import { cn } from "@/lib/utils";

type Verify = z.infer<typeof signUpVerifySchema>;
type SetPassword = z.infer<typeof setPasswordSchema>;

function Steps({ step }: { step: 1 | 2 }) {
  return (
    <ol className="mb-5 flex gap-4 text-xs font-semibold" aria-label="Sign-up steps">
      {["Verify", "Create password"].map((label, i) => {
        const n = (i + 1) as 1 | 2;
        const current = n === step;
        return (
          <li key={label} aria-current={current ? "step" : undefined} className={cn("flex items-center gap-2", current ? "text-primary" : "text-muted-foreground")}>
            <span className={cn("grid size-5 place-items-center rounded-full text-[11px]", current ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
              {n}
            </span>
            {label}
          </li>
        );
      })}
    </ol>
  );
}

export function SignUpFlow() {
  const router = useRouter();
  const [verified, setVerified] = React.useState<{ email: string; eventName: string } | null>(null);

  const verify = useForm<Verify>({ resolver: zodResolver(signUpVerifySchema) });
  const create = useForm<SetPassword>({ resolver: zodResolver(setPasswordSchema) });

  async function onVerify(values: Verify) {
    // TODO: server action — key matches an event? email on that guest list?
    // Existing account with a password → tell them to log in instead.
    // Existing account with a cleared password → continue to step 2 (staff-run reset).
    setVerified({ email: values.email, eventName: "2027 Summer Institute" });
  }

  async function onCreate(values: SetPassword) {
    // TODO: server action — create account (or set password), invitation → active enrollment.
    void values;
    router.push("/dashboard");
  }

  return (
    <Card>
      <CardContent className="pt-5">
        <Steps step={verified ? 2 : 1} />
        {!verified ? (
          <form onSubmit={verify.handleSubmit(onVerify)} noValidate className="grid gap-4">
            <FormField label="Email" htmlFor="email" error={verify.formState.errors.email?.message}>
              <Input id="email" type="email" autoComplete="email" {...verify.register("email")} />
            </FormField>
            <FormField label="Access key" htmlFor="accessKey" error={verify.formState.errors.accessKey?.message}>
              <Input id="accessKey" autoComplete="off" placeholder="e.g. SUMMER-7K4Q" className="uppercase" {...verify.register("accessKey")} />
            </FormField>
            <Button type="submit" className="w-full">Continue</Button>
          </form>
        ) : (
          <form onSubmit={create.handleSubmit(onCreate)} noValidate className="grid gap-4">
            <p className="text-sm">
              Joining <strong>{verified.eventName}</strong> as <strong>{verified.email}</strong>
            </p>
            <FormField label="Create password" htmlFor="password" hint="At least 10 characters." error={create.formState.errors.password?.message}>
              <Input id="password" type="password" autoComplete="new-password" {...create.register("password")} />
            </FormField>
            <FormField label="Confirm password" htmlFor="confirmPassword" error={create.formState.errors.confirmPassword?.message}>
              <Input id="confirmPassword" type="password" autoComplete="new-password" {...create.register("confirmPassword")} />
            </FormField>
            <Button type="submit" className="w-full">Create account</Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
