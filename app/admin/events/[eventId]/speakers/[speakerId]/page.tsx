import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { SpeakerForm } from "@/components/staff/speaker-form";
import { getSpeakerDetail, requireStaffPage } from "@/lib/data";

/** Handles both /speakers/new and /speakers/[speakerId]. */
export default async function SpeakerEditPage({ params }: { params: Promise<{ eventId: string; speakerId: string }> }) {
  await requireStaffPage();
  const { eventId, speakerId } = await params;
  const isNew = speakerId === "new";
  const detail = isNew ? null : await getSpeakerDetail(eventId, speakerId);
  if (!isNew && !detail) notFound();
  const sp = detail?.speaker;

  return (
    <>
      <Breadcrumb items={[{ label: "Speakers", href: `/admin/events/${eventId}/speakers` }, { label: isNew ? "New speaker" : "Edit speaker" }]} />
      <SpeakerForm
        eventId={eventId}
        speakerId={sp?.id}
        defaultValues={{
          name: sp?.name ?? "", title: sp?.title ?? "", organization: sp?.organization ?? "", bio: sp?.bio ?? "",
          email: sp?.email ?? "", linkedin: sp?.linkedin ?? "", website: sp?.website ?? "",
        }}
        sessionTitles={detail?.sessions.map((s) => s.title) ?? []}
      />
    </>
  );
}
