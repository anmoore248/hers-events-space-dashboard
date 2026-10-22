import type { Metadata } from "next";
import { StaffTable } from "@/components/staff/staff-table";
import { getStaffRows, requireStaffPage } from "@/lib/data";

export const metadata: Metadata = { title: "Staff" };

export default async function StaffPage() {
  await requireStaffPage();
  return (
    <div className="max-w-5xl">
      <StaffTable rows={await getStaffRows()} />
    </div>
  );
}
