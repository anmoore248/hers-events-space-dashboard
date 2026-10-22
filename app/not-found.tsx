import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-2xl font-bold text-primary">Page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">The link may be out of date, or you may not have access to this event.</p>
      <Link href="/" className="mt-6 inline-block text-sm text-primary underline">Go to my events</Link>
    </main>
  );
}
