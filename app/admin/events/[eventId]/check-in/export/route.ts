import { getCheckInSheet, getCurrentUser, getEvent } from "@/lib/data";
import { formatDateTime } from "@/lib/format";

/** Attendance for Salesforce: one row per attendee, one column per check-in point (doc §14). */
export async function GET(_req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const user = await getCurrentUser();
  if (user?.role !== "staff") return new Response("Not found", { status: 404 });
  const event = await getEvent(eventId);
  if (!event) return new Response("Not found", { status: 404 });

  const { points, attendees, checkIns } = await getCheckInSheet(eventId);
  // Names and organizations are typed by attendees: neutralize spreadsheet formulas (=, +, -, @).
  const cell = (raw: string) => {
    const v = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
    return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  };
  const header = ["email", "display_name", "organization", ...points.map((p) => p.label)];
  const rows = attendees.map((a) => [
    a.email,
    a.displayName,
    a.organization ?? "",
    ...points.map((p) => {
      const c = checkIns.find((x) => x.pointId === p.id && x.enrollmentId === a.enrollmentId);
      return c ? formatDateTime(c.at, event.timeZone) : "";
    }),
  ]);
  const csv = "﻿" + [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
  const slug = event.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug || "event"}-attendance.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
