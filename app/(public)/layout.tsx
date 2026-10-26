import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { getCurrentUser } from "@/lib/auth/session";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  // Already signed in: go straight to your own home page.
  const user = await getCurrentUser();
  if (user) redirect(user.role === "staff" ? "/admin" : "/dashboard");
  return (
    <>
      <SiteHeader homeHref="/login" />
      <main className="mx-auto w-full max-w-md px-4 py-12 sm:py-16">{children}</main>
    </>
  );
}
