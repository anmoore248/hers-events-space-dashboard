import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReadOnlyNotice } from "@/components/read-only-notice";
import { getEventAccess } from "@/lib/access";
import { formatTimeRange } from "@/lib/format";
import {
  agendaSessions, announcements, byEvent, currentAttendee, enrollments, eventLinks,
  getEvent, getTrack, settings, subcommittees,
} from "@/lib/mock-data";

export default async function EventHomePage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const event = getEvent(eventId)!;
  const access = await getEventAccess(eventId);
  const base = `/events/${eventId}`;

  const eventAnnouncements = byEvent(announcements, eventId);
  const pinned = eventAnnouncements.find((a) => a.pinned);
  const unread = eventAnnouncements.filter((a) => a.unread).length;
  // TODO: "up next" = the next two sessions after now, in the event time zone.
  const upNext = byEvent(agendaSessions, eventId).filter((s) => s.speakerIds.length).slice(0, 2);
  // TODO: filter by visibleFrom / visibleUntil against now.
  const links = byEvent(eventLinks, eventId).filter((l) => !l.visibleFrom);
  const scheduled = byEvent(eventLinks, eventId).filter((l) => l.visibleFrom);
  const me = enrollments.find((e) => e.eventId === eventId && e.userId === currentAttendee.id);
  const mySubcommittees = subcommittees.filter((s) => me?.subcommitteeIds.includes(s.id));

  return (
    <div className="grid gap-5">
      {access === "read-only" && <ReadOnlyNotice />}

      {pinned && (
        <Card className="border-2 border-destructive">
          <CardContent className="pt-5">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="coral">Pinned</Badge>
              <h2 className="text-base font-bold text-primary">{pinned.title}</h2>
            </div>
            <p className="mt-2 text-sm">{pinned.body}</p>
            <p className="mt-2 text-xs text-muted-foreground">Posted by {pinned.postedBy} · {pinned.postedAt}</p>
            <Link href={`${base}/announcements`} className="mt-2 inline-block text-xs text-primary underline">
              All announcements{unread ? ` (${unread} unread)` : ""}
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid items-start gap-5 md:grid-cols-[3fr_2fr]">
        <div className="grid gap-5">
          <Card>
            <CardHeader><CardTitle>Up next</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              {upNext.map((s) => {
                const track = getTrack(s.trackId);
                return (
                  <div key={s.id} className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">{s.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimeRange(s.start, s.end)} {event.tzLabel}
                        {s.location && ` · ${s.location}`}
                        {track && ` · ${track.name} track`}
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`${base}/sessions/${s.id}`} className="no-underline">Details</Link>
                    </Button>
                  </div>
                );
              })}
              <Link href={`${base}/agenda`} className="text-xs text-primary underline">Full agenda</Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>About this event</CardTitle></CardHeader>
            <CardContent className="grid gap-3 text-sm leading-relaxed">
              {event.description.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
              <p className="text-xs text-muted-foreground">
                Location: {event.location}
                {event.virtualDetails && (
                  <> · Virtual: <a href={event.virtualDetails} className="text-primary underline">{event.virtualDetails}</a></>
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-5">
          <Card>
            <CardHeader><CardTitle>Event links</CardTitle></CardHeader>
            <CardContent className="grid gap-2">
              {links.map((l) => (
                <Button key={l.id} asChild variant="outline" className="justify-start">
                  <a href={l.url} target="_blank" rel="noreferrer" className="no-underline">
                    {l.label}
                    <ExternalLink className="ml-auto opacity-60" aria-hidden />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </Button>
              ))}
              {scheduled.map((l) => (
                <p key={l.id} className="text-xs text-muted-foreground">&ldquo;{l.label}&rdquo; appears after the last session.</p>
              ))}
            </CardContent>
          </Card>

          {mySubcommittees.length > 0 && (
            <Card>
              <CardHeader><CardTitle>My subcommittees</CardTitle></CardHeader>
              <CardContent className="grid gap-3">
                {mySubcommittees.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3">
                    <span>{s.name}</span>
                    <Button asChild variant="outline" size="sm">
                      <a href={s.groupMeUrl} target="_blank" rel="noreferrer" className="no-underline">Open GroupMe</a>
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="bg-hers-panel">
            <CardHeader><CardTitle>Questions?</CardTitle></CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <a href={settings.messageStaffGroupMe} target="_blank" rel="noreferrer" className="no-underline">
                  Message HERS staff (GroupMe)
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
