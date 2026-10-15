import { DirectoryList } from "@/components/attendee/directory-list";
import { byEvent, enrollments } from "@/lib/mock-data";

export default async function DirectoryPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const people = byEvent(enrollments, eventId)
    .filter((e) => e.status === "active")
    .sort((a, b) => a.displayName.localeCompare(b.displayName))
    .map(({ id, displayName, title, organization, linkedin }) => ({
      id,
      displayName,
      title,
      organization,
      linkedin,
    }));
  return <DirectoryList people={people} />;
}
