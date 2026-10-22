"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmButton } from "@/components/confirm-button";
import { markGroupMeClosed } from "@/lib/actions/events";
import { formatDate } from "@/lib/format";

/** Reminder to close the event's GroupMe groups on the cleanup schedule (doc §13.1). */
export function GroupMeCleanupCard({ eventId, dueDate }: { eventId: string; dueDate: string }) {
  return (
    <Card className="border-2 border-destructive">
      <CardHeader>
        <CardTitle>GroupMe cleanup due</CardTitle>
        <p className="text-xs text-muted-foreground">
          Since {formatDate(dueDate)}. Close this event&rsquo;s main group and every subcommittee group from the shared HERS GroupMe account.
        </p>
      </CardHeader>
      <CardContent>
        <ConfirmButton
          label="Mark groups as closed"
          title="Have all of this event’s GroupMe groups been closed?"
          confirmLabel="Yes, mark as closed"
          description={<p>This removes the reminder from the dashboard and records it in the activity log.</p>}
          onConfirm={() => markGroupMeClosed(eventId)}
        />
      </CardContent>
    </Card>
  );
}
