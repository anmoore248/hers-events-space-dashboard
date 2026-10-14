import type { Metadata } from "next";
import { Breadcrumb } from "@/components/breadcrumb";
import { AddEventForm } from "@/components/forms/add-event-form";
import { currentAttendee } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Add an event" };

export default function AddEventPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      <Breadcrumb items={[{ label: "My events", href: "/dashboard" }, { label: "Add an event" }]} />
      <h1 className="mb-2 text-2xl font-bold text-primary">Add an event</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Enter the access key from your HERS invitation email. It must have been sent to{" "}
        <strong className="text-foreground">{currentAttendee.email}</strong>.
      </p>
      <AddEventForm />
    </div>
  );
}
