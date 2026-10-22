import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageTitle } from "@/components/page-title";
import { EmptyState } from "@/components/empty-state";
import { getActivityFilterOptions, getActivityLog, requireStaffPage } from "@/lib/data";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Activity log" };

type Search = { action?: string; who?: string; event?: string; page?: string };

export default async function ActivityPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireStaffPage();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const [log, options] = await Promise.all([
    getActivityLog({ action: sp.action || undefined, who: sp.who || undefined, event: sp.event || undefined, page }),
    getActivityFilterOptions(),
  ]);
  const first = log.total ? (log.page - 1) * log.pageSize + 1 : 0;
  const last = Math.min(log.page * log.pageSize, log.total);
  const pageHref = (p: number) => {
    const q = new URLSearchParams(Object.entries({ ...sp, page: String(p) }).filter(([, v]) => v) as [string, string][]);
    return `/admin/activity?${q}`;
  };

  return (
    <div className="max-w-5xl">
      <PageTitle title="Activity log" />
      <form className="mb-5 grid items-end gap-3 sm:max-w-3xl sm:grid-cols-[1fr_1fr_1fr_auto]">
        <div className="grid gap-1.5">
          <Label htmlFor="f-action">Action</Label>
          <NativeSelect id="f-action" name="action" defaultValue={sp.action ?? ""}>
            <option value="">All actions</option>
            {options.actions.map((a) => <option key={a}>{a}</option>)}
          </NativeSelect>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="f-who">Staff member</Label>
          <NativeSelect id="f-who" name="who" defaultValue={sp.who ?? ""}>
            <option value="">Anyone</option>
            {options.staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </NativeSelect>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="f-event">Event</Label>
          <NativeSelect id="f-event" name="event" defaultValue={sp.event ?? ""}>
            <option value="">All events</option>
            {options.events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </NativeSelect>
        </div>
        <Button type="submit" variant="outline">Filter</Button>
      </form>

      {log.items.length === 0 ? (
        <EmptyState title="There is no activity at this time." />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When (ET)</TableHead>
                <TableHead>Who</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Event</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {log.items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="whitespace-nowrap">{formatDateTime(a.at)}</TableCell>
                  <TableCell className="whitespace-nowrap">{a.actorName}</TableCell>
                  <TableCell className="whitespace-nowrap font-bold">{a.action}</TableCell>
                  <TableCell>{a.details}</TableCell>
                  <TableCell>{a.eventName ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>Showing {first}–{last} of {log.total}</span>
            <div className="flex gap-2">
              {log.page > 1 ? (
                <Button asChild variant="outline" size="sm"><Link href={pageHref(log.page - 1)} className="no-underline">Previous</Link></Button>
              ) : (
                <Button variant="outline" size="sm" disabled>Previous</Button>
              )}
              {last < log.total ? (
                <Button asChild variant="outline" size="sm"><Link href={pageHref(log.page + 1)} className="no-underline">Next</Link></Button>
              ) : (
                <Button variant="outline" size="sm" disabled>Next</Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
