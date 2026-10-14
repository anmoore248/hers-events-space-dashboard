import Link from "next/link";
import { notFound } from "next/navigation";
import { Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Breadcrumb } from "@/components/breadcrumb";
import { formatDayShort, formatTimeRange } from "@/lib/format";
import { getEvent, getSession, getSpeaker, getTrack } from "@/lib/mock-data";

export default async function SessionPage({ params }: { params: Promise<{ eventId: string; sessionId: string }> }) {
  const { eventId, sessionId } = await params;
  const event = getEvent(eventId)!;
  const session = getSession(sessionId);
  if (!session || session.eventId !== eventId) notFound();

  const track = getTrack(session.trackId);
  const sessionSpeakers = session.speakerIds.map(getSpeaker).filter((s) => !!s);
  const base = `/events/${eventId}`;

  return (
    <div className="mx-auto max-w-2xl">
      <Breadcrumb items={[{ label: "Agenda", href: `${base}/agenda` }, { label: session.title }]} />
      <div className="mb-2 flex flex-wrap gap-1.5">
        {track && <Badge>{track.name} track</Badge>}
        {session.virtualLink && <Badge variant="muted">{session.location ? "In person + virtual" : "Virtual"}</Badge>}
      </div>
      <h2 className="mb-4 text-xl font-bold text-primary">{session.title}</h2>

      <Card className="mb-6">
        <CardContent className="grid gap-2 pt-5 text-sm">
          <p className="font-bold">
            {formatDayShort(session.date)} · {formatTimeRange(session.start, session.end)} {event.tzLabel}
          </p>
          {session.location && <p>{session.location}</p>}
          {session.virtualLink && (
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild variant="outline" size="sm">
                <a href={session.virtualLink} target="_blank" rel="noreferrer" className="no-underline">
                  <Video /> Join virtually
                </a>
              </Button>
              <span className="break-all text-xs text-muted-foreground">{session.virtualLink}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {session.description && (
        <section className="mb-6">
          <h3 className="mb-2 text-sm font-bold text-primary">Description</h3>
          <div className="grid gap-3 text-sm leading-relaxed">
            {session.description.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </section>
      )}

      {sessionSpeakers.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-bold text-primary">Speakers</h3>
          <ul className="overflow-hidden rounded-lg border bg-card">
            {sessionSpeakers.map((sp) => (
              <li key={sp.id} className="border-b last:border-b-0">
                <Link href={`${base}/speakers/${sp.id}`} className="flex items-center justify-between px-4 py-3 no-underline hover:bg-muted">
                  <span>
                    <span className="block font-bold text-primary">{sp.name}</span>
                    <span className="text-xs text-muted-foreground">{sp.title} · {sp.organization}</span>
                  </span>
                  <span aria-hidden className="text-primary">›</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
