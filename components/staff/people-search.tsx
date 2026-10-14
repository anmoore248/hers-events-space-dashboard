"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmButton } from "@/components/confirm-button";
import type { PersonAccount } from "@/lib/mock-data";

const statusVariant = { Active: "default", "Password cleared": "coral", Deactivated: "muted" } as const;

export function PeopleSearch({ people }: { people: PersonAccount[] }) {
  const [q, setQ] = React.useState("jane");
  const [selectedId, setSelectedId] = React.useState<string | null>("u-jane");
  const [newEmail, setNewEmail] = React.useState("");

  const query = q.trim().toLowerCase();
  const results = query ? people.filter((p) => `${p.name} ${p.email}`.toLowerCase().includes(query)) : [];
  const selected = people.find((p) => p.id === selectedId);
  const first = selected?.name.split(" ")[0];
  const clash = people.find((p) => p.email.toLowerCase() === newEmail.trim().toLowerCase() && p.id !== selectedId);

  return (
    <div className="grid gap-5">
      <div className="grid max-w-sm gap-1.5">
        <Label htmlFor="people-search">Search by name or email</Label>
        <Input id="people-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {query && (
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
              <TableRow key={p.id} className={p.id === selectedId ? "bg-hers-panel/60" : undefined}>
                <TableCell className="font-bold">{p.name}</TableCell>
                <TableCell>{p.email}</TableCell>
                <TableCell>{p.role}</TableCell>
                <TableCell>{p.eventsSummary}</TableCell>
                <TableCell><Badge variant={statusVariant[p.status]}>{p.status}</Badge></TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => setSelectedId(p.id)}>Open</Button>
                </TableCell>
              </TableRow>
            ))}
            {results.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-muted-foreground">No accounts match &ldquo;{q}&rdquo;.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      )}

      {selected && (
        <Card>
          <CardContent className="flex flex-wrap items-start justify-between gap-4 pt-5">
            <div>
              <h2 className="text-lg font-bold text-primary">{selected.name}</h2>
              <p className="text-xs text-muted-foreground">{selected.email} · {selected.role} · created {selected.createdOn}</p>
              <p className="mt-2 text-xs"><strong>Enrollments:</strong> {selected.enrollments}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ConfirmButton
                label="Reset password"
                title="Reset password"
                confirmLabel="Reset password"
                description={
                  <p>
                    Removes {first}&rsquo;s password and signs them out everywhere. Reply only to <strong>{selected.email}</strong> and tell them to sign up again with any of their access keys.
                  </p>
                }
              />
              <ConfirmButton
                label="Change email"
                title="Change email"
                confirmLabel="Change email"
                description={<p>{first} will be signed out everywhere and log in with the new address and their existing password.</p>}
              >
                <div className="grid gap-1.5">
                  <Label htmlFor="new-email">New email</Label>
                  <Input id="new-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="name@newuniv.edu" />
                  {clash ? (
                    <p role="alert" className="rounded-md border border-destructive bg-destructive/10 p-3 text-xs">
                      <strong>{clash.email}</strong> already belongs to {clash.name} ({clash.enrollments}). Free up the address first: change that account&rsquo;s email to a placeholder and deactivate it, then try again.
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground"><strong>Reminder:</strong> also update this email in Salesforce.</p>
                  )}
                </div>
              </ConfirmButton>
              <ConfirmButton
                label="Deactivate"
                title={`Deactivate ${selected.name}?`}
                confirmLabel="Deactivate"
                destructive
                variant="destructive"
                description={<p>Blocks login and ends their sessions. The account and its history are kept.</p>}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
