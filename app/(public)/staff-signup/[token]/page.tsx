import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { StaffSignUpForm } from "@/components/forms/staff-sign-up-form";
import { getSettings, getStaffInvite } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Create your staff account" };

export default async function StaffSignUpPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await getStaffInvite(token);

  if (!invite) {
    const { helpEmail } = await getSettings();
    return (
      <>
        <h1 className="mb-6 text-2xl font-bold text-primary">This link isn&rsquo;t valid</h1>
        <Card>
          <CardContent className="grid gap-3 pt-5 text-sm leading-relaxed">
            <p>The staff sign-up link has already been used, was cancelled, or was copied incompletely.</p>
            <p>Ask another staff member for a new invite, or email {helpEmail}.</p>
          </CardContent>
        </Card>
        <Link href="/login" className="mt-6 inline-block text-xs text-primary underline">Back to login</Link>
      </>
    );
  }

  return (
    <>
      <h1 className="mb-2 text-2xl font-bold text-primary">{invite.existingName ? "Set your staff password" : "Create your staff account"}</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {invite.existingName && "Choose a new password for your staff account. "}
        {invite.invitedByName ? `You were invited by ${invite.invitedByName} on ${formatDate(invite.createdAt)}.` : `Invited on ${formatDate(invite.createdAt)}.`}
      </p>
      <StaffSignUpForm token={invite.token} email={invite.email} name={invite.existingName} />
    </>
  );
}
