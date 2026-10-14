import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { SpeakerForm } from "@/components/staff/speaker-form";
import { getSpeaker, sessionsForSpeaker } from "@/lib/mock-data";

/** Handles both /speakers/new and /speakers/[speakerId]. */
export default async function SpeakerEditPage({ params }: { params: Promise<{ eventId: string; speakerId: string }> }) {
  const { eventId, speakerId } = await params;
  const isNew = speakerId === "new";
  const sp = isNew ? undefined : getSpeaker(speakerId);
  if (!isNew && !sp) notFound();

  return (
    <>
      <Breadcrumb items={[{ label: "Speakers", href: `/admin/events/${eventId}/speakers` }, { label: isNew ? "New speaker" : "Edit speaker" }]} />
      <SpeakerForm
        eventId={eventId}
        defaultValues={{
          name: sp?.name ?? "", title: sp?.title ?? "", organization: sp?.organization ?? "", bio: sp?.bio ?? "",
          email: sp?.email ?? "", linkedin: sp?.linkedin ?? "", website: sp?.website ?? "",
        }}
        sessionTitles={sp ? sessionsForSpeaker(sp.id).map((s) => s.title) : []}
      />
    </>
  );
}
