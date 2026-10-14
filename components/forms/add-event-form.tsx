"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/form-field";
import { addEventSchema } from "@/lib/schemas";

type Values = z.infer<typeof addEventSchema>;

export function AddEventForm() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({ resolver: zodResolver(addEventSchema) });

  return (
    <Card>
      <CardContent className="pt-5">
        <form
          noValidate
          className="grid gap-4"
          onSubmit={handleSubmit(() => {
            // TODO: server action — same guest-list check as sign-up, then activate the enrollment.
            router.push("/dashboard");
          })}
        >
          <FormField label="Access key" htmlFor="accessKey" error={errors.accessKey?.message}>
            <Input id="accessKey" placeholder="e.g. WHLI-3MBP" autoComplete="off" className="uppercase" {...register("accessKey")} />
          </FormField>
          <Button type="submit" className="w-full">Add event</Button>
        </form>
      </CardContent>
    </Card>
  );
}
