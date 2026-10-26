import { SiteHeader } from "@/components/layout/site-header";
import { requireUser } from "@/lib/auth/session";

const nav = [
  { href: "/dashboard", label: "My events", match: ["/dashboard", "/events"] },
  { href: "/profile", label: "My profile" },
  { href: "/account", label: "Account" },
];

export default async function AttendeeLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return (
    <>
      <SiteHeader nav={nav} homeHref="/dashboard" signOut />
      <main className="pb-16">{children}</main>
    </>
  );
}
