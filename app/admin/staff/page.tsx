import type { Metadata } from "next";
import { StaffTable } from "@/components/staff/staff-table";
import { staffMembers } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Staff" };

export default function StaffPage() {
  return (
    <div className="max-w-5xl">
      <StaffTable staff={staffMembers} />
    </div>
  );
}
