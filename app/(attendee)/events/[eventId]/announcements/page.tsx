import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { getAnnouncements, getEvent } from "@/lib/data";
import { formatDateTime, tzLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

export default async function AnnouncementsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const [event, list] = await Promise.all([getEvent(eventId), getAnnouncements(eventId)]);
  if (!event) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-4 text-base font-bold text-primary">Announcements</h2>
      {list.length === 0 ? (
        <EmptyState title="There are no announcements at this time." />
      ) : (
        <ul className="grid gap-3">
          {list.map((a) => (
            <li key={a.id}>
              <Card className={cn(a.pinned && "border-2 border-destructive")}>
                <CardContent className="pt-5">
                  <div className="flex flex-wrap items-center gap-2">
                    {a.pinned && <Badge variant="coral">Pinned</Badge>}
                    {a.unread && <Badge>New</Badge>}
                    <h3 className="text-base font-bold text-primary">{a.title}</h3>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {a.postedByName} · {formatDateTime(a.postedAt, event.timeZone)} {tzLabel(event.timeZone)}
                  </p>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{a.body}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
