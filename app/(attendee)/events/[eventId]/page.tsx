import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReadOnlyNotice } from "@/components/read-only-notice";
import { getEventAccess } from "@/lib/access";
import { getEvent, getEventHome, getSettings } from "@/lib/data";
import { formatDateTime, formatDayShort, formatLocalDateTime, formatTimeRange, tzLabel } from "@/lib/format";

export default async function EventHomePage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const [event, access, home, settings] = await Promise.all([
    getEvent(eventId), getEventAccess(eventId), getEventHome(eventId), getSettings(),
  ]);
  if (!event) notFound();

  const base = `/events/${eventId}`;
  const tz = tzLabel(event.timeZone);
  const { pinned, unreadCount, upNext, tracks, links, laterLinks, mySubcommittees } = home;

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
            <p className="mt-2 whitespace-pre-line text-sm">{pinned.body}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Posted by {pinned.postedByName} · {formatDateTime(pinned.postedAt, event.timeZone)} {tz}
            </p>
            <Link href={`${base}/announcements`} className="mt-2 inline-block text-xs text-primary underline">
              All announcements{unreadCount ? ` (${unreadCount} unread)` : ""}
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid items-start gap-5 md:grid-cols-[3fr_2fr]">
        <div className="grid gap-5">
          <Card>
            <CardHeader><CardTitle>Up next</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              {upNext.length === 0 ? (
                <p className="text-sm text-muted-foreground">There are no upcoming sessions at this time.</p>
              ) : (
                upNext.map((s) => {
                  const track = tracks.find((t) => t.id === s.trackId);
                  return (
                    <div key={s.id} className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">{s.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDayShort(s.date)} · {formatTimeRange(s.start, s.end)} {tz}
                          {s.location && ` · ${s.location}`}
                          {track && ` · ${track.name} track`}
                        </p>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`${base}/sessions/${s.id}`} className="no-underline">Details</Link>
                      </Button>
                    </div>
                  );
                })
              )}
              <Link href={`${base}/agenda`} className="text-xs text-primary underline">Full agenda</Link>
            </CardContent>
          </Card>

          {(event.description || event.location || event.virtualDetails) && (
            <Card>
              <CardHeader><CardTitle>About this event</CardTitle></CardHeader>
              <CardContent className="grid gap-3 text-sm leading-relaxed">
                {event.description.split(/\n\s*\n/).filter(Boolean).map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}
                {(event.location || event.virtualDetails) && (
                  <p className="text-xs text-muted-foreground">
                    {event.location && <>Location: {event.location}</>}
                    {event.location && event.virtualDetails && " · "}
                    {event.virtualDetails && (
                      /^https?:\/\//.test(event.virtualDetails) ? (
                        <>Virtual: <a href={event.virtualDetails} target="_blank" rel="noreferrer" className="break-all text-primary underline">{event.virtualDetails}</a></>
                      ) : (
                        <>Virtual: {event.virtualDetails}</>
                      )
                    )}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid gap-5">
          <Card>
            <CardHeader><CardTitle>Event links</CardTitle></CardHeader>
            <CardContent className="grid gap-2">
              {links.length === 0 && laterLinks.length === 0 && (
                <p className="text-sm text-muted-foreground">There are no links for this event yet.</p>
              )}
              {links.map((l) => (
                <Button key={l.id} asChild variant="outline" className="justify-start">
                  <a href={l.url} target="_blank" rel="noreferrer" className="no-underline">
                    <span className="truncate">{l.label}</span>
                    <ExternalLink className="ml-auto opacity-60" aria-hidden />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </Button>
              ))}
              {laterLinks.map((l) => (
                <p key={l.id} className="text-xs text-muted-foreground">
                  &ldquo;{l.label}&rdquo; appears {l.visibleFrom ? `on ${formatLocalDateTime(l.visibleFrom)} ${tz}` : "later"}.
                </p>
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
                    {s.groupMeUrl && (
                      <Button asChild variant="outline" size="sm">
                        <a href={s.groupMeUrl} target="_blank" rel="noreferrer" className="no-underline">Open GroupMe</a>
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="bg-hers-panel">
            <CardHeader><CardTitle>Questions?</CardTitle></CardHeader>
            <CardContent className="grid gap-2">
              {settings.messageStaffGroupMe && (
                <Button asChild className="w-full">
                  <a href={settings.messageStaffGroupMe} target="_blank" rel="noreferrer" className="no-underline">
                    Message HERS staff (GroupMe)
                  </a>
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                Or email <a href={`mailto:${settings.helpEmail}`} className="text-primary underline">{settings.helpEmail}</a>.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
