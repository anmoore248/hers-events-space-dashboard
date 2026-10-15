import type { Metadata } from "next";
import { StaffSignUpForm } from "@/components/forms/staff-sign-up-form";

export const metadata: Metadata = { title: "Create your staff account" };

export default async function StaffSignUpPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  // TODO: look up staff_invites by token; show an error if used or missing.
  const invite = {
    token,
    email: "new.staff@hersnetwork.org",
    invitedBy: "Maria Lopez",
    invitedOn: "Oct 8, 2026",
  };

  return (
    <>
      <h1 className="text-primary mb-2 text-2xl font-bold">
        Create your staff account
      </h1>
      <p className="text-muted-foreground mb-6 text-sm">
        You were invited by {invite.invitedBy} on {invite.invitedOn}.
      </p>
      <StaffSignUpForm email={invite.email} />
    </>
  );
}
