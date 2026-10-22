import type { Metadata } from "next";
import { AccountPanel } from "@/components/account-panel";
import { getCurrentUser, getSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const [user, { helpEmail }] = await Promise.all([getCurrentUser(), getSettings()]);
  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-primary">Account</h1>
      <AccountPanel email={user?.email} helpEmail={helpEmail} />
    </div>
  );
}
