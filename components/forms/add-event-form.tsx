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
import { addEventWithKey } from "@/lib/actions/auth";
import { addEventSchema, type AddEventInput } from "@/lib/schemas";

export function AddEventForm() {
  const router = useRouter();
  const { run, pending, error } = useAction();
  const { register, handleSubmit, formState: { errors } } = useForm<AddEventInput>({ resolver: zodResolver(addEventSchema) });

  const onSubmit = handleSubmit(async (values) => {
    const res = await run(() => addEventWithKey(values));
    if (res.ok) router.push(`/events/${res.data.eventId}`);
  });

  return (
    <Card>
      <CardContent className="pt-5">
        <form noValidate className="grid gap-4" onSubmit={onSubmit}>
          <FormField label="Access key" htmlFor="accessKey" error={errors.accessKey?.message}>
            <Input id="accessKey" autoComplete="off" className="uppercase" {...register("accessKey")} />
          </FormField>
          <FormError message={error} />
          <Button type="submit" className="w-full" disabled={pending}>{pending ? "Adding…" : "Add event"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
