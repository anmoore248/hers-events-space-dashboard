import { SiteHeader } from "@/components/layout/site-header";

const nav = [
  { href: "/dashboard", label: "My events", match: ["/dashboard", "/events"] },
  { href: "/profile", label: "My profile" },
  { href: "/account", label: "Account" },
  // TODO: replace with a Better Auth sign-out button.
  { href: "/login", label: "Log out" },
];

export default function AttendeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader nav={nav} homeHref="/dashboard" />
      <main className="pb-16">{children}</main>
    </>
  );
}
