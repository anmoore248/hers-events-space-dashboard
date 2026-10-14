import type { Metadata } from "next";
import { AccountPanel } from "@/components/account-panel";
import { currentStaff } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Account" };

export default function StaffAccountPage() {
  return (
    <div className="max-w-md">
      <h1 className="mb-5 text-2xl font-bold text-primary">Account</h1>
      <AccountPanel email={currentStaff.email} />
    </div>
  );
}
