import { SiteHeader } from "@/components/layout/site-header";
import { StaffSidebar } from "@/components/layout/staff-sidebar";

const nav = [
  { href: "/admin/account", label: "Account" },
  // TODO: replace with a Better Auth sign-out button.
  { href: "/login", label: "Log out" },
];

/** TODO: redirect non-staff to /dashboard (check role from the Better Auth session). */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader staff nav={nav} homeHref="/admin" />
      <div className="md:flex">
        <StaffSidebar />
        <main className="min-w-0 flex-1 px-4 py-6 pb-16 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </>
  );
}
