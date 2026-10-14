import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageTitle } from "@/components/page-title";
import { activity, events, staffMembers } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Activity log" };

/** TODO: make the filters URL search params (?action=&who=&event=&page=) and query the activity_log table. */
export default function ActivityPage() {
  const actions = [...new Set(activity.map((a) => a.action))];
  return (
    <div className="max-w-5xl">
      <PageTitle title="Activity log" />
      <form className="mb-5 grid gap-3 sm:grid-cols-3 sm:max-w-2xl">
        <div className="grid gap-1.5">
          <Label htmlFor="f-action">Action</Label>
          <NativeSelect id="f-action" name="action"><option value="">All actions</option>{actions.map((a) => <option key={a}>{a}</option>)}</NativeSelect>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="f-who">Staff member</Label>
          <NativeSelect id="f-who" name="who"><option value="">Anyone</option>{staffMembers.filter((s) => s.name).map((s) => <option key={s.id}>{s.name}</option>)}</NativeSelect>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="f-event">Event</Label>
          <NativeSelect id="f-event" name="event"><option value="">All events</option>{events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</NativeSelect>
        </div>
      </form>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>When</TableHead>
            <TableHead>Who</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Details</TableHead>
            <TableHead>Event</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activity.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="whitespace-nowrap">{a.when}</TableCell>
              <TableCell className="whitespace-nowrap">{a.who}</TableCell>
              <TableCell className="whitespace-nowrap font-bold">{a.action}</TableCell>
              <TableCell>{a.details}</TableCell>
              <TableCell>{a.event ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>Showing 1–{activity.length} of 214</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>Previous</Button>
          <Button variant="outline" size="sm">Next</Button>
        </div>
      </div>
    </div>
  );
}
