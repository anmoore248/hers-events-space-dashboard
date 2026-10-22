"use client";

import * as React from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmButton } from "@/components/confirm-button";
import { changeEmail, clearPassword, retireAccount, setDeactivated } from "@/lib/actions/people";
import { formatDate } from "@/lib/format";
import type { PersonAccount, PersonEnrollment } from "@/lib/types";

const statusVariant = { Active: "default", "Password cleared": "coral", Deactivated: "muted" } as const;

function summary(enrollments: PersonEnrollment[]) {
  const active = enrollments.filter((e) => e.status === "active").length;
  const past = enrollments.filter((e) => e.status === "expired").length;
  const parts = [active && `${active} active`, past && `${past} past`].filter(Boolean);
  return parts.length ? parts.join(" · ") : "—";
}

function ChangeEmail({ person }: { person: PersonAccount }) {
  const [value, setValue] = React.useState("");
  const first = person.name.split(" ")[0];
  return (
    <ConfirmButton
      label="Change email"
      title="Change email"
      confirmLabel="Change email"
      description={
        <p>
          Confirm the request is genuine first. {first} will be signed out everywhere and log in with the new address and their existing password. Their invitation email is updated on every event.
        </p>
      }
      onConfirm={() => changeEmail(person.id, value)}
    >
      <div className="grid gap-1.5">
        <Label htmlFor="new-email">New email</Label>
        <Input id="new-email" type="email" value={value} onChange={(e) => setValue(e.target.value)} />
        <p className="text-xs text-muted-foreground"><strong>Reminder:</strong> also update this email in Salesforce.</p>
      </div>
    </ConfirmButton>
  );
}

function PersonCard({ person, query }: { person: PersonAccount; query: string }) {
  const first = person.name.split(" ")[0] || person.name;
  return (
    <Card>
      <CardContent className="grid gap-4 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="flex flex-wrap items-center gap-2 text-lg font-bold text-primary">
              {person.name}
              <Badge variant={statusVariant[person.status]}>{person.status}</Badge>
            </h2>
            <p className="text-xs text-muted-foreground">
              {person.email} · {person.role === "staff" ? "Staff" : "Attendee"} · created {formatDate(person.createdAt)}
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/people?q=${encodeURIComponent(query)}`} className="no-underline">Close</Link>
          </Button>
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold">Events</p>
          {person.enrollments.length === 0 ? (
            <p className="text-xs text-muted-foreground">Not enrolled in any events.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {person.enrollments.map((e) => (
                <li key={e.eventId}>
                  <Link href={`/admin/events/${e.eventId}/attendees`} className="no-underline">
                    <Badge variant={e.status === "active" ? "default" : "muted"}>{e.eventName} · {e.status}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t pt-4">
          <ConfirmButton
            label="Reset password"
            title="Reset password"
            confirmLabel="Reset password"
            description={
              <p>
                Removes {first}&rsquo;s password and signs them out everywhere. Reply only to <strong>{person.email}</strong> and tell them to go to Sign up with any of their access keys to choose a new password.
              </p>
            }
            onConfirm={() => clearPassword(person.id)}
          />
          <ChangeEmail person={person} />
          {person.status === "Deactivated" ? (
            <ConfirmButton label="Reactivate" title={`Reactivate ${person.name}?`} confirmLabel="Reactivate" onConfirm={() => setDeactivated(person.id, false)} />
          ) : (
            <ConfirmButton
              label="Deactivate"
              title={`Deactivate ${person.name}?`}
              confirmLabel="Deactivate"
              destructive
              variant="destructive"
              description={<p>Blocks login and ends their sessions. The account and its history are kept.</p>}
              onConfirm={() => setDeactivated(person.id, true)}
            />
          )}
          {person.role === "attendee" && (
            <ConfirmButton
              label="Free up this email"
              title="Free up this email address?"
              confirmLabel="Move to placeholder and deactivate"
              destructive
              description={
                <>
                  <p>Use this for a duplicate account, so the address can be moved to the person&rsquo;s original account.</p>
                  <p>This account&rsquo;s email changes to a placeholder (for example retired-1042@invalid) and it is deactivated. Its history stays in the activity log. Any profile edits on its enrollments are lost.</p>
                </>
              }
              onConfirm={() => retireAccount(person.id)}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/** Search every account (doc §5.4, §5.6, §7). Search and selection live in the URL. */
export function PeopleSearch({ query, results, selected }: { query: string; results: PersonAccount[]; selected: PersonAccount | null }) {
  return (
    <div className="grid gap-5">
      <form className="flex max-w-lg items-end gap-2" action="/admin/people">
        <div className="grid flex-1 gap-1.5">
          <Label htmlFor="people-search">Search by name or email</Label>
          <div className="relative">
            <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="people-search" name="q" type="search" defaultValue={query} className="pl-9" />
          </div>
        </div>
        <Button type="submit">Search</Button>
      </form>

      {selected && <PersonCard key={selected.id + selected.email + selected.status} person={selected} query={query} />}

      {query.trim() && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Login email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Events</TableHead>
              <TableHead>Status</TableHead>
              <TableHead><span className="sr-only">Open</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((p) => (
              <TableRow key={p.id} className={p.id === selected?.id ? "bg-hers-panel/60" : undefined}>
                <TableCell className="font-bold">{p.name}</TableCell>
                <TableCell>{p.email}</TableCell>
                <TableCell>{p.role === "staff" ? "Staff" : "Attendee"}</TableCell>
                <TableCell>{summary(p.enrollments)}</TableCell>
                <TableCell><Badge variant={statusVariant[p.status]}>{p.status}</Badge></TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/people?q=${encodeURIComponent(query)}&id=${p.id}`} className="no-underline">Open</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {results.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-muted-foreground">No accounts match &ldquo;{query}&rdquo;.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
