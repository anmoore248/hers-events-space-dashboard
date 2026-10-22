import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTitle } from "@/components/page-title";
import { EventsTable } from "@/components/staff/events-table";
import { getRecentActivity, getStaffEvents, requireStaffPage } from "@/lib/data";
import { formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "Staff dashboard" };

export default async function StaffDashboard() {
  await requireStaffPage();
  const [events, activity] = await Promise.all([getStaffEvents(), getRecentActivity(5)]);
  return (
    <div className="max-w-6xl">
      <PageTitle
        title="Dashboard"
        action={
          <Button asChild>
            <Link href="/admin/events/new" className="no-underline"><Plus /> New event</Link>
          </Button>
        }
      />
      <div className="grid items-start gap-5 lg:grid-cols-[1fr_20rem]">
        <EventsTable events={events} />
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Activity</CardTitle>
            {activity.unread > 0 && <Badge variant="coral">{activity.unread} new</Badge>}
          </CardHeader>
          <CardContent>
            {activity.items.length === 0 ? (
              <p className="mb-3 text-xs text-muted-foreground">There is no activity at this time.</p>
            ) : (
              <ul className="divide-y">
                {activity.items.map((a) => (
                  <li key={a.id} className="py-3 text-xs first:pt-0">
                    <p>
                      {a.unread && <span className="mr-1.5 inline-block size-2 rounded-full bg-destructive" aria-label="New" />}
                      <strong>{a.actorName}</strong> · {a.action}
                      {a.details && <>: {a.details}</>}
                    </p>
                    <p className="mt-0.5 text-muted-foreground">{formatRelative(a.at)}{a.eventName && ` · ${a.eventName}`}</p>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/admin/activity" className="text-xs text-primary underline">View full log</Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
