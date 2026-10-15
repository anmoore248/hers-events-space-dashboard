import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { ProfileForm } from "@/components/forms/profile-form";
import {
  currentAttendee,
  enrollments,
  events,
  settings,
} from "@/lib/mock-data";

export const metadata: Metadata = { title: "My profile" };

export default function ProfilePage() {
  const me = enrollments.find((e) => e.userId === currentAttendee.id)!;
  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      <h1 className="text-primary mb-2 text-2xl font-bold">My profile</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        This is how you appear in event directories. Saving updates every{" "}
        <strong className="text-foreground">active</strong> event. Past events
        keep the details you had at the time.
      </p>

      <ProfileForm
        defaultValues={{
          displayName: me.displayName,
          title: me.title ?? "",
          organization: me.organization ?? "",
          linkedin: me.linkedin ?? "",
        }}
        loginEmail={currentAttendee.email}
        helpEmail={settings.helpEmail}
      />

      <div className="border-hers-blue-light/60 bg-hers-panel mt-6 rounded-lg border p-4">
        <h2 className="text-primary mb-2 text-sm font-bold">Applies to</h2>
        <div className="flex flex-wrap gap-2">
          {events.map((e) => (
            <Badge
              key={e.id}
              variant={e.status === "Expired" ? "muted" : "default"}
              className="bg-white"
            >
              {e.name} · {e.status === "Expired" ? "frozen" : "active"}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
