import type { Metadata } from "next";
import { Breadcrumb } from "@/components/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { EventForm } from "@/components/staff/event-form";

export const metadata: Metadata = { title: "Create event" };

export default function NewEventPage() {
  return (
    <div className="max-w-2xl">
      <Breadcrumb
        items={[{ label: "Events", href: "/admin" }, { label: "New event" }]}
      />
      <h1 className="text-primary mb-5 text-2xl font-bold">Create event</h1>
      <Card>
        <CardContent className="pt-5">
          <EventForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
