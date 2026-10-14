"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmButton } from "@/components/confirm-button";
import { CopyButton } from "@/components/copy-button";
import { PageTitle } from "@/components/page-title";
import type { StaffMember } from "@/lib/mock-data";

function InviteStaffDialog() {
  const [email, setEmail] = React.useState("");
  const [link, setLink] = React.useState<string | null>(null);
  return (
    <Dialog onOpenChange={(o) => !o && (setEmail(""), setLink(null))}>
      <DialogTrigger asChild>
        <Button><Plus /> Invite staff</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite staff</DialogTitle>
          <DialogDescription>You&rsquo;ll get a one-time sign-up link to send from your own email.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5">
          <Label htmlFor="invite-email">Email</Label>
          <Input id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {/* TODO: server action — create staff_invites row, return its token. */}
        <Button className="w-fit" disabled={!email.includes("@")} onClick={() => setLink("https://hersnetwork-events.netlify.app/staff-signup/[token]")}>
          Create invite
        </Button>
        {link && (
          <div className="grid gap-1.5">
            <Label htmlFor="invite-link">One-time sign-up link — send it from your own email</Label>
            <div className="flex gap-2">
              <Input id="invite-link" value={link} readOnly />
              <CopyButton value={link} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function StaffTable({ staff }: { staff: StaffMember[] }) {
  return (
    <>
      <PageTitle title="Staff" action={<InviteStaffDialog />} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {staff.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-bold">{s.name ?? s.email}</TableCell>
              <TableCell>{s.name ? s.email : ""}</TableCell>
              <TableCell><Badge variant={s.status === "Active" ? "default" : "muted"}>{s.status}</Badge></TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2">
                  {s.status === "Invite pending" ? (
                    <>
                      <CopyButton value="https://hersnetwork-events.netlify.app/staff-signup/[token]" label="Copy link" />
                      <ConfirmButton label="Cancel invite" title="Cancel this invite?" confirmLabel="Cancel invite" destructive description={<p>The link stops working immediately.</p>} />
                    </>
                  ) : (
                    <>
                      <ConfirmButton label="Edit email" title={`Edit email for ${s.name}`} confirmLabel="Save email" description={<p>They&rsquo;ll be signed out everywhere. Duplicate addresses are rejected.</p>}>
                        <Input aria-label="New email" type="email" defaultValue={s.email} />
                      </ConfirmButton>
                      <ConfirmButton label="Clear password" title={`Clear ${s.name}'s password?`} confirmLabel="Clear password" description={<p>Signs them out everywhere. Send them a new staff invite link to set a new password.</p>} />
                      <ConfirmButton label="Deactivate" title={`Deactivate ${s.name}?`} confirmLabel="Deactivate" destructive description={<p>Blocks login and keeps their history. The last active staff account can&rsquo;t be deactivated.</p>} />
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
