import { SiteHeader } from "@/components/layout/site-header";
import { StaffSidebar } from "@/components/layout/staff-sidebar";
import { requireStaff } from "@/lib/auth/session";

const nav = [{ href: "/admin/account", label: "Account" }];

/** Every /admin page: staff only. Attendees are sent to their dashboard. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireStaff();
  return (
    <>
      <SiteHeader staff nav={nav} homeHref="/admin" signOut />
      <div className="md:flex">
        <StaffSidebar />
        <main className="min-w-0 flex-1 px-4 py-6 pb-16 sm:px-6 lg:px-8">{children}</main>
      </div>
    </>
  );
}
