import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { announcements, byEvent } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default async function AnnouncementsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  // Pinned first, then newest first. TODO: mark as read (announcement_reads) on view.
  const list = [...byEvent(announcements, eventId)].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned),
  );

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-primary mb-4 text-base font-bold">Announcements</h2>
      {list.length === 0 ? (
        <p className="bg-card text-muted-foreground rounded-lg border p-6 text-sm">
          No announcements yet.
        </p>
      ) : (
        <ul className="grid gap-3">
          {list.map((a) => (
            <li key={a.id}>
              <Card className={cn(a.pinned && "border-destructive border-2")}>
                <CardContent className="pt-5">
                  <div className="flex flex-wrap items-center gap-2">
                    {a.pinned && <Badge variant="coral">Pinned</Badge>}
                    {a.unread && <Badge>New</Badge>}
                    <h3 className="text-primary text-base font-bold">
                      {a.title}
                    </h3>
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {a.postedBy} · {a.postedAt}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed whitespace-pre-line">
                    {a.body}
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
