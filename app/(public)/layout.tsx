import { SiteHeader } from "@/components/layout/site-header";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader homeHref="/login" />
      <main className="mx-auto w-full max-w-md px-4 py-12 sm:py-16">
        {children}
      </main>
    </>
  );
}
