import Link from "next/link";
import { notFound } from "next/navigation";
import { Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Breadcrumb } from "@/components/breadcrumb";
import { formatDayShort, formatTimeRange, tzLabel } from "@/lib/format";
import { getEvent, getSessionDetail } from "@/lib/data";

export default async function SessionPage({ params }: { params: Promise<{ eventId: string; sessionId: string }> }) {
  const { eventId, sessionId } = await params;
  const [event, detail] = await Promise.all([getEvent(eventId), getSessionDetail(eventId, sessionId)]);
  if (!event || !detail) notFound();

  const { session, track, speakers } = detail;
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
            {formatDayShort(session.date)} · {formatTimeRange(session.start, session.end)} {tzLabel(event.timeZone)}
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
            {session.description.split(/\n\s*\n/).filter(Boolean).map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}
          </div>
        </section>
      )}

      {speakers.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-bold text-primary">Speakers</h3>
          <ul className="overflow-hidden rounded-lg border bg-card">
            {speakers.map((sp) => (
              <li key={sp.id} className="border-b last:border-b-0">
                <Link href={`${base}/speakers/${sp.id}`} className="flex items-center justify-between px-4 py-3 no-underline hover:bg-muted">
                  <span>
                    <span className="block font-bold text-primary">{sp.name}</span>
                    <span className="text-xs text-muted-foreground">{[sp.title, sp.organization].filter(Boolean).join(" · ")}</span>
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
