import { DirectoryList } from "@/components/attendee/directory-list";
import { getDirectory } from "@/lib/data";

export default async function DirectoryPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  return <DirectoryList people={await getDirectory(eventId)} />;
}
