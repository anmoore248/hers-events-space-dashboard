import type { Metadata } from "next";
import { AccountPanel } from "@/components/account-panel";
import { getCurrentUser, getSettings, requireStaffPage } from "@/lib/data";

export const metadata: Metadata = { title: "Account" };

export default async function StaffAccountPage() {
  await requireStaffPage();
  const [user, { helpEmail }] = await Promise.all([getCurrentUser(), getSettings()]);
  return (
    <div className="max-w-md">
      <h1 className="mb-5 text-2xl font-bold text-primary">Account</h1>
      <AccountPanel email={user?.email} helpEmail={helpEmail} />
    </div>
  );
}
