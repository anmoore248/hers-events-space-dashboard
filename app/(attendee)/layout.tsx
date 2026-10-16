import { SiteHeader } from "@/components/layout/site-header";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const nav = [
  { href: "/dashboard", label: "My events", match: ["/dashboard", "/events"] },
  { href: "/profile", label: "My profile" },
  { href: "/account", label: "Account" },
  // TODO: replace with a Better Auth sign-out button.
  { href: "/login", label: "Log out" },
];

export default async function AttendeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <>
      <SiteHeader
        nav={nav}
        homeHref="/dashboard"
        user_name={session.user.name}
      />
      <main className="pb-16">{children}</main>
    </>
  );
}
