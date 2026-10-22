import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventForm } from "@/components/staff/event-form";
import { AccessKeyCard } from "@/components/staff/access-key-card";
import { GroupMeCleanupCard } from "@/components/staff/groupme-cleanup-card";
import { getEvent, getEventStats, getGroupMeCleanup, requireStaffPage } from "@/lib/data";
import { formatDate, plural } from "@/lib/format";

export default async function EventDetailsPage({ params }: { params: Promise<{ eventId: string }> }) {
  await requireStaffPage();
  const { eventId } = await params;
  const [e, stats, cleanup] = await Promise.all([getEvent(eventId), getEventStats(eventId), getGroupMeCleanup(eventId)]);
  if (!e) notFound();

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[3fr_2fr]">
      <Card>
        <CardHeader><CardTitle>Event details</CardTitle></CardHeader>
        <CardContent>
          <EventForm
            mode="edit"
            eventId={e.id}
            defaultValues={{
              name: e.name, description: e.description, startDate: e.startDate, endDate: e.endDate,
              timeZone: e.timeZone, accessExpiry: e.accessExpiry, location: e.location, virtualDetails: e.virtualDetails ?? "",
            }}
          />
        </CardContent>
      </Card>
      <div className="grid gap-5">
        {cleanup?.due && <GroupMeCleanupCard eventId={e.id} dueDate={cleanup.dueDate} />}
        <AccessKeyCard eventId={e.id} initialKey={e.accessKey} />
        <Card>
          <CardHeader><CardTitle>At a glance</CardTitle></CardHeader>
          <CardContent className="grid gap-1.5 text-xs">
            <p>{stats.invited + stats.signedUp} on the guest list · {stats.signedUp} signed up · {stats.invited} not yet</p>
            <p>
              {plural(stats.subcommittees, "subcommittee")} · {plural(stats.sessions, "session")} · {plural(stats.speakers, "speaker")}
            </p>
            <p className="text-muted-foreground">
              Created {e.createdByName ? `by ${e.createdByName} · ` : ""}{formatDate(e.createdAt)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
