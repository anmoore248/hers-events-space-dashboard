"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmButton } from "@/components/confirm-button";
import { CopyButton } from "@/components/copy-button";
import { FormError } from "@/components/form-error";
import { PageTitle } from "@/components/page-title";
import { useAction } from "@/hooks/use-action";
import {
  changeEmail,
  clearPassword,
  setDeactivated,
} from "@/lib/actions/people";
import { cancelStaffInvite, inviteStaff } from "@/lib/actions/staff";
import type { StaffRow } from "@/lib/types";

function InviteStaffDialog() {
  const [email, setEmail] = React.useState("");
  const [link, setLink] = React.useState<string | null>(null);
  const { run, pending, error, setError } = useAction();
  return (
    <Dialog
      onOpenChange={(o) => {
        if (!o) {
          setEmail("");
          setLink(null);
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus /> Invite staff
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite staff</DialogTitle>
          <DialogDescription>
            You&rsquo;ll get a one-time sign-up link to send from your own
            email.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const res = await run(() => inviteStaff(email));
            if (res.ok) setLink(res.data.url);
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setLink(null);
              }}
            />
          </div>
          <FormError message={error} />
          <Button
            type="submit"
            className="w-fit"
            disabled={!email.includes("@") || pending}
          >
            {pending ? "Creating…" : "Create invite"}
          </Button>
        </form>
        {link && (
          <div className="grid gap-1.5">
            <Label htmlFor="invite-link">
              One-time sign-up link — send it from your own email
            </Label>
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

function EditEmail({
  id,
  name,
  email,
}: {
  id: string;
  name: string;
  email: string;
}) {
  const [value, setValue] = React.useState(email);
  return (
    <ConfirmButton
      label="Edit email"
      title={`Edit email for ${name}`}
      confirmLabel="Save email"
      description={
        <p>
          They&rsquo;ll be signed out everywhere and log in with the new
          address. Duplicate addresses are rejected.
        </p>
      }
      onConfirm={() => changeEmail(id, value)}
    >
      <Input
        aria-label="New email"
        type="email"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </ConfirmButton>
  );
}

const statusVariant = {
  Active: "default",
  "Password cleared": "coral",
  Deactivated: "muted",
} as const;

export function StaffTable({ rows }: { rows: StaffRow[] }) {
  return (
    <>
      <PageTitle
        title="Staff"
        description="All staff are equal. Every action here is recorded in the activity log."
        action={<InviteStaffDialog />}
      />
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
          {rows.map((s) =>
            s.kind === "invite" ? (
              <TableRow key={s.id}>
                <TableCell className="font-bold">{s.email}</TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {s.invitedByName && `Invited by ${s.invitedByName}`}
                </TableCell>
                <TableCell>
                  <Badge variant="muted">Invite pending</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <CopyButton value={s.signUpUrl} label="Copy link" />
                    <ConfirmButton
                      label="Cancel invite"
                      title="Cancel this invite?"
                      confirmLabel="Cancel invite"
                      destructive
                      description={<p>The link stops working immediately.</p>}
                      onConfirm={() => cancelStaffInvite(s.id)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <TableRow key={s.id}>
                <TableCell className="font-bold">
                  {s.name}
                  {s.isMe && (
                    <span className="text-muted-foreground ml-1 font-normal">
                      (you)
                    </span>
                  )}
                </TableCell>
                <TableCell>{s.email}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[s.status]}>{s.status}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {!s.isMe && (
                      <>
                        <EditEmail id={s.id} name={s.name} email={s.email} />
                        <ConfirmButton
                          label="Clear password"
                          title={`Clear ${s.name}'s password?`}
                          confirmLabel="Clear password"
                          description={
                            <p>
                              Signs them out everywhere. Then send them a new
                              staff invite link for their address to set a new
                              password.
                            </p>
                          }
                          onConfirm={() => clearPassword(s.id)}
                        />
                        {s.status === "Deactivated" ? (
                          <ConfirmButton
                            label="Reactivate"
                            title={`Reactivate ${s.name}?`}
                            confirmLabel="Reactivate"
                            onConfirm={() => setDeactivated(s.id, false)}
                          />
                        ) : (
                          <ConfirmButton
                            label="Deactivate"
                            title={`Deactivate ${s.name}?`}
                            confirmLabel="Deactivate"
                            destructive
                            description={
                              <p>
                                Blocks login and keeps their history. The last
                                active staff account can&rsquo;t be deactivated.
                              </p>
                            }
                            onConfirm={() => setDeactivated(s.id, true)}
                          />
                        )}
                      </>
                    )}
                    {s.isMe && (
                      <span className="text-muted-foreground text-xs">
                        Change your password under Account.
                      </span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ),
          )}
          {rows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-muted-foreground py-8 text-center"
              >
                There are no staff accounts at this time.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
}
