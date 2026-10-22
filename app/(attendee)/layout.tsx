import { SiteHeader } from "@/components/layout/site-header";

const nav = [
  { href: "/dashboard", label: "My events", match: ["/dashboard", "/events"] },
  { href: "/profile", label: "My profile" },
  { href: "/account", label: "Account" },
];

export default function AttendeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader nav={nav} homeHref="/dashboard" signOut />
      <main className="pb-16">{children}</main>
    </>
  );
}
