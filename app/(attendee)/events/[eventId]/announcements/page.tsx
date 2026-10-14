import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { announcements, byEvent } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default async function AnnouncementsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  // Pinned first, then newest first. TODO: mark as read (announcement_reads) on view.
  const list = [...byEvent(announcements, eventId)].sort((a, b) => Number(b.pinned) - Number(a.pinned));

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-4 text-base font-bold text-primary">Announcements</h2>
      {list.length === 0 ? (
        <p className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">No announcements yet.</p>
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
                  <p className="mt-1 text-xs text-muted-foreground">{a.postedBy} · {a.postedAt}</p>
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
