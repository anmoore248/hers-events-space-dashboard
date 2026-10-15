import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTitle } from "@/components/page-title";
import { EventsTable } from "@/components/staff/events-table";
import { activity, events } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Staff dashboard" };

export default function StaffDashboard() {
  const unread = activity.filter((a) => a.unread).length;
  return (
    <div className="max-w-6xl">
      <PageTitle
        title="Dashboard"
        action={
          <Button asChild>
            <Link href="/admin/events/new" className="no-underline">
              <Plus /> New event
            </Link>
          </Button>
        }
      />
      <div className="grid items-start gap-5 lg:grid-cols-[1fr_20rem]">
        <EventsTable events={events} />
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Activity</CardTitle>
            {unread > 0 && <Badge variant="coral">{unread} new</Badge>}
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {activity.slice(0, 4).map((a) => (
                <li key={a.id} className="py-3 text-xs first:pt-0">
                  <p>
                    <strong>{a.who}</strong> {a.summary}
                  </p>
                  <p className="text-muted-foreground mt-0.5">{a.relative}</p>
                </li>
              ))}
            </ul>
            <Link
              href="/admin/activity"
              className="text-primary text-xs underline"
            >
              View full log
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
