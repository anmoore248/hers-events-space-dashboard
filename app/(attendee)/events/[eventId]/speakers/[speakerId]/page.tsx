import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/breadcrumb";
import { formatDayShort, formatTimeRange } from "@/lib/format";
import { getEvent, getSpeaker, sessionsForSpeaker } from "@/lib/mock-data";

export default async function SpeakerPage({ params }: { params: Promise<{ eventId: string; speakerId: string }> }) {
  const { eventId, speakerId } = await params;
  const event = getEvent(eventId)!;
  const speaker = getSpeaker(speakerId);
  if (!speaker || speaker.eventId !== eventId) notFound();

  const base = `/events/${eventId}`;
  // Empty contact fields are never shown (doc §11.2).
  const contacts = [
    speaker.email && { label: "Email", href: `mailto:${speaker.email}` },
    speaker.linkedin && { label: "LinkedIn", href: speaker.linkedin },
    speaker.website && { label: "Website", href: speaker.website },
  ].filter((c): c is { label: string; href: string } => !!c);

  return (
    <div className="mx-auto max-w-2xl">
      <Breadcrumb items={[{ label: "Speakers", href: `${base}/speakers` }, { label: speaker.name }]} />
      <h2 className="text-2xl font-bold text-primary">{speaker.name}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{speaker.title} · {speaker.organization}</p>

      {contacts.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {contacts.map((c) => (
            <Button key={c.label} asChild variant="outline" size="sm">
              <a href={c.href} target={c.label === "Email" ? undefined : "_blank"} rel="noreferrer" className="no-underline">{c.label}</a>
            </Button>
          ))}
        </div>
      )}

      <section className="mt-6">
        <h3 className="mb-2 text-sm font-bold text-primary">Bio</h3>
        <div className="grid gap-3 text-sm leading-relaxed">
          {speaker.bio.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </section>

      <section className="mt-6">
        <h3 className="mb-2 text-sm font-bold text-primary">Sessions</h3>
        <ul className="grid gap-3">
          {sessionsForSpeaker(speaker.id).map((s) => (
            <li key={s.id}>
              <Link href={`${base}/sessions/${s.id}`} className="block rounded-lg border bg-card px-4 py-3 no-underline hover:border-hers-blue-light">
                <span className="block font-bold text-primary">{s.title}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDayShort(s.date)} · {formatTimeRange(s.start, s.end)} {event.tzLabel}
                  {s.location && ` · ${s.location}`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
