import type { Metadata } from "next";
import { AccountPanel } from "@/components/account-panel";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Account" };

export default async function StaffAccountPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login");

  return (
    <div className="max-w-md">
      <h1 className="text-primary mb-5 text-2xl font-bold">Account</h1>
      <AccountPanel user_name={session.user.name} email={session.user.email} />
    </div>
  );
}
