"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/form-field";
import { FormError } from "@/components/form-error";
import { useAction } from "@/hooks/use-action";
import { completeSignUp, verifySignUp } from "@/lib/actions/auth";
import { setPasswordSchema, signUpVerifySchema, type SignUpVerifyInput } from "@/lib/schemas";
import type { z } from "zod";
import { cn } from "@/lib/utils";

type SetPassword = z.input<typeof setPasswordSchema>;

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

/**
 * Sign-up with an access key (doc §5.2). Also used after a staff-run password
 * reset: the platform recognises the existing account and lets them set a new
 * password, keeping their events and profile (doc §5.4).
 */
export function SignUpFlow() {
  const router = useRouter();
  const [verified, setVerified] = React.useState<(SignUpVerifyInput & { eventName: string; returning: boolean }) | null>(null);
  const step1 = useAction();
  const step2 = useAction();

  const verify = useForm<SignUpVerifyInput>({ resolver: zodResolver(signUpVerifySchema) });
  const create = useForm<SetPassword>({ resolver: zodResolver(setPasswordSchema) });

  const onVerify = verify.handleSubmit(async (values) => {
    const res = await step1.run(() => verifySignUp(values));
    if (res.ok) setVerified({ ...values, ...res.data });
  });

  const onCreate = create.handleSubmit(async (values) => {
    if (!verified) return;
    const res = await step2.run(() => completeSignUp({ email: verified.email, accessKey: verified.accessKey, ...values }));
    if (res.ok) {
      router.replace(res.data.redirectTo);
      router.refresh();
    }
  });

  return (
    <Card>
      <CardContent className="pt-5">
        <Steps step={verified ? 2 : 1} />
        {!verified ? (
          <form onSubmit={onVerify} noValidate className="grid gap-4">
            <FormField label="Email" htmlFor="email" error={verify.formState.errors.email?.message}>
              <Input id="email" type="email" autoComplete="email" {...verify.register("email")} />
            </FormField>
            <FormField label="Access key" htmlFor="accessKey" error={verify.formState.errors.accessKey?.message}>
              <Input id="accessKey" autoComplete="off" className="uppercase" {...verify.register("accessKey")} />
            </FormField>
            <FormError message={step1.error} />
            {step1.error?.includes("log in") && (
              <Link href="/login" className="text-xs text-primary underline">Go to login</Link>
            )}
            <Button type="submit" className="w-full" disabled={step1.pending}>
              {step1.pending ? "Checking…" : "Continue"}
            </Button>
          </form>
        ) : (
          <form onSubmit={onCreate} noValidate className="grid gap-4">
            <p className="text-sm">
              {verified.returning ? "Setting a new password for " : <>Joining <strong>{verified.eventName}</strong> as </>}
              <strong>{verified.email}</strong>
            </p>
            {verified.returning && (
              <p className="rounded-md bg-hers-panel px-3 py-2 text-xs text-primary">
                Your account already exists. Your events and profile are kept; you&rsquo;re just choosing a new password.
              </p>
            )}
            <FormField label={verified.returning ? "New password" : "Create password"} htmlFor="password" hint="At least 10 characters." error={create.formState.errors.password?.message}>
              <Input id="password" type="password" autoComplete="new-password" {...create.register("password")} />
            </FormField>
            <FormField label="Confirm password" htmlFor="confirmPassword" error={create.formState.errors.confirmPassword?.message}>
              <Input id="confirmPassword" type="password" autoComplete="new-password" {...create.register("confirmPassword")} />
            </FormField>
            <FormError message={step2.error} />
            <Button type="submit" className="w-full" disabled={step2.pending}>
              {step2.pending ? "Saving…" : verified.returning ? "Set password" : "Create account"}
            </Button>
            <button type="button" className="text-xs text-primary underline" onClick={() => { setVerified(null); step2.setError(null); }}>
              Use a different email or key
            </button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
