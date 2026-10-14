import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventForm } from "@/components/staff/event-form";
import { AccessKeyCard } from "@/components/staff/access-key-card";
import { agendaSessions, byEvent, getEvent, speakers, subcommittees } from "@/lib/mock-data";

export default async function EventDetailsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const e = getEvent(eventId)!;

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[3fr_2fr]">
      <Card>
        <CardHeader><CardTitle>Event details</CardTitle></CardHeader>
        <CardContent>
          <EventForm
            mode="edit"
            defaultValues={{
              name: e.name, description: e.description, startDate: e.startDate, endDate: e.endDate,
              timeZone: e.timeZone, accessExpiry: e.accessExpiry, location: e.location, virtualDetails: e.virtualDetails ?? "",
            }}
          />
        </CardContent>
      </Card>
      <div className="grid gap-5">
        <AccessKeyCard initialKey={e.accessKey} />
        <Card>
          <CardHeader><CardTitle>At a glance</CardTitle></CardHeader>
          <CardContent className="grid gap-1.5 text-xs">
            <p>{e.invited} invited · {e.signedUp} signed up · {e.invited - e.signedUp} not yet</p>
            <p>
              {byEvent(subcommittees, eventId).length} subcommittees · {byEvent(agendaSessions, eventId).length} sessions · {byEvent(speakers, eventId).length} speakers
            </p>
            <p className="text-muted-foreground">Created by {e.createdBy} · {e.createdOn}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
