import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { ProfileForm } from "@/components/forms/profile-form";
import { getCurrentUser, getMyProfile, getSettings } from "@/lib/data";

export const metadata: Metadata = { title: "My profile" };

export default async function ProfilePage() {
  const [user, profile, { helpEmail }] = await Promise.all([getCurrentUser(), getMyProfile(), getSettings()]);
  const activeCount = profile?.events.filter((e) => !e.frozen).length ?? 0;

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      <h1 className="mb-2 text-2xl font-bold text-primary">My profile</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        This is how you appear in event directories. Saving updates every <strong className="text-foreground">active</strong> event. Past events keep the details you had at the time.
      </p>

      {!profile || profile.events.length === 0 ? (
        <EmptyState title="There are no events at this time.">
          Your profile appears once you&rsquo;ve joined an event with its access key.
        </EmptyState>
      ) : (
        <>
          <ProfileForm
            defaultValues={{ displayName: profile.displayName, title: profile.title, organization: profile.organization, linkedin: profile.linkedin }}
            loginEmail={user?.email ?? ""}
            helpEmail={helpEmail}
            editable={activeCount > 0}
          />
          <div className="mt-6 rounded-lg border border-hers-blue-light/60 bg-hers-panel p-4">
            <h2 className="mb-2 text-sm font-bold text-primary">Applies to</h2>
            <div className="flex flex-wrap gap-2">
              {profile.events.map((e) => (
                <Badge key={e.id} variant={e.frozen ? "muted" : "default"} className="bg-white">
                  {e.name} · {e.frozen ? "frozen" : "active"}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
