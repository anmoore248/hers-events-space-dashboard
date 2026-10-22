import type { Metadata } from "next";
import { Breadcrumb } from "@/components/breadcrumb";
import { AddEventForm } from "@/components/forms/add-event-form";
import { getCurrentUser } from "@/lib/data";

export const metadata: Metadata = { title: "Add an event" };

export default async function AddEventPage() {
  const user = await getCurrentUser();
  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      <Breadcrumb items={[{ label: "My events", href: "/dashboard" }, { label: "Add an event" }]} />
      <h1 className="mb-2 text-2xl font-bold text-primary">Add an event</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Enter the access key from your HERS invitation email.
        {user && <> It must have been sent to <strong className="text-foreground">{user.email}</strong>.</>}
      </p>
      <AddEventForm />
    </div>
  );
}
