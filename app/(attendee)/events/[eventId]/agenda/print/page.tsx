import Image from "next/image";
import Link from "next/link";
import { groupByTimeSlot } from "@/lib/agenda";
import { formatDayFull, formatTime } from "@/lib/format";
import { agendaSessions, byEvent, getEvent, getSpeaker, getTrack } from "@/lib/mock-data";
import { PrintButton } from "@/components/attendee/print-button";

/**
 * Print-ready agenda (doc §11.3): black and white, grayscale logo, each day on
 * a new page, sessions never split, parallel tracks grouped by time slot with
 * the track name on each session, virtual links printed in full.
 */
export default async function PrintAgendaPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const event = getEvent(eventId)!;
  const sessions = byEvent(agendaSessions, eventId);
  const days = [...new Set(sessions.map((s) => s.date))].sort();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
        <Link href={`/events/${eventId}/agenda`} className="text-xs text-primary underline">Back to agenda</Link>
        <PrintButton />
      </div>

      {days.map((day, i) => (
        <section
          key={day}
          className="mb-6 bg-white p-8 text-black shadow-sm print:mb-0 print:p-0 print:shadow-none [&:not(:first-of-type)]:break-before-page"
        >
          <header className="mb-3 flex items-start justify-between gap-6 border-b-2 border-black pb-3">
            <Image src="/hers-logo-grayscale.png" alt="HERS" width={2805} height={364} className="h-6 w-auto" />
            <div className="text-right">
              <p className="font-bold">{event.name}</p>
              <p className="text-sm">{formatDayFull(day)} · Times in {event.tzLabel}</p>
            </div>
          </header>

          {groupByTimeSlot(sessions.filter((s) => s.date === day)).map((slot) =>
            slot.sessions.map((s, j) => {
              const track = getTrack(s.trackId);
              const names = s.speakerIds.map((id) => getSpeaker(id)?.name).filter(Boolean).join(", ");
              return (
                <div key={s.id} className="grid break-inside-avoid grid-cols-[6rem_1fr] gap-4 border-b border-black/40 py-2 text-sm">
                  <div className="font-bold">{j === 0 ? formatTime(slot.start) : ""}</div>
                  <div>
                    <p>
                      <strong>{s.title}</strong>
                      {track && ` · ${track.name}`}
                    </p>
                    <p>
                      {[s.location, names && `Speaker${s.speakerIds.length > 1 ? "s" : ""}: ${names}`, s.virtualLink && `Virtual: ${s.virtualLink}`]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </div>
              );
            }),
          )}
          {i < days.length - 1 && (
            <p className="mt-4 border-t border-dashed border-black/40 pt-2 text-center text-xs text-black/60 print:hidden">
              Page break · {formatDayFull(days[i + 1]).split(",")[0]} starts on a new page
            </p>
          )}
        </section>
      ))}
    </div>
  );
}
